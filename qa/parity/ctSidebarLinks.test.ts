/**
 * ctSidebarLinks.test.ts — every content-type link a page emits must resolve.
 *
 * The live browser check (23 Oct, item 6) caught it: the board content-type page's
 * "More for X" box listed result / date-sheet / admit-card / syllabus from a literal
 * array, and two of those URLs 404 for the reference record
 * (/board-exam/state/up-board/zz-test-board-exam/date-sheet → 404, …/syllabus → 404).
 * A link the route then rejects is worse than no link: it is a dead end that looks
 * like content, and Next prefetches it on every page view.
 *
 * The rule this pins is structural, so a new sidebar cannot reintroduce it: any
 * content-type list used to render links in a content-type route must pass through
 * contentTypeHasData — the ONE gate the tab strip, the route's own notFound() and the
 * sitemap all read.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");

function ctRouteSources(): { file: string; src: string }[] {
  const out: { file: string; src: string }[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (name === "node_modules" || name === ".next") continue;
      if (statSync(p).isDirectory()) walk(p);
      else if (name === "page.tsx" && p.includes("[contentType]")) out.push({ file: p.replace(ROOT, ""), src: readFileSync(p, "utf8") });
    }
  };
  walk(join(ROOT, "app"));
  return out;
}

describe("content-type routes never emit an un-gated content-type link", () => {
  const files = ctRouteSources();

  it("the CT routes were found (the guard is not silently scanning nothing)", () => {
    expect(files.length).toBeGreaterThanOrEqual(2);
  });

  for (const { file, src } of files) {
    it(`${file}: a literal content-type list used for links is filtered by contentTypeHasData`, () => {
      // find each `(["…" , "…"] as ContentType[])` literal and require the same
      // expression chain to consult the gate (or the page to have no such list at all).
      const lists = [...src.matchAll(/\(\[[^\]]*"[a-z-]+"[^\]]*\] as ContentType\[\]\)([\s\S]{0,120})/g)];
      for (const [, tail] of lists) {
        expect(tail, `${file} builds links from a hardcoded CT list without the gate`)
          .toMatch(/contentTypeHasData/);
      }
    });
  }

  it("the board sidebar no longer offers date-sheet, which the route cannot serve", () => {
    const board = files.find((f) => f.file.includes("board-exam"));
    expect(board).toBeDefined();
    expect(board!.src).not.toMatch(/"result"\s*,\s*"date-sheet"/);
  });
});
