/**
 * datePrecedenceMainPage.test.tsx — P0 item 4, PROVEN on the MAIN page.
 *
 * The reviewer's screenshot showed the main-page key-dates strip on one date while
 * the Important Dates list and the status card showed another. This renders the REAL
 * main-page surfaces from a fixture that creates exactly that conflict — the edition
 * says 30 Nov, a PUBLISHED corrigendum update says 10 Nov — and asserts every
 * main-page surface resolves to the edition's 30 Nov.
 *
 * The surfaces covered are the ones the review named: pickKeyDates (the strip's
 * picker), the strip itself, the hero subtitle (the status line that replaced the
 * lead card), getLeadBlock's date pick, the Important Dates section, and the
 * JobPosting JSON-LD validThrough. The update's own date is allowed to appear in ONE
 * place only — the Updates block, where it is an announcement, not a schedule (and in
 * the update-driven <title> of a content-type page, which the owner keeps).
 */
// @vitest-environment node
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { pickKeyDates } from "@/lib/exam/keyDates";
import { deriveHeroLine } from "@/lib/exam/heroLine";
import { getLeadBlock } from "@/lib/exam/actionLinks";
import { SECTION_SUMMARY_RENDERERS } from "@/components/exam/sectionRenderers";
import { KeyDatesStrip } from "@/components/exam/KeyDatesStrip";
import { LatestUpdates } from "@/components/exam/LatestUpdates";
import { buildJobPostingSchema } from "@/lib/seo/structured-data";
import { partitionUpdates } from "@/lib/exam/updates";
import { formatDate } from "@/lib/utils";
import type { ExamEntity, ContentPost } from "@/types/exam";

const TODAY = "2026-10-23";          // the IST anchor the screenshot was taken on
const EDITION_LAST_DATE = "2026-11-30"; // what the edition (canonical schedule) says
const UPDATE_LAST_DATE = "2026-11-10";  // what the corrigendum notice said

const exam = {
  id: "ex-1", slug: "zz-test-entrance-exam", name: "Sample Entrance Exam", shortName: "SEE",
  pillar: "entrance-exam", category: "management", conductingBody: "Sample Agency",
  officialWebsite: "https://see.example.org", status: "registration-open",
  currentEditionYear: 2026,
  dates: [
    { label: "Notification", date: "2026-09-01", type: "notification", state: "confirmed", isUrgent: false },
    { label: "Application Begin", date: "2026-10-01", type: "application_start", state: "confirmed", isUrgent: false },
    { label: "Last Date to Apply", date: EDITION_LAST_DATE, type: "application_end", state: "confirmed", isUrgent: true },
    { label: "Exam Date", date: "2026-12-20", type: "exam_written", state: "confirmed", isUrgent: false },
  ],
  eligibility: null, vacancy: null, applicationFee: null, selectionProcess: [], faqs: [],
  contentModules: {}, tags: [], isPublished: true,
} as unknown as ExamEntity;

/** A published corrigendum whose OWN important_dates disagree with the edition. */
const corrigendum = {
  id: "up-1", slug: "see-corrigendum", title: "[TEST] Corrigendum — last date",
  contentType: "application", kind: "corrigendum", status: "published",
  publishedAt: "2026-10-20T09:00:00Z", updatedAt: "2026-10-20T09:00:00Z",
  importantDates: [{ label: "Last Date to Apply", date: UPDATE_LAST_DATE, isUrgent: true }],
  quickLinks: [], attachmentUrls: [], excerpt: "", content: "",
} as unknown as ContentPost;

const strip = () => renderToStaticMarkup(
  createElement(KeyDatesStrip, { dates: exam.dates, todayISO: TODAY, officialWebsite: exam.officialWebsite, action: null }),
);
const datesSection = () => renderToStaticMarkup(
  createElement(Fragmentish, null, SECTION_SUMMARY_RENDERERS["important-dates"]!(exam, TODAY)),
);
// a tiny wrapper so a bare <section> can be handed to renderToStaticMarkup
function Fragmentish({ children }: { children: React.ReactNode }) { return <>{children}</>; }

const EDITION_TEXT = formatDate(EDITION_LAST_DATE); // "30 Nov 2026"
const UPDATE_TEXT = formatDate(UPDATE_LAST_DATE);   // "10 Nov 2026"

describe("main page — every date surface resolves to the edition (30 Nov), never the notice (10 Nov)", () => {
  it("pickKeyDates returns the edition row", () => {
    const rows = pickKeyDates(exam.dates, TODAY, 3);
    expect(rows.map((r) => r.date)).toContain(EDITION_LAST_DATE);
    expect(rows.map((r) => r.date)).not.toContain(UPDATE_LAST_DATE);
  });

  it("the key-dates strip prints 30 Nov and not 10 Nov", () => {
    const html = strip();
    expect(html).toContain(EDITION_TEXT);
    expect(html).not.toContain(UPDATE_TEXT);
  });

  it("the hero subtitle (the status line) carries the edition date and its countdown", () => {
    const hero = deriveHeroLine(exam, TODAY);
    expect(hero.date?.value).toBe(EDITION_LAST_DATE);
    expect(hero.date?.label).toBe("Last Date to Apply");
    expect(hero.daysRemaining).toBe(38); // 23 Oct → 30 Nov
  });

  it("getLeadBlock — the shared date pick behind the status card — reads the edition", () => {
    expect(getLeadBlock(exam, TODAY).date?.date).toBe(EDITION_LAST_DATE);
  });

  it("the Important Dates section prints 30 Nov and not 10 Nov", () => {
    const html = datesSection();
    expect(html).toContain(EDITION_TEXT);
    expect(html).not.toContain(UPDATE_TEXT);
  });

  it("the JobPosting JSON-LD validThrough is the edition deadline", () => {
    const schema = buildJobPostingSchema({ ...exam, pillar: "government-exam" } as ExamEntity);
    expect(schema?.validThrough).toBe(EDITION_LAST_DATE);
  });

  it("the update's own date appears ONLY as an announcement, never as a schedule", () => {
    const { active } = partitionUpdates([corrigendum]);
    const html = renderToStaticMarkup(createElement(LatestUpdates, { active, allHref: "#updates" }));
    expect(html).toContain("Corrigendum");            // the notice, with its kind chip
    expect(html).not.toContain(UPDATE_TEXT);          // it does not print the notice's date as a deadline
    // and the schedule surfaces are untouched by the update existing at all
    expect(strip()).toContain(EDITION_TEXT);
    expect(strip()).not.toContain(UPDATE_TEXT);
    expect(datesSection()).not.toContain(UPDATE_TEXT);
  });

  it("P1 item 2: given the notice, the dates list EXPLAINS the move under the canonical date", () => {
    const html = renderToStaticMarkup(createElement(Fragmentish, null,
      SECTION_SUMMARY_RENDERERS["important-dates"]!(exam, { todayISO: TODAY, updates: [corrigendum] }),
    ));
    expect(html).toContain("Updated by the corrigendum of 20 Oct 2026: was 10 Nov 2026, now 30 Nov 2026.");
    // the row itself still shows the edition date, and never the notice's date as the value
    expect(html).toContain(EDITION_TEXT);
    const rowValue = html.slice(html.indexOf("Last Date to Apply"), html.indexOf("Updated by the corrigendum"));
    expect(rowValue).toContain(EDITION_TEXT);
    expect(rowValue).not.toContain(UPDATE_TEXT);
  });

  it("P1 item 2: no notice, or the legacy string context, prints no note", () => {
    expect(datesSection()).not.toContain("Updated by the");
    const empty = renderToStaticMarkup(createElement(Fragmentish, null,
      SECTION_SUMMARY_RENDERERS["important-dates"]!(exam, { todayISO: TODAY, updates: [] }),
    ));
    expect(empty).not.toContain("Updated by the");
  });
});
