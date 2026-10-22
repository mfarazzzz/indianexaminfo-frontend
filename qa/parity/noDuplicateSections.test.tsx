/**
 * noDuplicateSections.test.tsx — P1 items 6 and 11, rendered from real components.
 *
 * The reference-page audit (23 Oct) measured this on production: a main exam page
 * carried "Age Limit" twice, "Salary & Pay Scale" twice, "Reservation Policy" twice,
 * and an "Eligibility Criteria" block next to the "Eligibility / योग्यता" table — the
 * ordered registry loop and ContentModulesBlock both walked the same editorial
 * modules. This harness renders the SAME two surfaces the page renders, from a
 * fixture shaped like the reference records (column facts AND modules), and pins:
 *   • no heading (and no concept) appears twice;
 *   • the module text is still on the page — as notes under the one heading;
 *   • every section heading comes from the ONE bilingual config (`EN / हिन्दी`).
 * Local QA only; nothing under app/ imports this.
 */
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, Fragment } from "react";
import { SECTION_SUMMARY_RENDERERS } from "@/components/exam/sectionRenderers";
import { ContentModulesBlock } from "@/components/exam/EntityDetailPage";
import { hasData, mainSectionsForPillar, type HasDataView } from "@/lib/sectionRegistry";
import {
  SECTION_HEADINGS, HEADING_SEPARATOR, sectionHeading, canonicalSectionSlug,
} from "@/lib/exam/sectionHeadings";
import { SECTION_BY_SLUG } from "@/lib/sectionRegistry";
import type { ExamEntity } from "@/types/exam";

function viewOf(exam: ExamEntity): HasDataView {
  return {
    pillar: exam.pillar, dates: exam.dates, eligibility: exam.eligibility ?? null,
    vacancy: exam.vacancy ?? null, applicationFee: (exam.applicationFee ?? null) as HasDataView["applicationFee"],
    selectionProcess: exam.selectionProcess ?? null,
    academicInfo: { academicYear: null, semester: null, admissionTo: null },
    hasStructuredSyllabus: false, faqs: exam.faqs ?? null, contentModules: exam.contentModules,
  };
}

/** The main-page body: the ordered loop, then the module block — exactly what
 *  renderOrderedSections composes (ResourceLibrary/Updates are separate surfaces). */
function renderBody(exam: ExamEntity): string {
  const view = viewOf(exam);
  const sections = mainSectionsForPillar(exam.pillar as never)
    .filter((s) => hasData(view, s.slug))
    .map((s) => {
      const R = SECTION_SUMMARY_RENDERERS[s.slug];
      return R ? createElement(Fragment, { key: s.slug }, R(exam, "2026-10-23")) : null;
    });
  const block = createElement(ContentModulesBlock, { contentModules: exam.contentModules, pillar: exam.pillar });
  return renderToStaticMarkup(createElement("div", { className: "exam-content" }, ...sections, block));
}

/** The module set a fully-populated record carries (the reference seed's shape). */
const MODULES: Record<string, Record<string, unknown>> = {
  overview: { description: "<p>Overview prose.</p>" },
  eligibility: {
    ageLimit: "18 to 28 years (module).",
    qualification: "A sample qualifying criterion.",
    nationality: "Sample nationality note.",
    additionalCriteria: "<p>Additional eligibility notes from the editor.</p>",
  },
  "important-dates": { dates: [{ label: "Exam Date", date: "2026-12-20" }] },
  "application-process": { steps: [{ title: "Register", description: "Step one." }] },
  "vacancy-details": { body: "<p>Post-wise vacancy detail from the module.</p>" },
  salary: { body: "<p>Pay scale detail.</p>" },
  "age-limit": { body: "<p>Age relaxation detail.</p>" },
  "selection-process": { body: "<p>Selection process notes.</p>" },
  "documents-required": { body: "<p>Documents list.</p>" },
  reservation: { body: "<p>Reservation slabs.</p>" },
  "admit-card": { downloadLink: "https://example.org/ac" },
  result: { checkLink: "https://example.org/result" },
  "answer-key": { body: "<p>Answer key notes.</p>" },
  "cut-off": { body: "<p>Cut-off notes.</p>" },
  "previous-papers": { papers: [{ title: "2025 paper" }] },
  "study-material": { materials: [{ title: "Formula sheet" }] },
  "exam-pattern": { mode: "CBT" },
  news: { items: [{ title: "Sample notice" }] },
  revaluation: { body: "<p>Revaluation window.</p>" },
};
const MODULES_WITH_CONFIG = {
  ...MODULES,
  _config: { moduleOrder: Object.keys(MODULES), enabledModules: Object.keys(MODULES) },
};

function makeExam(over: Partial<ExamEntity> = {}): ExamEntity {
  return {
    id: "ex-1", slug: "zz-test-sample", name: "Sample Exam", shortName: "Sample",
    pillar: "government-exam", region: "uttar-pradesh", category: "state-government-jobs",
    conductingBody: "Sample Board", officialWebsite: "https://example.org", cycleFrequency: "annual",
    status: "registration-open", hasNotification: true,
    dates: [{ label: "Last Date to Apply", date: "2026-11-30", isUrgent: false }],
    eligibility: { age: "18 to 30 years", qualification: "Graduate", nationality: "Indian" },
    vacancy: 1200, applicationFee: { general: 100 },
    selectionProcess: ["Written test", "Interview"],
    faqs: [{ question: "Q?", answer: "A." }],
    tags: [], isPublished: true, currentEditionYear: 2026,
    contentModules: MODULES_WITH_CONFIG as unknown as ExamEntity["contentModules"],
    ...over,
  } as unknown as ExamEntity;
}

/** Every <h2> the page printed, in document order (prose h3s are already demoted). */
function h2s(html: string): string[] {
  return [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)]
    .map((m) => m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/** heading text → the concept slug that owns it (config + registry labels). */
const HEADING_TO_SLUG = new Map<string, string>();
for (const [slug, pair] of Object.entries(SECTION_HEADINGS)) {
  HEADING_TO_SLUG.set(`${pair.en}${HEADING_SEPARATOR}${pair.hi}`, slug);
}

describe("P1 item 6 — one heading per concept on the main page", () => {
  const html = renderBody(makeExam());
  const heads = h2s(html);

  it("no heading text appears twice", () => {
    const dupes = heads.filter((h, i) => heads.indexOf(h) !== i);
    expect([...new Set(dupes)], "duplicate headings:\n" + dupes.join("\n")).toEqual([]);
  });

  it("no concept appears twice under different wordings (eligibility, vacancy, age…)", () => {
    // The block's old label table used its OWN wordings for concepts the registry already
    // names. Those second headings must be gone entirely.
    expect(html).not.toContain("Eligibility Criteria");
    expect(html).not.toContain("How to Apply");
    expect(html).not.toContain("Counselling Process");
    const concepts = heads.map((h) => HEADING_TO_SLUG.get(h) ?? h);
    const dupeConcepts = concepts.filter((c, i) => concepts.indexOf(c) !== i);
    expect(dupeConcepts, "concepts rendered twice: " + dupeConcepts.join(", ")).toEqual([]);
    // the concept-specific pairs the audit found on production
    expect(concepts.filter((c) => c === "eligibility").length).toBe(1);
    expect(concepts.filter((c) => c === "vacancy").length).toBe(1);
    expect(concepts.filter((c) => c === "age-limit").length).toBe(1);
    expect(concepts.filter((c) => c === "salary").length).toBe(1);
    expect(concepts.filter((c) => c === "selection-process").length).toBe(1);
    expect(concepts.filter((c) => c === "reservation").length).toBe(1);
  });

  it("the editorial module text survives — as notes under the ONE heading (never dropped)", () => {
    expect(html).toContain("Additional eligibility notes from the editor.");
    expect(html).toContain("Post-wise vacancy detail from the module.");
    expect(html).toContain("Selection process notes.");
    // …and it sits INSIDE the section that owns the heading, not in a section of its own
    const eligSection = html.slice(html.indexOf(sectionHeading("eligibility")));
    expect(eligSection.slice(0, eligSection.indexOf("</section>"))).toContain("Additional eligibility notes");
  });

  it("AGE HAS ONE HOME: the Age Limit section carries it, the eligibility table drops the row", () => {
    expect(html).toContain(sectionHeading("age-limit"));
    expect(html).toContain("18 to 30 years"); // structured value moved under the age heading
    const eligTable = html.slice(html.indexOf(sectionHeading("eligibility")));
    expect(eligTable.slice(0, eligTable.indexOf("</section>"))).not.toContain("Age Limit</td>");
  });

  it("a module whose section does not apply to this pillar still renders (nothing hidden)", () => {
    // university-exam has no age-limit / selection-process / salary section in the registry
    const uni = renderBody(makeExam({ pillar: "university-exam" as never }));
    expect(h2s(uni)).toContain(sectionHeading("age-limit"));
    expect(uni).toContain("Age relaxation detail.");
    expect(uni).toContain("Revaluation window.");
    const heads2 = h2s(uni);
    expect(heads2.filter((h, i) => heads2.indexOf(h) !== i)).toEqual([]);
  });
});

describe("P1 item 11 — one bilingual heading convention, from one config", () => {
  it("every registry section has an English + Hindi pair", () => {
    const missing = Object.values(SECTION_BY_SLUG)
      .map((s) => s.slug)
      .filter((slug) => !SECTION_HEADINGS[canonicalSectionSlug(slug)]);
    expect(missing, "sections with no heading pair: " + missing.join(", ")).toEqual([]);
  });

  it("every Hindi string is Devanagari and non-empty", () => {
    for (const [slug, pair] of Object.entries(SECTION_HEADINGS)) {
      expect(pair.en.trim().length, slug).toBeGreaterThan(0);
      expect(pair.hi, slug).toMatch(/[\u0900-\u097F]/);
    }
  });

  it("FAQs use अक्सर पूछे जाने वाले प्रश्न, not प्रश्नोत्तरी", () => {
    expect(SECTION_HEADINGS.faqs.hi).toBe("अक्सर पूछे जाने वाले प्रश्न");
    expect(renderBody(makeExam())).toContain(sectionHeading("faqs"));
  });

  it("headings the page prints all follow `English / हिन्दी`", () => {
    const html = renderBody(makeExam());
    const offenders = h2s(html).filter((h) => !HEADING_TO_SLUG.has(h));
    expect(offenders, "headings outside the config: " + offenders.join(", ")).toEqual([]);
  });
});
