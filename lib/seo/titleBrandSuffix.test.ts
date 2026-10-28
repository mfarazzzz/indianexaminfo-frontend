/**
 * titleBrandSuffix.test.ts — the brand suffix is added EXACTLY ONCE (owner batch 4, K2).
 *
 * app/layout.tsx declares `title: { default, template: "%s | IndianExamInfo" }`, so a page
 * title that already ends in the brand reaches the browser doubled. That was real: an exam
 * edition page served "UP Board Class 10 (High School) 2026 — Cycle Details | IndianExamInfo
 * | IndianExamInfo" (measured on the production build). Two ways in: a hard-coded suffix in
 * lib/exam/editionDispatch.tsx, and any CMS `seo_title` that arrives with the brand on it.
 *
 * This scans EVERY title-producing path in the app — each builder with the arguments the
 * routes really pass, every TITLE_PATTERNS entry, and the edition dispatch — and asserts the
 * FINAL composed title (after the layout template) contains the brand exactly once.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildExamMetadata, buildHomepageMetadata, stripBrandSuffix } from "./metadata";
import { buildSEOTitle, getCurrentYear } from "./keywords";

/** The root layout's template, read from the source so this cannot drift from it. */
const ROOT = join(__dirname, "..", "..");
const LAYOUT_SRC = readFileSync(join(ROOT, "app", "layout.tsx"), "utf8");
const TEMPLATE = /template:\s*`([^`]+)`/.exec(LAYOUT_SRC)?.[1] ?? "";

const brandCount = (s: string) => (s.match(/IndianExamInfo/gi) ?? []).length;
/** What the browser ends up with for a page title that is a plain string. */
const finalTitle = (title: string) => TEMPLATE.replace("%s", title);

/**
 * Comments are not titles. Stripped before the source scan with a tiny state machine, so
 * a `//` inside a string ("https://…") is NOT treated as a comment start and a doc comment
 * that QUOTES the template is not reported as an offender. Line breaks are preserved so the
 * reported line numbers stay true.
 */
export function stripComments(src: string): string {
  let out = "";
  let mode: "code" | "line" | "block" | "string" = "code";
  let quote = "";
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    const n = src[i + 1];
    if (mode === "code") {
      if (c === "/" && n === "/") { mode = "line"; i++; continue; }
      if (c === "/" && n === "*") { mode = "block"; i++; continue; }
      if (c === '"' || c === "'" || c === "`") { mode = "string"; quote = c; out += c; continue; }
      out += c;
    } else if (mode === "line") {
      if (c === "\n") { mode = "code"; out += c; }
    } else if (mode === "block") {
      if (c === "\n") out += c;
      else if (c === "*" && n === "/") { mode = "code"; i++; }
    } else {
      out += c;
      if (c === "\\") { out += n ?? ""; i++; continue; }
      if (c === quote) mode = "code";
    }
  }
  return out;
}

describe("the layout template is the brand's only home (K2)", () => {
  it("the layout really uses a %s template (guards this test itself)", () => {
    expect(TEMPLATE).toContain("%s");
    expect(TEMPLATE.match(/IndianExamInfo/gi)?.length).toBe(1);
  });

  it("stripBrandSuffix removes a trailing brand and leaves prose alone", () => {
    expect(stripBrandSuffix("CDS 2026 — Cycle Details | IndianExamInfo")).toBe("CDS 2026 — Cycle Details");
    expect(stripBrandSuffix("UP Board 2026 - IndianExamInfo")).toBe("UP Board 2026");
    expect(stripBrandSuffix("Sarkari Naukri | IndianExamInfo: what to know")).toBe("Sarkari Naukri | IndianExamInfo: what to know");
    expect(stripBrandSuffix("IndianExamInfo")).toBe("IndianExamInfo");   // never blanked
    expect(stripBrandSuffix("Plain title")).toBe("Plain title");
  });

  const titles: Array<[string, string]> = [
    // [label, title as the builder hands it to Next]
    ["exam-entity (current edition)", buildSEOTitle("SSC CGL", "notification")],
    ...["admit-card", "result", "answer-key", "syllabus", "date-sheet", "cutoff",
        "previous-papers", "mock-test", "notification", "application", "books", "unknown-type"]
      .map((ct): [string, string] => [`buildSEOTitle ${ct}`, buildSEOTitle("SSC CGL", ct)]),
    ["edition page (once hard-coded)", buildExamMetadata({
      pageType: "exam-entity",
      title: `UP Board Class 10 (High School) ${getCurrentYear()} — Cycle Details`,
      canonicalUrl: "https://www.indianexaminfo.com/board-exam/state/up-board/up-board-class-10/2026",
    }).title as string],
    ["CMS seo_title that already carries the brand", buildExamMetadata({
      pageType: "exam-entity",
      title: "SSC CHSL 2026 | IndianExamInfo",
      canonicalUrl: "https://www.indianexaminfo.com/sarkari-naukri/ssc/ssc-chsl",
    }).title as string],
    ["pillar page", buildExamMetadata({
      pageType: "pillar",
      title: `Government Vacancies ${getCurrentYear()} — Direct Recruitment`,
      canonicalUrl: "https://www.indianexaminfo.com/sarkari-naukri/bharti",
    }).title as string],
    ["blog post", buildExamMetadata({
      pageType: "blog-post",
      title: "CLAT 2026 Preparation Strategy",
      canonicalUrl: "https://www.indianexaminfo.com/blog/exam-prep/clat-2026-preparation-strategy",
    }).title as string],
  ];

  it.each(titles)("%s → the composed title carries the brand once", (_label, title) => {
    expect(typeof title).toBe("string");
    expect(title).toBeTruthy();
    const composed = finalTitle(String(title));
    expect(brandCount(composed), `final title: ${composed}`).toBe(1);
  });

  it("the home page's real title composes to one brand", () => {
    // app/page.tsx builds metadata with buildHomepageMetadata() and then OVERRIDES the
    // title with its own keyword line, which is what the crawl measures in the browser.
    const homeSrc = readFileSync(join(ROOT, "app", "page.tsx"), "utf8");
    const realHomeTitle = /title:\s*`([^`]+)`/.exec(homeSrc)?.[1] ?? "";
    expect(realHomeTitle).toBeTruthy();
    expect(brandCount(finalTitle(realHomeTitle))).toBe(1);

    // buildHomepageMetadata()'s own `title` still leads with the brand, so if a page ever
    // uses it un-overridden the template would put the brand at both ends. Assert the
    // situation is KNOWN rather than silently ignored: og:title keeps the brand (no template
    // is applied to og:title), the page title must not be used raw.
    const home = buildHomepageMetadata();
    const ogTitle = (home.openGraph as { title?: string } | undefined)?.title ?? "";
    expect(brandCount(String(home.title ?? ""))).toBe(1);   // leading brand only, once
    expect(brandCount(ogTitle)).toBe(1);
  });

  it("no source file hands a trailing brand to a metadata builder", () => {
    // Guards the class, not just the two cases above: the ONLY place the suffix may appear
    // is the layout template itself.
    const offenders: string[] = [];
    const walk = (dir: string) => {
      const fs = require("node:fs") as typeof import("node:fs");
      const path = require("node:path") as typeof import("node:path");
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, e.name);
        if (e.isDirectory()) { walk(abs); continue; }
        if (!/\.(ts|tsx)$/.test(e.name)) continue;
        if (abs.endsWith("metadata.test.ts") || abs.includes("titleBrandSuffix")) continue;
        // Scan CODE only — a doc comment quoting the template is not a title (see stripComments).
        const src = stripComments(fs.readFileSync(abs, "utf8"));
        src.split("\n").forEach((line, i) => {
          if (/title[^(\n]*[`'"][^\n]*[|—–-]\s*IndianExamInfo\s*[`'"]/.test(line)) {
            offenders.push(`${path.relative(join(ROOT), abs)}:${i + 1}: ${line.trim().slice(0, 90)}`);
          }
        });
      }
    };
    walk(join(ROOT, "lib"));
    walk(join(ROOT, "components"));
    walk(join(ROOT, "app"));
    expect(offenders, "titles that hard-code the brand suffix:\n" + offenders.join("\n")).toEqual([]);
  });
});
