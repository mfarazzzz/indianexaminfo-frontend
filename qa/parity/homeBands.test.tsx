/**
 * homeBands.test.tsx — Item 2 reader-trust fixtures for the homepage deadline bands.
 *
 * Renders the REAL DeadlineStrip (server component, renderToStaticMarkup) and the REAL
 * HomeSidebar row builder from fixtures. Pins:
 *   (a) the FULL exam name is shown (not the shortName), and long names are not truncated;
 *   (b) the muted "Check official notice" marker appears ONLY on unverified rows;
 *   (c) the cards fill the width — the desktop column count equals the number of visible
 *       bands (a lone band spans the row; no empty columns to the right);
 *   (d) the mobile lead line also shows the full name.
 * Under PARITY_HTML=1 it also writes standalone HTML (tw.css inlined) for the Playwright
 * screenshot step (qa/parity/homeBands-shot.mjs) at 360 and 1366.
 */
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DeadlineStrip } from "@/components/homepage/DeadlineStrip";
import { buildImportantDateRows } from "@/components/homepage/HomeSidebar";
import { UNVERIFIED_MARKER } from "@/lib/exam/unverifiedMarker";
import type { DeadlineBands, DeadlineBandItem } from "@/services/examService";
import type { ExamEntity } from "@/types/exam";

const OUT = resolve(process.cwd(), "qa/parity");

const bandItem = (over: Partial<DeadlineBandItem>): DeadlineBandItem => ({
  examId: "e", slug: "s", pillar: "government-exam", name: "N", shortName: "N",
  category: "ssc", derivedStatus: "upcoming", date: "2026-10-28", verified: false, ...over,
});

const bands = (over: Partial<DeadlineBands> = {}): DeadlineBands => ({
  today: "2026-10-24", closingSoon: [], admitCardOut: [], resultsOut: [], examsThisMonth: [], ...over,
});

const renderStrip = (b: DeadlineBands) => renderToStaticMarkup(createElement(DeadlineStrip, { bands: b }));

describe("DeadlineStrip — full name + unverified marker + width fill", () => {
  it("(a) shows the FULL name, not the short name", () => {
    const html = renderStrip(bands({
      closingSoon: [bandItem({ name: "Uttar Pradesh Police Constable Recruitment 2026", shortName: "UP Police", verified: true })],
    }));
    expect(html).toContain("Uttar Pradesh Police Constable Recruitment 2026");
    expect(html).not.toContain(">UP Police<"); // short name is no longer the visible label
  });

  it("(b) the marker appears ONLY on unverified rows", () => {
    const unverified = renderStrip(bands({ closingSoon: [bandItem({ verified: false })] }));
    expect(unverified).toContain(UNVERIFIED_MARKER);

    const verified = renderStrip(bands({ closingSoon: [bandItem({ verified: true })] }));
    expect(verified).not.toContain(UNVERIFIED_MARKER);
  });

  it("(c) desktop columns track the number of visible bands (fill the width, no empty tail)", () => {
    const one = renderStrip(bands({ closingSoon: [bandItem({})] }));
    expect(one).not.toMatch(/lg:grid-cols-(2|3|4)/);      // a lone band spans the row

    const two = renderStrip(bands({ closingSoon: [bandItem({})], resultsOut: [bandItem({})] }));
    expect(two).toContain("lg:grid-cols-2");
    expect(two).not.toContain("lg:grid-cols-4");

    const four = renderStrip(bands({
      closingSoon: [bandItem({})], admitCardOut: [bandItem({})], resultsOut: [bandItem({})], examsThisMonth: [bandItem({})],
    }));
    expect(four).toContain("lg:grid-cols-4");
  });

  it("renders NOTHING when every band is empty (no empty strip)", () => {
    expect(renderStrip(bands())).toBe("");
  });
});

describe("buildImportantDateRows — full name + verified flag (HomeSidebar)", () => {
  const exam = (over: Partial<ExamEntity>): ExamEntity => ({
    id: "x1", slug: "s", name: "Full Exam Name", shortName: "Short", pillar: "government-exam",
    category: "ssc", dates: [{ label: "Last date", date: "2026-11-01" }], verified: false, ...over,
  } as unknown as ExamEntity);

  it("uses the exam's FULL name and carries the verified flag", () => {
    const rows = buildImportantDateRows(
      [exam({ name: "Bihar Police 12th Pass Recruitment 2026", verified: true }),
       exam({ id: "x2", name: "Unverified Exam", verified: false })],
      "2026-10-24", [],
    );
    expect(rows.map((r) => r.examName)).toContain("Bihar Police 12th Pass Recruitment 2026");
    expect(rows.find((r) => r.examName === "Bihar Police 12th Pass Recruitment 2026")?.verified).toBe(true);
    expect(rows.find((r) => r.examName === "Unverified Exam")?.verified).toBe(false);
  });

  it("excludes exams already shown in the deadline strip", () => {
    const rows = buildImportantDateRows([exam({ id: "x1" })], "2026-10-24", ["x1"]);
    expect(rows).toHaveLength(0);
  });
});

// Opt-in HTML emission for the Playwright screenshot step (kept out of the normal suite).
if (process.env.PARITY_HTML === "1") {
  it("writes standalone HTML fixtures (PARITY_HTML=1)", () => {
    if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
    const css = existsSync(resolve(OUT, "tw.css")) ? readFileSync(resolve(OUT, "tw.css"), "utf8") : "";
    const doc = (body: string) =>
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body style="font-family:system-ui,sans-serif;color:#1f2937">${body}</body></html>`;

    const strip = bands({
      closingSoon: [
        bandItem({ examId: "1", name: "Uttar Pradesh Police Constable Recruitment 2026", shortName: "UP Police", date: "2026-10-28", verified: false }),
        bandItem({ examId: "2", name: "SSC CGL Combined Graduate Level Exam", shortName: "SSC CGL", date: "2026-10-30", verified: true }),
      ],
      resultsOut: [bandItem({ examId: "3", name: "NEET UG 2026 Result", shortName: "NEET", date: "2026-10-22", verified: false })],
    });
    writeFileSync(resolve(OUT, "out-homebands.html"), doc(`<div class="container mx-auto px-4 py-4">${renderStrip(strip)}</div>`));

    const rows = buildImportantDateRows(
      [
        { id: "a", name: "Uttar Pradesh Police Constable Recruitment 2026", shortName: "UP Police", pillar: "government-exam", category: "ssc", slug: "up-police", dates: [{ label: "Last date", date: "2026-10-28" }], verified: false } as unknown as ExamEntity,
        { id: "b", name: "SSC CGL", shortName: "SSC CGL", pillar: "government-exam", category: "ssc", slug: "ssc-cgl", dates: [{ label: "Exam date", date: "2026-11-05" }], verified: true } as unknown as ExamEntity,
      ],
      "2026-10-24", [],
    );
    const sidebarRows = rows.map((r) =>
      `<div class="flex items-start justify-between gap-2 px-3 py-2 border-b"><div class="min-w-0"><p class="text-xs font-semibold text-gray-800 break-words">${r.examName}</p>${r.verified ? "" : `<p class="text-[10px] font-medium text-gray-400 break-words">${UNVERIFIED_MARKER}</p>`}<p class="text-xs text-gray-500">${r.event}</p></div></div>`,
    ).join("");
    writeFileSync(resolve(OUT, "out-sidebar.html"), doc(
      `<div class="container mx-auto px-4 py-6"><div class="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6"><div class="min-w-0"></div><aside class="flex flex-col gap-5"><div class="bg-white border rounded-lg shadow-sm overflow-hidden"><div class="px-3 py-2.5 border-b"><h2 class="font-bold text-sm">Important dates</h2></div><div>${sidebarRows}</div></div></aside></div></div>`,
    ));
    expect(existsSync(resolve(OUT, "out-homebands.html"))).toBe(true);
    expect(existsSync(resolve(OUT, "out-sidebar.html"))).toBe(true);
  });
}
