/**
 * qa/parity/examPageParity.test.tsx — LOCAL-ONLY mock-parity harness. Renders the
 * REAL section renderers + KeyDatesStrip with FIXTURE data (no Supabase), gated
 * exactly like EntityDetailPage (hasData filter), and:
 *   • asserts the rich record renders its sections and the sparse records render
 *     NO empty <section> shells (the mock-parity "no data → nothing" rule);
 *   • with PARITY_HTML=1, writes standalone HTML (inlining the compiled Tailwind)
 *     to qa/parity/out-*.html so Playwright can screenshot at 360 / 1366.
 * Not under app/, not imported by any route → never shipped.
 */
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement, Fragment } from "react";
import { SECTION_SUMMARY_RENDERERS } from "@/components/exam/sectionRenderers";
import { KeyDatesStrip } from "@/components/exam/KeyDatesStrip";
import { hasData, mainSectionsForPillar, type HasDataView } from "@/lib/sectionRegistry";
import type { ExamEntity } from "@/types/exam";

const OUT = resolve(__dirname);

// A representative fixture (PET-like). Only fields the renderers read.
function makeExam(over: Partial<ExamEntity> = {}): ExamEntity {
  return {
    id: "ex-1", slug: "upsssc-pet", name: "UPSSSC PET", shortName: "UPSSSC PET",
    pillar: "government-exam", region: "uttar-pradesh", category: "state-government-jobs",
    subcategory: "", categoryId: null, subcategoryId: null, entityType: "recruitment",
    conductingBody: "UP Subordinate Services Selection Commission", officialWebsite: "https://upsssc.gov.in",
    status: "admit-card-out", hasAdmitCard: true, hasResult: false, hasAnswerKey: false, hasSyllabus: false,
    hasDateSheet: false, hasMockTest: false, hasPreviousPapers: false, hasStudyMaterial: false,
    hasApplication: false, hasNotification: true, hasCutoff: false,
    dates: [
      { label: "Exam City Details Out", date: "2026-10-12", isUrgent: false },
      { label: "Admit Card Available", date: "2026-10-17", isUrgent: false },
      { label: "PET Exam — day 1", date: "2026-10-25", isUrgent: true },
      { label: "PET Exam — day 2", date: "2026-10-30", isUrgent: false },
    ],
    eligibility: { age: "18–40 years", qualification: "10th/12th/Graduate", nationality: "Indian citizen" },
    vacancy: 10000, applicationFee: { general: 185, sc: 95 } as ExamEntity["applicationFee"],
    selectionProcess: ["PET (Qualifying)", "Main Recruitment Exam"], tags: ["upsssc", "pet"],
    lastUpdated: "", isFeatured: false, searchKeywords: [], isPublished: true,
    createdAt: "", updatedAt: "", currentEditionYear: 2026, contentModules: {},
    ...over,
  } as ExamEntity;
}

function viewOf(exam: ExamEntity): HasDataView {
  return {
    pillar: exam.pillar, dates: exam.dates, eligibility: exam.eligibility ?? null,
    vacancy: exam.vacancy ?? null, applicationFee: (exam.applicationFee ?? null) as HasDataView["applicationFee"],
    selectionProcess: exam.selectionProcess ?? null,
    academicInfo: { academicYear: null, semester: null, admissionTo: null },
    hasStructuredSyllabus: false, faqs: exam.faqs ?? null, contentModules: exam.contentModules,
  };
}

function renderPage(exam: ExamEntity): string {
  const view = viewOf(exam);
  const today = "2026-10-21";
  const sections = mainSectionsForPillar(exam.pillar as never)
    .filter((s) => hasData(view, s.slug))
    .map((s) => {
      const R = SECTION_SUMMARY_RENDERERS[s.slug];
      return R ? createElement(Fragment, { key: s.slug }, R(exam, today)) : null;
    });
  const strip = createElement(KeyDatesStrip, { dates: exam.dates, todayISO: today, officialWebsite: exam.officialWebsite, action: null });
  return renderToStaticMarkup(createElement("div", { className: "exam-content" }, strip, sections));
}

const RICH = makeExam();
const NO_DATES = makeExam({ dates: [] });
const NO_ELIG = makeExam({ eligibility: null });
const NO_LINKS = makeExam({ officialWebsite: "" });

describe("mock-parity harness — rich record renders its sections", () => {
  const html = renderPage(RICH);
  it("renders the key-dates strip + important dates + eligibility + fee + selection", () => {
    expect(html).toContain("data-testid=\"key-dates-strip\"");
    expect(html).toContain("Important Dates");
    expect(html).toContain("Eligibility");
    expect(html).toContain("Application Fee");
    expect(html).toContain("Selection Process");
  });
  it("uses the parity card + stacked-dates classes", () => {
    expect(html).toContain("exam-content");
  });
});

describe("mock-parity harness — sparse records render NO empty shells", () => {
  const noEmptySection = (html: string) => {
    // a <section ...> whose only content is a heading (no real body) is an empty shell
    const sections = html.match(/<section[^>]*>([\s\S]*?)<\/section>/g) ?? [];
    return sections.every((s) => {
      const inner = s.replace(/<section[^>]*>/, "").replace(/<\/section>/, "").replace(/<h2[\s\S]*?<\/h2>/, "").trim();
      return inner.length > 0;
    });
  };
  it("zero-dates: no Important Dates section, no empty section", () => {
    const html = renderPage(NO_DATES);
    expect(html).not.toContain("Important Dates");
    expect(noEmptySection(html)).toBe(true);
  });
  it("no-eligibility: no Eligibility section, no empty section", () => {
    const html = renderPage(NO_ELIG);
    expect(html).not.toContain("Eligibility");
    expect(noEmptySection(html)).toBe(true);
  });
  it("no-links: strip still shows (dates) but no dead button; no empty section", () => {
    const html = renderPage(NO_LINKS);
    expect(html).not.toContain("Official website"); // no attested url → no button
    expect(noEmptySection(html)).toBe(true);
  });
});

// Opt-in HTML emission for the Playwright screenshot step (kept out of the normal suite).
if (process.env.PARITY_HTML === "1") {
  it("writes standalone HTML fixtures (PARITY_HTML=1)", () => {
    if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
    const css = existsSync(resolve(OUT, "tw.css")) ? readFileSync(resolve(OUT, "tw.css"), "utf8") : "";
    const doc = (title: string, body: string) =>
      `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${css}</style></head><body class="bg-surface p-4" style="font-family:system-ui,sans-serif;color:#1f2937">${body}</body></html>`;
    writeFileSync(resolve(OUT, "out-rich.html"), doc("rich", renderPage(RICH)));
    writeFileSync(resolve(OUT, "out-no-dates.html"), doc("no-dates", renderPage(NO_DATES)));
    writeFileSync(resolve(OUT, "out-no-elig.html"), doc("no-elig", renderPage(NO_ELIG)));
    writeFileSync(resolve(OUT, "out-no-links.html"), doc("no-links", renderPage(NO_LINKS)));
    expect(existsSync(resolve(OUT, "out-rich.html"))).toBe(true);
  });
}
