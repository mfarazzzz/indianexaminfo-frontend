/**
 * datePrecedence.test.ts — P0 item 4. The CURRENT EDITION timeline (exam.dates)
 * is the ONE canonical schedule: the key-dates strip, the status card and every
 * Important Dates table (main + all content-type pages) read it, so they can
 * never disagree. An update's own important_dates is an announcement, not a
 * second schedule. This guard fails if a content-type page re-introduces the
 * `post?.importantDates ?? exam.dates` divergence.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { pickKeyDates } from "@/lib/exam/keyDates";

const ROOT = resolve(__dirname, "..");
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out); else if (p.endsWith(".tsx")) out.push(p);
  }
  return out;
}

describe("date precedence — one canonical schedule (the edition)", () => {
  it("no .tsx uses an update's importantDates as a fallback-over ride for the dates table", () => {
    const offenders = walk(resolve(ROOT, "app"))
      .map((f) => [f, readFileSync(f, "utf8")] as const)
      .filter(([, src]) => /post\?\.importantDates\s*\?\?\s*exam\.dates/.test(src))
      .map(([f]) => f.replace(ROOT, ""));
    expect(offenders, "update-vs-edition date divergence reappeared:\n" + offenders.join("\n")).toEqual([]);
  });

  it("pickKeyDates returns only rows from the same exam.dates the list renders (shared source)", () => {
    const dates = [
      { label: "Application Begin", date: "2026-10-01" },
      { label: "Last Date to Apply", date: "2026-11-30" },
      { label: "Exam Date", date: "2026-12-20" },
    ];
    const strip = pickKeyDates(dates, "2026-10-22", 3);
    // every strip row is a member of exam.dates — no third source can appear
    for (const d of strip) expect(dates.some((x) => x.label === d.label && x.date === d.date)).toBe(true);
    // the strip shows the SAME last-date the list shows (30 Nov), never a stale one
    expect(strip.find((d) => d.label === "Last Date to Apply")?.date).toBe("2026-11-30");
  });
});
