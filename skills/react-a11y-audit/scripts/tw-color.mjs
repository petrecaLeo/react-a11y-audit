#!/usr/bin/env node
// Turns Tailwind color classes into hex colors, so contrast can be computed instead of guessed.
// Usage: node tw-color.mjs [--project <dir>] [--v3 | --v4] <class> [<class> ...]
// Example: node tw-color.mjs --project . text-gray-400 bg-white hover:bg-brand-500/80
// contrast.mjs imports the functions below to compute ratios.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// fileURLToPath, not URL.pathname: the pathname keeps spaces and accents encoded (%20, %C3%81).
const here = path.dirname(fileURLToPath(import.meta.url));
const palettes = JSON.parse(fs.readFileSync(path.join(here, "tw-colors.json"), "utf8"));

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "build", "out", "coverage"]);

function walk(dir, ext, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) walk(path.join(dir, entry.name), ext, found);
    else if (entry.isFile() && entry.name.endsWith(ext)) found.push(path.join(dir, entry.name));
  }
  return found;
}

function detectVersion(project) {
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

// The 16 basic CSS color names, plus orange and grey. Other names need a hex.
const NAMED = {
  black: "#000000", silver: "#c0c0c0", gray: "#808080", grey: "#808080", white: "#ffffff", maroon: "#800000",
  red: "#ff0000", purple: "#800080", fuchsia: "#ff00ff", green: "#008000", lime: "#00ff00", olive: "#808000",
  yellow: "#ffff00", navy: "#000080", blue: "#0000ff", teal: "#008080", aqua: "#00ffff", orange: "#ffa500",
};

// Colors with an alpha return null: their color depends on what is behind them.
export function toHex(value) {
  value = value.trim().toLowerCase();
  if (NAMED[value]) return NAMED[value];
  if (/^#[0-9a-f]{3}$/.test(value)) return "#" + [...value.slice(1)].map((c) => c + c).join("");
  if (/^#[0-9a-f]{6}$/.test(value)) return value;
  const rgb = value.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)\s*\)$/);
  if (rgb) return "#" + rgb.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, "0")).join("");
  const hsl = value.match(/^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%\s*\)$/);
  if (hsl) return hslToHex(Number(hsl[1]), Number(hsl[2]) / 100, Number(hsl[3]) / 100);
  // oklch(70.7% 0.022 261.3) as in Tailwind, or oklch(0.707 0.022 261.3) as in shadcn/ui.
  const ok = value.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+|none)\s*\)$/);
  if (ok) return oklchToHex(Number(ok[1]) / (ok[2] ? 100 : 1), Number(ok[3]), ok[4] === "none" ? 0 : Number(ok[4]));
  return null;
}

function hslToHex(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return "#" + [f(0), f(8), f(4)].map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("");
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

// Custom properties in :root and .dark blocks. shadcn/ui keeps its colors there, as oklch() or bare hsl numbers.
function readCssVars(project) {
  const vars = { light: {}, dark: {} };
  for (const file of walk(project, ".css")) {
    for (const [, selector, body] of fs.readFileSync(file, "utf8").matchAll(/(:root|\.dark)\s*\{([^}]*)\}/g)) {
      for (const [, name, value] of body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) vars[selector === ":root" ? "light" : "dark"][name] = value.trim();
    }
  }
  return vars;
}

function substitute(value, vars, mode, depth = 0) {
  return value.replace(/var\(\s*--([\w-]+)\s*(?:,\s*([^)]+))?\)/g, (match, name, fallback) => {
    const found = vars[mode][name] ?? vars.light[name] ?? fallback?.trim();
    if (found === undefined) return match;
    return depth < 5 ? substitute(found, vars, mode, depth + 1) : found;
  });
}

// A color from the project, following var(--x) to :root (light) and .dark. v3 configs often write hsl(var(--x) / <alpha-value>).
function projectColor(raw, vars, from) {
  raw = raw.trim();
  const read = (mode) => toHex(substitute(raw, vars, mode).replace(/\s*\/\s*<alpha-value>/, ""));
  const light = read("light");
  const dark = read("dark");
  const via = raw.match(/var\(\s*--([\w-]+)/)?.[1] ?? null;
  return { hex: light, dark: dark && dark !== light ? dark : null, raw, from, via };
}

// v4: --color-* variables inside @theme blocks of the project's CSS files.
function readV4Theme(project, vars) {
  const colors = {};
  let resetsDefaults = false;
  for (const file of walk(project, ".css")) {
    const css = fs.readFileSync(file, "utf8");
    for (const block of css.matchAll(/@theme[^{]*\{([^}]*)\}/g)) {
      if (/--color-\*\s*:\s*initial/.test(block[1])) resetsDefaults = true;
      for (const [, name, value] of block[1].matchAll(/--color-([\w-]+)\s*:\s*([^;]+);/g)) {
        colors[name] = projectColor(value, vars, path.relative(project, file));
      }
    }
  }
  return { colors, resetsDefaults };
}

// v3: theme.colors (replaces the defaults) and theme.extend.colors in tailwind.config.
async function readV3Config(project, vars) {
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
      if (typeof value === "string") colors[name] = projectColor(value, vars, from);
      else if (value && typeof value === "object") flatten(value, name, from);
    }
  };
  if (config?.theme?.colors) resetsDefaults = true;
  flatten(config?.theme?.colors, "", path.basename(file));
  flatten(config?.theme?.extend?.colors, "", path.basename(file));
  return { colors, resetsDefaults };
}

export async function loadTailwind(project = process.cwd(), version = null) {
  const v = version ?? detectVersion(project);
  const versions = v === 3 || v === 4 ? [v] : [3, 4];
  const vars = readCssVars(project);
  const custom = {};
  for (const ver of versions) custom[ver] = ver === 4 ? readV4Theme(project, vars) : await readV3Config(project, vars);
  return { version: v, versions, custom, vars };
}

export function twHeader(tw) {
  const lines = [tw.version ? `Tailwind v${tw.version}` : "Tailwind version not found: showing v3 and v4 defaults"];
  for (const ver of tw.versions) if (tw.custom[ver].note) lines.push(`Note: ${tw.custom[ver].note}`);
  return lines;
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

// "/70" and "/[70%]" are 0.7, "/[.7]" is 0.7. Anything else (a variable) is null.
function toAlpha(opacity) {
  const n = opacity && opacity.match(/^\[?([\d.]+)(%?)\]?$/);
  if (!n) return null;
  return n[2] || !opacity.startsWith("[") ? Number(n[1]) / 100 : Number(n[1]);
}

const opacityLabel = (opacity) => `${opacity.replace(/[[\]]/g, "")}${/^\d+$/.test(opacity) ? "%" : ""}`;

// One entry in `found` per Tailwind version tried (ver is null for arbitrary values).
export function resolveClass(cls, tw) {
  const p = parse(cls);
  if (!p || (/^\[\d/.test(p.color) && !/^\[#/.test(p.color))) return { cls, problem: "not a color utility" };
  const r = { cls, prefix: p.prefix, color: p.color, variants: p.variants, opacity: p.opacity, alpha: toAlpha(p.opacity), found: [] };
  if (p.color.startsWith("[")) {
    const { hex, dark, via } = projectColor(p.color.slice(1, -1).replace(/_/g, " "), tw.vars, null);
    r.found.push({ ver: null, hex, dark, note: hex ? `arbitrary value${via ? `, --${via} in :root` : ""}` : "arbitrary value this script can't resolve: check in the browser" });
    return r;
  }
  if (NOT_COLOR.test(p.color)) return { cls, problem: "not a color utility" };
  if (["transparent", "current", "inherit"].includes(p.color)) return { cls, problem: `${p.color}: depends on the parent, check in the browser` };
  for (const ver of tw.versions) {
    const own = tw.custom[ver].colors[p.color];
    if (own) {
      r.found.push({ ver, hex: own.hex, dark: own.dark, note: own.hex ? `project color, ${own.from}${own.via ? `, --${own.via} in :root` : ""}` : `project color ${own.raw} in ${own.from} that this script can't resolve: check in the browser` });
    } else if (!tw.custom[ver].resetsDefaults && palettes[`v${ver}`][p.color]) {
      const clipped = ver === 4 && palettes.v4_clipped.includes(p.color) ? ", outside sRGB, so the ratio is close but not exact" : "";
      r.found.push({ ver, hex: palettes[`v${ver}`][p.color], note: `Tailwind v${ver} default${clipped}` });
    } else {
      r.found.push({ ver, hex: null, note: "not found in the defaults or in the project's colors: check in the browser", missing: true });
    }
  }
  return r;
}

// The other shades of a color's family (gray-400 → gray-50 … gray-950), from the defaults and the project.
export function shades(color, ver, tw) {
  const family = color.match(/^(.+)-\d+$/)?.[1];
  if (!family) return [];
  const found = {};
  const defaults = tw.custom[ver].resetsDefaults ? {} : palettes[`v${ver}`];
  for (const [name, hex] of Object.entries(defaults)) if (name.match(/^(.+)-\d+$/)?.[1] === family) found[name] = hex;
  for (const [name, own] of Object.entries(tw.custom[ver].colors)) if (own.hex && name.match(/^(.+)-\d+$/)?.[1] === family) found[name] = own.hex;
  delete found[color];
  return Object.entries(found).map(([name, hex]) => ({ name, hex }));
}

async function main() {
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

  const tw = await loadTailwind(project, version);
  for (const line of twHeader(tw)) console.log(line);

  for (const cls of classes) {
    const r = resolveClass(cls, tw);
    if (r.problem) { console.log(`${cls}  ${r.problem}`); continue; }
    const where = r.variants.length ? ` (only with ${r.variants.join(":")}:)` : "";
    const alpha = r.opacity ? ` at ${opacityLabel(r.opacity)} opacity: blend it with the background before computing contrast, or check in the browser` : "";
    for (const f of r.found) {
      const label = f.ver && tw.versions.length > 1 ? ` [v${f.ver}]` : "";
      const dark = f.dark ? ` (${f.dark} in .dark)` : "";
      console.log(`${cls}${label}  ${f.hex ?? "?"}  ${f.note}${dark}${f.missing ? "" : alpha + where}`);
    }
  }
}

const isMain = (() => {
  try { return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url)); } catch { return false; }
})();
if (isMain) await main();
