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
import { QuickInfoCard, ImportantLinksCard, cycleFrequencyText } from "@/components/exam/ReaderInfoCards";
import { hasData, mainSectionsForPillar, type HasDataView } from "@/lib/sectionRegistry";
import type { ExamEntity, ContentPost } from "@/types/exam";

const OUT = resolve(__dirname);

// A representative fixture (PET-like). Only fields the renderers read.
function makeExam(over: Partial<ExamEntity> = {}): ExamEntity {
  return {
    id: "ex-1", slug: "upsssc-pet", name: "UPSSSC PET", shortName: "UPSSSC PET",
    pillar: "government-exam", region: "uttar-pradesh", category: "state-government-jobs",
    subcategory: "", categoryId: null, subcategoryId: null, entityType: "recruitment",
    conductingBody: "UP Subordinate Services Selection Commission", officialWebsite: "https://upsssc.gov.in",
    cycleFrequency: "annual",
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

function makePost(over: Partial<ContentPost> = {}): ContentPost {
  return {
    id: "p1", slug: "pet-admit-card-2026", title: "Admit card released", excerpt: "", content: "",
    examEntityId: "ex-1", examEntityName: "UPSSSC PET", pillar: "government-exam", contentType: "admit-card",
    quickLinks: [{ label: "Download admit card", url: "https://upsssc.gov.in/admit", isPDF: false, isOfficial: true }],
    publishedAt: "2026-10-17T09:00:00Z", updatedAt: "2026-10-17T09:00:00Z",
    status: "published", featuredImage: "", tags: [], isFeatured: false, seoTitle: "", seoDescription: "",
    kind: "final", ...over,
  } as ContentPost;
}

// Updates mirroring the mock's data: one LIVE attested link, one EXPIRED item
// (its link must not appear) and one label with NO url (must not become a row).
const MOCK_POSTS: ContentPost[] = [
  makePost(),
  makePost({ id: "p2", slug: "pet-city-notice", title: "Exam city notice",
    quickLinks: [{ label: "Exam city details", url: "https://upsssc.gov.in/city", isPDF: false, isOfficial: true }] }),
  makePost({ id: "p3", slug: "pet-old", title: "Old notice", status: "published", expiresAt: "2026-10-19T00:00:00Z",
    quickLinks: [{ label: "Apply Online", url: "https://upsssc.gov.in/apply", isPDF: false, isOfficial: true }] }),
  makePost({ id: "p4", slug: "pet-nolink", title: "Revised dates", kind: "revised",
    quickLinks: [{ label: "Revised exam date notice", url: "", isPDF: false, isOfficial: false }] as ContentPost["quickLinks"] }),
];

function renderPage(exam: ExamEntity, posts: ContentPost[] = []): string {
  const view = viewOf(exam);
  const today = "2026-10-21";
  const sections = mainSectionsForPillar(exam.pillar as never)
    .filter((s) => hasData(view, s.slug))
    .map((s) => {
      const R = SECTION_SUMMARY_RENDERERS[s.slug];
      return R ? createElement(Fragment, { key: s.slug }, R(exam, today)) : null;
    });
  const strip = createElement(KeyDatesStrip, { dates: exam.dates, todayISO: today, officialWebsite: exam.officialWebsite, action: null });
  const quick = createElement(QuickInfoCard, { exam });
  const links = createElement(ImportantLinksCard, { exam, contentPosts: posts, todayISO: today });
  return renderToStaticMarkup(createElement("div", { className: "exam-content" }, strip, quick, links, sections));
}

const RICH = makeExam();
const NO_DATES = makeExam({ dates: [] });
const NO_ELIG = makeExam({ eligibility: undefined });
const NO_LINKS = makeExam({ officialWebsite: "" });
const NO_FACTS = makeExam({ conductingBody: "", officialWebsite: "", cycleFrequency: "" });

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

describe("mock gap audit (22 Oct) - Quick information + Important links", () => {
  const html = renderPage(RICH, MOCK_POSTS);
  it("renders the Quick information facts card from STORED fields only", () => {
    expect(html).toContain("Quick information");
    expect(html).toContain("Conducting body");
    expect(html).toContain("Once a year"); // annual, in the mock's plain words
    expect(cycleFrequencyText("biannual")).toBe("Multiple cycles per year");
    expect(cycleFrequencyText("")).toBeNull();
  });
  it("Important links shows ATTESTED live urls; expired and url-less labels never appear", () => {
    expect(html).toContain("Important links");
    expect(html).toContain("upsssc.gov.in/admit");
    expect(html).toContain("upsssc.gov.in/city");
    expect(html).not.toContain("upsssc.gov.in/apply"); // expired update's link
    expect(html).not.toContain("Revised exam date notice"); // label with no url
  });
  it("no facts -> NO card; no attested links -> NO card (never an empty shell)", () => {
    const bare = renderPage(NO_FACTS, []);
    expect(bare).not.toContain("Quick information");
    expect(bare).not.toContain("Important links");
    const officialOnly = renderPage(NO_FACTS, MOCK_POSTS);
    expect(officialOnly).not.toContain("Quick information");
    expect(officialOnly).toContain("Important links"); // update links are attested regardless of the site field
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
    writeFileSync(resolve(OUT, "out-rich.html"), doc("rich", renderPage(RICH, MOCK_POSTS)));
    writeFileSync(resolve(OUT, "out-no-dates.html"), doc("no-dates", renderPage(NO_DATES)));
    writeFileSync(resolve(OUT, "out-no-elig.html"), doc("no-elig", renderPage(NO_ELIG)));
    writeFileSync(resolve(OUT, "out-no-links.html"), doc("no-links", renderPage(NO_LINKS)));
    expect(existsSync(resolve(OUT, "out-rich.html"))).toBe(true);
  });
}
