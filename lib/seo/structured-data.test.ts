import { describe, it, expect } from "vitest";
import { buildJobPostingSchema, buildEventSchema } from "@/lib/seo/structured-data";
import type { ExamEntity, ExamStatus } from "@/types/exam";

/**
 * buildJobPostingSchema and buildEventSchema are pure functions, so the OPEN
 * JobPosting case is proven here with fixtures rather than by flipping any
 * edition's dates — there is no staging database, the one Supabase project is
 * production. The live check happens when a recruitment window next opens.
 */

// A full ExamEntity with safe defaults; callers override only what a case needs.
function exam(overrides: Partial<ExamEntity> = {}): ExamEntity {
  return {
    id: "e1",
    slug: "ssc-constable",
    name: "SSC Constable Recruitment",
    shortName: "SSC Constable",
    pillar: "government-exam",
    region: "all-india",
    category: "central-government",
    subcategory: "",
    entityType: "recruitment",
    conductingBody: "Staff Selection Commission",
    officialWebsite: "https://ssc.nic.in",
    status: "registration-open",
    hasAdmitCard: false,
    hasResult: false,
    hasAnswerKey: false,
    hasSyllabus: false,
    hasDateSheet: false,
    hasMockTest: false,
    hasPreviousPapers: false,
    hasStudyMaterial: false,
    hasApplication: false,
    hasNotification: false,
    hasCutoff: false,
    dates: [],
    tags: [],
    lastUpdated: "2026-01-01",
    isFeatured: false,
    searchKeywords: [],
    ...overrides,
  } as ExamEntity;
}

function dateRow(label: string, date: string, type: string) {
  return { label, date, isUrgent: false, type };
}

describe("buildJobPostingSchema", () => {
  it("emits a complete JobPosting when open with typed notification + application_end", () => {
    const schema = buildJobPostingSchema(
      exam({
        status: "registration-open",
        seoDescription: "SSC Constable — apply online before the last date.",
        vacancy: 39417,
        dates: [
          dateRow("Notification Date", "2026-05-15", "notification"),
          dateRow("Application End", "2026-07-10", "application_end"),
        ],
      }),
    );

    expect(schema).not.toBeNull();
    expect(schema!["@type"]).toBe("JobPosting");
    expect(schema!.datePosted).toBe("2026-05-15");
    expect(schema!.validThrough).toBe("2026-07-10");

    // Google's required fields, all present.
    expect(schema!.title).toBe("SSC Constable Recruitment");
    expect(schema!.description).toBe("SSC Constable — apply online before the last date.");
    expect(schema!.hiringOrganization.name).toBe("Staff Selection Commission");
    expect(schema!.jobLocation.address.addressCountry).toBe("IN");
    expect(schema!.totalJobOpenings).toBe(39417);
  });

  it("still emits without an application_end (validThrough omitted) but keeps datePosted", () => {
    const schema = buildJobPostingSchema(
      exam({
        status: "registration-open",
        dates: [dateRow("Notification Date", "2026-05-15", "notification")],
      }),
    );
    expect(schema).not.toBeNull();
    expect(schema!.datePosted).toBe("2026-05-15");
    expect(schema!.validThrough).toBeUndefined();
  });

  it("returns null when open but no notification date resolves (datePosted is REQUIRED)", () => {
    const schema = buildJobPostingSchema(
      exam({
        status: "registration-open",
        dates: [dateRow("Application End", "2026-07-10", "application_end")],
      }),
    );
    expect(schema).toBeNull();
  });

  it("returns null for notified (notification out but window not open)", () => {
    const schema = buildJobPostingSchema(
      exam({
        status: "notified",
        dates: [
          dateRow("Notification Date", "2026-05-15", "notification"),
          dateRow("Application Start", "2026-06-01", "application_start"),
        ],
      }),
    );
    expect(schema).toBeNull();
  });

  it.each<ExamStatus>(["result-declared", "completed", "registration-closed"])(
    "returns null for a non-open status: %s",
    (status) => {
      const schema = buildJobPostingSchema(
        exam({
          status,
          dates: [
            dateRow("Notification Date", "2026-05-15", "notification"),
            dateRow("Application End", "2026-07-10", "application_end"),
          ],
        }),
      );
      expect(schema).toBeNull();
    },
  );

  it.each<ExamStatus>(["cancelled", "postponed"])(
    "returns null for the %s override even with both dates present",
    (status) => {
      const schema = buildJobPostingSchema(
        exam({
          status,
          dates: [
            dateRow("Notification Date", "2026-05-15", "notification"),
            dateRow("Application End", "2026-07-10", "application_end"),
          ],
        }),
      );
      expect(schema).toBeNull();
    },
  );
});

describe("buildEventSchema", () => {
  const today = "2026-09-27";

  it("returns null when the exam sitting date is in the past", () => {
    const schema = buildEventSchema(
      exam({ dates: [dateRow("Exam Date", "2026-05-01", "exam_written")] }),
      today,
    );
    expect(schema).toBeNull();
  });

  it("emits an Event when the exam sitting date is today or in the future", () => {
    const schema = buildEventSchema(
      exam({ dates: [dateRow("Exam Date", "2026-12-15", "exam_written")] }),
      today,
    );
    expect(schema).not.toBeNull();
    expect(schema!["@type"]).toBe("Event");
    expect(schema!.startDate).toBe("2026-12-15");
    expect(schema!.eventStatus).toBe("EventScheduled");
  });

  it("returns null when no usable exam date exists", () => {
    const schema = buildEventSchema(exam({ dates: [] }), today);
    expect(schema).toBeNull();
  });
});
