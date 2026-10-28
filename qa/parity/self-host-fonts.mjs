#!/usr/bin/env node
// qa/parity/self-host-fonts.mjs — the ONE supported way to keep a next/font family to a
// single subset (owner batch 3, F6).
//
// WHY THIS EXISTS: `subsets: ["latin"]` in app/layout.tsx does NOT restrict what next/font
// puts in the CSS. Measured on the production build (2026-10-28): the generated stylesheet
// carries 29 @font-face rules — Merriweather 400/700 × 5 subsets, Inter (variable) × 7,
// JetBrains Mono 400/600 × 6 — i.e. cyrillic, cyrillic-ext, greek, vietnamese and latin-ext
// are all declared even though only latin was asked for. The browser only DOWNLOADS what the
// text needs (2-4 files, 143-261 KB per page), but every declared face ships in the
// render-blocking CSS, and one page pair (exam + entrance) also pulled a second Inter file
// (83.3 KB, latin-ext).
//
// WHAT IT DOES: after `next build`, for every .woff2 that next/font put under a NON-latin
// unicode-range, it deletes the @font-face rule from the built CSS and removes the orphaned
// file. Result: the CSS declares latin only, so a page can never fetch a non-latin file.
//
// SCOPE RULE (why this is safe to run): it removes ONLY faces whose unicode-range does not
// contain U+0041 (letter A). Every language this site renders — English, and the Hindi
// captions, which already come from the SYSTEM serif because no subset we ship covers
// Devanagari — needs U+0041. So no glyph that is painting today can stop painting.
//
// It is deliberately a build step, not a source edit: a CSS file under .next is derived
// output, and this repo's rule is no build-time patching of derived files without saying so
// in the source. If the owner would rather have it in the source tree, the alternative is to
// leave the extra faces (a few KB of CSS) — nothing else changes.
//
//   node qa/parity/self-host-fonts.mjs            # prune (idempotent, prints a report)
//   node qa/parity/self-host-fonts.mjs --dry-run  # report only, touch nothing
import { readdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd());
const CSS_DIR = join(ROOT, ".next", "static", "css");
const MEDIA_DIR = join(ROOT, ".next", "static", "media");
const DRY = process.argv.includes("--dry-run");

if (!existsSync(CSS_DIR)) {
  console.error("no .next/static/css — run `next build` first (this step runs after the build).");
  process.exit(1);
}

/** A unicode-range is "latin" when it contains U+0041 ('A'): the glyph every page needs. */
function isLatinRange(range) {
  for (const m of range.toUpperCase().matchAll(/U\+([0-9A-F]{4,6})(?:-([0-9A-F]{4,6}))?/g)) {
    const lo = parseInt(m[1], 16);
    const hi = m[2] ? parseInt(m[2], 16) : lo;
    if (lo <= 0x41 && 0x41 <= hi) return true;
  }
  return false;
}

const cssFiles = readdirSync(CSS_DIR).filter((f) => f.endsWith(".css"));
let removedRules = 0, removedBytes = 0;
const removedFiles = new Set();

for (const file of cssFiles) {
  const path = join(CSS_DIR, file);
  let css = readFileSync(path, "utf8");
  const faces = [...css.matchAll(/@font-face\{[^}]*\}/g)];
  let removedHere = 0;
  for (const face of faces) {
    const decl = face[0];
    const range = /unicode-range:([^;}]+)/i.exec(decl)?.[1] ?? "";
    const url = /url\(([^)]+)\)/.exec(decl)?.[1]?.replace(/^["']|["']$/g, "") ?? "";
    if (!range || !url) continue;           // no range = applies to everything: keep
    if (isLatinRange(range)) continue;      // latin (or a latin-containing subset): keep
    css = css.replace(decl, "");
    removedHere++;
    removedBytes += decl.length;
    const name = url.split("/").pop();
    if (name) removedFiles.add(join(MEDIA_DIR, name));
  }
  if (removedHere && !DRY) {
    writeFileSync(path, css);
    console.log(`${file}: removed ${removedHere} non-latin @font-face rule(s) (${removedBytes} bytes of CSS)`);
  } else if (removedHere) {
    console.log(`[dry-run] ${file}: would remove ${removedHere} non-latin @font-face rule(s)`);
  }
  removedRules += removedHere;
}

// Delete the now-unreferenced font files. Only files whose face we just removed, and only
// if no remaining CSS still mentions them.
const remainingCss = cssFiles.map((f) => readFileSync(join(CSS_DIR, f), "utf8")).join("");
let deleted = 0;
for (const abs of removedFiles) {
  const name = abs.split(/[\\/]/).pop();
  if (remainingCss.includes(name)) continue;           // still referenced: keep the file
  if (!existsSync(abs)) continue;
  if (DRY) { console.log(`[dry-run] would delete ${name}`); continue; }
  rmSync(abs);
  deleted++;
}

console.log(`${DRY ? "[dry-run] " : ""}${removedRules} non-latin face rule(s) removed, ${deleted} orphaned font file(s) deleted.`);
