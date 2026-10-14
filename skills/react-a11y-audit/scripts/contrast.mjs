#!/usr/bin/env node
// Computes the WCAG contrast ratio of color pairs and the closest colors that pass.
// Usage: node contrast.mjs [--project <dir>] [--v3 | --v4] [--min 3] <foreground> <background> [<foreground> <background> ...]
// A color is a hex, rgb(), hsl() or oklch() value, a basic CSS name (white, red) or a Tailwind class (text-gray-400, bg-brand-500, text-white/70).
// Example: node contrast.mjs --project . text-gray-400 bg-white text-white "#0ea5e9"

import path from "node:path";
import { toHex, loadTailwind, twHeader, resolveClass, shades } from "./tw-color.mjs";

const args = process.argv.slice(2);
let project = process.cwd();
let version = null;
let min = 4.5;
const colors = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--project") project = path.resolve(args[++i]);
  else if (args[i] === "--v3") version = 3;
  else if (args[i] === "--v4") version = 4;
  else if (args[i] === "--min") min = Number(args[++i]);
  else colors.push(args[i]);
}
if (colors.length === 0 || colors.length % 2 || !(min > 1)) {
  console.log("Usage: node contrast.mjs [--project <dir>] [--v3 | --v4] [--min 3] <foreground> <background> [<foreground> <background> ...]");
  process.exit(1);
}

const channels = (hex) => hex.slice(1).match(/../g).map((h) => parseInt(h, 16));
const toHexColor = (rgb) => "#" + rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
const lum = (hex) => {
  const [r, g, b] = channels(hex).map((c) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
// Rounded like other contrast checkers, but a ratio just below a minimum is cut, so 4.499 never shows as 4.50.
const fmt = (r) => {
  const rounded = r.toFixed(2);
  const crosses = [3, 4.5, min].some((t) => r < t && Number(rounded) >= t);
  return `${crosses ? (Math.floor(r * 100) / 100).toFixed(2) : rounded}:1`;
};
// Browsers blend a transparent color with what's behind it in sRGB.
const mix = (fg, bg, alpha) => toHexColor(channels(fg).map((c, i) => c * alpha + channels(bg)[i] * (1 - alpha)));

// Moves a color toward white or black in 1% steps until it passes, so the hue stays close to the original design.
function closest(hex, toward, passes) {
  const end = toward === "white" ? 255 : 0;
  for (let t = 0; t <= 1.0001; t += 0.01) {
    const candidate = toHexColor(channels(hex).map((c) => c + (end - c) * t));
    if (passes(candidate)) return candidate;
  }
  return null;
}

let tw = null;
async function read(arg) {
  const hex = toHex(arg);
  if (hex) return { arg, value: hex };
  tw ??= await loadTailwind(project, version);
  const r = resolveClass(arg, tw);
  if (r.problem === "not a color utility") return { arg, problem: "not a color this script can read: use a hex, rgb(), hsl(), oklch() or a Tailwind color class" };
  return { arg, ...r };
}

// The side of a pair for one Tailwind version: its hex, or why it can't be used.
function pick(side, ver) {
  if (side.problem) return { ...side };
  if (side.value) return { ...side, hex: side.value, note: side.arg.toLowerCase() === side.value ? null : "" };
  const f = side.found.find((x) => x.ver === ver || x.ver === null);
  if (!f.hex) return { ...side, problem: f.note };
  if (side.opacity && side.alpha === null) return { ...side, problem: `opacity ${side.opacity} this script can't read: check in the browser` };
  return { ...side, hex: f.hex, note: f.note, ver };
}

const verdict = (r) => {
  const text = r >= 4.5 ? "passes 4.5:1 (normal text) and 3:1 (large text, UI parts)"
    : r >= 3 ? "fails 4.5:1 (normal text), passes 3:1 (large text, UI parts)"
    : "fails 4.5:1 (normal text) and 3:1 (large text, UI parts)";
  return min === 4.5 || min === 3 ? text : `${text}, ${r >= min ? "passes" : "fails"} ${min}:1`;
};

const variantText = (v) => (v.length ? `"${v.join(":")}:"` : "no variant");

// A shade from the same palette, then the closest new color. `ratioWith` gives the pair's ratio when this side becomes `hex`.
function suggestion(role, side, toward, ratioWith) {
  const passes = (hex) => ratioWith(hex) >= min;
  const parts = [];
  let palette = "";
  const family = side.ver && side.color.match(/^(.+)-\d+$/)?.[1];
  if (family) {
    const current = lum(side.hex);
    const options = shades(side.color, side.ver, tw)
      .filter((s) => (toward === "white" ? lum(s.hex) > current : lum(s.hex) < current))
      .sort((a, b) => Math.abs(lum(a.hex) - current) - Math.abs(lum(b.hex) - current));
    const shade = options.find((s) => passes(s.hex));
    if (shade) {
      const cls = `${side.variants.map((v) => v + ":").join("")}${side.prefix}-${shade.name}${side.opacity ? "/" + side.opacity : ""}`;
      parts.push(`${cls} ${shade.hex} (${fmt(ratioWith(shade.hex))}, same palette)`);
    } else palette = ` No other ${family} shade in the palette passes.`;
  }
  const near = closest(side.hex, toward, passes);
  if (near) parts.push(`${near} (${fmt(ratioWith(near))}, closest to the current color)`);
  if (!parts.length) return `  The ${role} can't get ${toward === "white" ? "light" : "dark"} enough to reach ${min}:1.`;
  return `  To reach ${min}:1, change the ${role} to ${parts.join(" or ")}.${palette}`;
}

function report(fgSide, bgSide, ver, label) {
  const fg = pick(fgSide, ver);
  const bg = pick(bgSide, ver);
  const name = `${label}${fg.arg} on ${bg.arg}`;
  if (!bg.problem && bg.opacity) bg.problem = "has opacity, so its color depends on what is behind it: check in the browser";
  const problems = [fg, bg].filter((s) => s.problem).map((s) => `  ${s.arg}: ${s.problem}`);
  if (problems.length) return [`${name}: can't compute`, ...problems];

  const alpha = fg.alpha ?? null;
  const shown = (fgHex, bgHex) => (alpha === null ? fgHex : mix(fgHex, bgHex, alpha));
  const r = ratio(shown(fg.hex, bg.hex), bg.hex);
  const lines = [`${name}: ${fmt(r)}, ${verdict(r)}`];
  for (const s of [fg, bg]) {
    if (s.note === null) continue;
    const where = s.variants?.length ? ` (only with ${s.variants.join(":")}:)` : "";
    const blend = s === fg && alpha !== null ? `, at ${Math.round(alpha * 100)}% opacity shows as ${shown(fg.hex, bg.hex)}` : "";
    lines.push(`  ${s.arg}  ${s.hex}${s.note ? "  " + s.note : ""}${blend}${where}`);
  }
  if (fg.variants && bg.variants && fg.variants.join(":") !== bg.variants.join(":")) {
    lines.push(`  Note: the foreground applies with ${variantText(fg.variants)} and the background with ${variantText(bg.variants)}. Check that they show together.`);
  }
  if (r < min) {
    const fgLighter = lum(shown(fg.hex, bg.hex)) > lum(bg.hex);
    const fgLine = suggestion("foreground", fg, fgLighter ? "white" : "black", (hex) => ratio(shown(hex, bg.hex), bg.hex));
    const bgLine = suggestion("background", bg, fgLighter ? "black" : "white", (hex) => ratio(shown(fg.hex, hex), hex));
    // Light text on a darker background: changing the background is usually the fix, so it comes first.
    if (fgLighter) lines.push(bgLine, fgLine);
    else lines.push(fgLine, ...(bgLine.includes("To reach") ? [bgLine] : []));
  }
  return lines;
}

const sides = [];
for (const arg of colors) sides.push(await read(arg));
const out = tw ? twHeader(tw) : [];
for (let i = 0; i < sides.length; i += 2) {
  const usesTailwind = [sides[i], sides[i + 1]].some((s) => s.found);
  const versions = usesTailwind ? tw.versions : [null];
  for (const ver of versions) out.push(...report(sides[i], sides[i + 1], ver, versions.length > 1 ? `[v${ver}] ` : ""));
}
console.log(out.join("\n"));
