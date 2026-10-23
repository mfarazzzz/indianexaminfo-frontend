/**
 * boardModules.test.tsx — P1 item 13: a board/university module must reach a reader.
 *
 * The reference board page showed only Notification / Admit Card / Result while the CMS
 * rail offers Date Sheet, Revaluation and Practical Exams. Two different truths:
 *   • the reference record simply had NO date-sheet / practical / revaluation data
 *     (verified read-only in the DB) — absence of data, not a suppressed section;
 *   • date-sheet is deliberately absent from CONTENT_TYPE_TO_SECTION (mapping it caused
 *     recruitment records to grow a Date Sheet tab), so no /date-sheet route can light —
 *     AND the block's generic fallback only reads body/content/description, so the
 *     module's real fields (examStartDate, schedule[], dateSheetPdfUrl…) printed NOTHING
 *     anywhere. That second part was the bug.
 * This renders the REAL block for a board pillar and pins the fix.
 */
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { ContentModulesBlock } from "@/components/exam/EntityDetailPage";
import { sectionHeading } from "@/lib/exam/sectionHeadings";

const renderBlock = (contentModules: Record<string, unknown>, pillar: string) =>
  renderToStaticMarkup(createElement(ContentModulesBlock, { contentModules, pillar }));

const enabled = (...slugs: string[]) => ({ _config: { moduleOrder: slugs, enabledModules: slugs } });

describe("date-sheet (no reader tab exists — the main page is its only surface)", () => {
  const modules = {
    ...enabled("date-sheet"),
    "date-sheet": {
      examStartDate: "2026-02-10",
      examEndDate: "2026-02-28",
      reportingTime: "10:00 AM (report 30 min early)",
      dateSheetPdfUrl: "https://board.example.in/datesheet.pdf",
      schedule: [
        { date: "2026-02-10", subject: "Mathematics" },
        { date: "2026-02-17", subject: "Physics" },
      ],
      centreGuidelines: "<p>Carry the admit card and a valid photo ID.</p>",
    },
  };

  it("renders the timetable, the window and the PDF link", () => {
    const html = renderBlock(modules, "board-exam");
    expect(html).toContain(sectionHeading("date-sheet"));
    expect(html).toContain("Mathematics");
    expect(html).toContain("Physics");
    expect(html).toContain("10:00 AM");
    expect(html).toContain("https://board.example.in/datesheet.pdf");
    expect(html).toContain("Carry the admit card");
  });

  it("an empty date-sheet module renders NOTHING (no heading, no shell)", () => {
    expect(renderBlock({ ...enabled("date-sheet"), "date-sheet": {} }, "board-exam")).toBe("");
    expect(renderBlock({ ...enabled("date-sheet"), "date-sheet": { schedule: [] } }, "board-exam")).toBe("");
  });
});

describe("revaluation (structured fields, same orphan problem)", () => {
  it("prints the window, the fee and the apply link", () => {
    const html = renderBlock(
      {
        ...enabled("revaluation"),
        revaluation: {
          revalType: "rechecking",
          applicationStart: "2026-04-01",
          applicationEnd: "2026-04-10",
          feePerPaper: 500,
          applyUrl: "https://uni.example.in/reval",
        },
      },
      "university-exam",
    );
    expect(html).toContain(sectionHeading("revaluation"));
    expect(html).toContain("Rechecking");
    expect(html).toContain("₹500");
    expect(html).toContain("https://uni.example.in/reval");
  });

  it("nothing stored → nothing rendered", () => {
    expect(renderBlock({ ...enabled("revaluation"), revaluation: {} }, "university-exam")).toBe("");
  });
});

describe("practical-exams (no fields declared in the CMS — prose only)", () => {
  it("shows the body text a board editor writes, under its own bilingual heading", () => {
    const html = renderBlock(
      { ...enabled("practical-exams"), "practical-exams": { body: "<p>Practicals run 1–5 Mar 2026 at the school lab.</p>" } },
      "board-exam",
    );
    expect(html).toContain(sectionHeading("practical-exams"));
    expect(html).toContain("Practicals run 1");
  });
});
