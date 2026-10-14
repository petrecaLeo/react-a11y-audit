#!/usr/bin/env node
// Turns Tailwind color classes into hex colors, so contrast can be computed instead of guessed.
// Usage: node tw-color.mjs [--project <dir>] [--v3 | --v4] <class> [<class> ...]
// Example: node tw-color.mjs --project . text-gray-400 bg-white hover:bg-brand-500/80

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const here = path.dirname(new URL(import.meta.url).pathname);
const palettes = JSON.parse(fs.readFileSync(path.join(here, "tw-colors.json"), "utf8"));

const args = process.argv.slice(2);
let project = process.cwd();
let version = null;
const classes = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--project") project = path.resolve(args[++i]);
  else if (args[i] === "--v3") version = 3;
  else if (args[i] === "--v4") version = 4;
  else classes.push(args[i]);
}
if (classes.length === 0) {
  console.log("Usage: node tw-color.mjs [--project <dir>] [--v3 | --v4] <class> [<class> ...]");
  process.exit(1);
}

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", "out", "coverage"]);

function walk(dir, ext, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), ext, found);
    else if (entry.isFile() && entry.name.endsWith(ext)) found.push(path.join(dir, entry.name));
  }
  return found;
}

function detectVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(project, "package.json"), "utf8"));
    const range = { ...pkg.dependencies, ...pkg.devDependencies }.tailwindcss;
    const major = range && range.match(/\d+/);
    if (major) return Number(major[0]);
  } catch {}
  if (walk(project, ".css").some((f) => /@import\s+["']tailwindcss["']/.test(fs.readFileSync(f, "utf8")))) return 4;
  if (["js", "cjs", "mjs", "ts"].some((e) => fs.existsSync(path.join(project, `tailwind.config.${e}`)))) return 3;
  return null;
}

function toHex(value) {
  value = value.trim();
  if (/^#[0-9a-f]{3}$/i.test(value)) return "#" + [...value.slice(1)].map((c) => c + c).join("").toLowerCase();
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
  const rgb = value.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*\)$/);
  if (rgb) return "#" + rgb.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, "0")).join("");
  const ok = value.match(/^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+|none)\s*\)$/);
  if (ok) return oklchToHex(Number(ok[1]) / 100, Number(ok[2]), ok[3] === "none" ? 0 : Number(ok[3]));
  return null;
}

// OKLCH to sRGB. Colors outside sRGB are clipped, so their ratios are close but not exact.
function oklchToHex(L, C, H) {
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return "#" + linear.map((c) => {
    c = Math.min(1, Math.max(0, c));
    c = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.round(c * 255).toString(16).padStart(2, "0");
  }).join("");
}

// v4: --color-* variables inside @theme blocks of the project's CSS files.
function readV4Theme() {
  const colors = {};
  let resetsDefaults = false;
  for (const file of walk(project, ".css")) {
    const css = fs.readFileSync(file, "utf8");
    for (const block of css.matchAll(/@theme[^{]*\{([^}]*)\}/g)) {
      if (/--color-\*\s*:\s*initial/.test(block[1])) resetsDefaults = true;
      for (const [, name, value] of block[1].matchAll(/--color-([\w-]+)\s*:\s*([^;]+);/g)) {
        colors[name] = { hex: toHex(value), raw: value.trim(), from: path.relative(project, file) };
      }
    }
  }
  return { colors, resetsDefaults };
}

// v3: theme.colors (replaces the defaults) and theme.extend.colors in tailwind.config.
async function readV3Config() {
  const colors = {};
  let resetsDefaults = false;
  const file = ["js", "cjs", "mjs"].map((e) => path.join(project, `tailwind.config.${e}`)).find(fs.existsSync);
  if (!file) {
    if (fs.existsSync(path.join(project, "tailwind.config.ts"))) return { colors, resetsDefaults, note: "tailwind.config.ts can't be read by this script" };
    return { colors, resetsDefaults };
  }
  let config;
  try {
    const mod = await import(pathToFileURL(file).href);
    config = mod.default ?? mod;
  } catch (error) {
    return { colors, resetsDefaults, note: `couldn't load ${path.basename(file)}: ${error.message}` };
  }
  const flatten = (obj, prefix, from) => {
    for (const [key, value] of Object.entries(obj ?? {})) {
      const name = key === "DEFAULT" ? prefix : prefix ? `${prefix}-${key}` : key;
      if (typeof value === "string") colors[name] = { hex: toHex(value), raw: value, from };
      else if (value && typeof value === "object") flatten(value, name, from);
    }
  };
  if (config?.theme?.colors) resetsDefaults = true;
  flatten(config?.theme?.colors, "", path.basename(file));
  flatten(config?.theme?.extend?.colors, "", path.basename(file));
  return { colors, resetsDefaults };
}

const PREFIXES = ["ring-offset", "text", "bg", "border-x", "border-y", "border-t", "border-r", "border-b", "border-l", "border-s", "border-e",
  "border", "ring", "outline", "decoration", "divide", "placeholder", "caret", "accent", "fill", "stroke", "shadow", "from", "via", "to"];

// Utilities that share a prefix with colors but set something else (size, alignment, width, style).
const NOT_COLOR = /^(\d+(\.\d+)?|px|xs|sm|base|md|lg|xl|\dxl|left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip|none|solid|dashed|dotted|double|hidden|inset|cover|contain|auto|fixed|local|scroll|repeat|no-repeat|repeat-[xy]|gradient-.+|linear-.+|radial-.+|conic-.+|origin-.+|blend-.+|offset-\d+|x-\d+|y-\d+|[trblse]-\d+|[trblse]|x|y|opacity-\d+|wavy|from-font|collapse|separate|top|bottom|clip-.+|shadow-.+)$/;

function parse(cls) {
  const parts = cls.replace(/^!|!$/g, "").split(":");
  const utility = parts.pop();
  const prefix = PREFIXES.find((p) => utility.startsWith(p + "-"));
  if (!prefix) return null;
  let color = utility.slice(prefix.length + 1);
  let opacity = null;
  const slash = color.match(/^(.*?)\/(\[[^\]]+\]|\d+)$/);
  if (slash) [, color, opacity] = slash;
  return { variants: parts, prefix, color, opacity };
}

const v = version ?? detectVersion();
const versionsToTry = v === 3 || v === 4 ? [v] : [3, 4];
const custom = {};
for (const ver of versionsToTry) custom[ver] = ver === 4 ? readV4Theme() : await readV3Config();

console.log(v ? `Tailwind v${v}` : "Tailwind version not found: showing v3 and v4 defaults");
for (const ver of versionsToTry) if (custom[ver].note) console.log(`Note: ${custom[ver].note}`);

for (const cls of classes) {
  const p = parse(cls);
  if (!p) { console.log(`${cls}  not a color utility`); continue; }
  const where = p.variants.length ? ` (only with ${p.variants.join(":")}:)` : "";
  const alpha = p.opacity ? ` at ${p.opacity.replace(/[[\]]/g, "")}${/^\d+$/.test(p.opacity) ? "%" : ""} opacity: blend it with the background before computing contrast, or check in the browser` : "";
  if (/^\[\d/.test(p.color) && !/^\[#/.test(p.color)) { console.log(`${cls}  not a color utility`); continue; }
  if (p.color.startsWith("[")) {
    const hex = toHex(p.color.slice(1, -1).replace(/_/g, " "));
    console.log(`${cls}  ${hex ?? "?"}  ${hex ? "arbitrary value" : "arbitrary value this script can't resolve: check in the browser"}${alpha}${where}`);
    continue;
  }
  if (NOT_COLOR.test(p.color)) { console.log(`${cls}  not a color utility`); continue; }
  if (["transparent", "current", "inherit"].includes(p.color)) { console.log(`${cls}  ${p.color}: depends on the parent, check in the browser`); continue; }
  for (const ver of versionsToTry) {
    const label = versionsToTry.length > 1 ? ` [v${ver}]` : "";
    const own = custom[ver].colors[p.color];
    if (own) {
      console.log(`${cls}${label}  ${own.hex ?? "?"}  ${own.hex ? `project color, ${own.from}` : `project color ${own.raw} in ${own.from} that this script can't resolve: check in the browser`}${alpha}${where}`);
    } else if (!custom[ver].resetsDefaults && palettes[`v${ver}`][p.color]) {
      const clipped = ver === 4 && palettes.v4_clipped.includes(p.color) ? ", outside sRGB, so the ratio is close but not exact" : "";
      console.log(`${cls}${label}  ${palettes[`v${ver}`][p.color]}  Tailwind v${ver} default${clipped}${alpha}${where}`);
    } else {
      console.log(`${cls}${label}  ?  not found in the defaults or in the project's colors: check in the browser`);
    }
  }
}
