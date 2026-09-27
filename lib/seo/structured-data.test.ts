import { describe, it, expect } from "vitest";
import {
  buildJobPostingSchema,
  buildSarkariJobPostingSchema,
} from "@/lib/seo/structured-data";
import type { ExamEntity, ExamStatus } from "@/types/exam";
import type { SarkariNaukriItem } from "@/services/sarkariNaukriService";

/**
 * buildJobPostingSchema and buildSarkariJobPostingSchema are pure functions, so the OPEN
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

/**
 * buildSarkariJobPostingSchema gates on the application WINDOW, not the
 * untrusted sarkari_naukri.status column (which marks ~98.6% of rows
 * "completed"). datePosted is required; validThrough is the window close.
 */
function vacancy(overrides: Partial<SarkariNaukriItem> = {}): SarkariNaukriItem {
  return {
    id: "v1",
    slug: "ssc-je",
    recruitmentType: "exam",
    title: "SSC Junior Engineer",
    titleHindi: null,
    organization: "Staff Selection Commission",
    organizationHindi: null,
    department: null,
    state: "all-india",
    district: null,
    category: "engineering",
    vacancyCount: 10666,
    eligibility: null,
    ageLimit: null,
    payScale: null,
    applicationFee: null,
    description: null,
    descriptionHindi: null,
    notificationDate: null,
    applicationStartDate: null,
    applicationEndDate: null,
    applicationUrl: null,
    officialNotificationUrl: null,
    examDate: null,
    admitCardDate: null,
    admitCardUrl: null,
    answerKeyDate: null,
    answerKeyUrl: null,
    examMode: null,
    resultDate: null,
    resultUrl: null,
    cutoffMarks: null,
    totalCandidates: null,
    passPercentage: null,
    interviewDate: null,
    documentVerificationDate: null,
    meritListDate: null,
    meritListUrl: null,
    joiningDetails: null,
    walkInDate: null,
    walkInVenue: null,
    verifiedAt: null,
    status: "application-open",
    isNew: false,
    isFeatured: false,
    isUrgent: false,
    tags: [],
    searchKeywords: [],
    seoTitle: null,
    seoDescription: null,
    alternateLinks: null,
    publishedAt: null,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
    ...overrides,
  } as SarkariNaukriItem;
}

describe("buildSarkariJobPostingSchema", () => {
  const url = "https://www.indianexaminfo.com/sarkari-naukri/ssc-je";
  const today = "2026-09-27";

  it("emits a complete JobPosting when today falls inside the window with a notification date", () => {
    const schema = buildSarkariJobPostingSchema(
      vacancy({
        notificationDate: "2026-09-01",
        applicationStartDate: "2026-09-05",
        applicationEndDate: "2026-10-31",
        verifiedAt: "2026-09-02T00:00:00Z",
        officialNotificationUrl: "https://ssc.nic.in/je-2026.pdf",
      }),
      url,
      today,
    );

    expect(schema).not.toBeNull();
    expect(schema!["@type"]).toBe("JobPosting");
    expect(schema!.datePosted).toBe("2026-09-01");
    expect(schema!.validThrough).toBe("2026-10-31");
    expect(schema!.title).toBe("SSC Junior Engineer");
    expect(schema!.hiringOrganization.name).toBe("Staff Selection Commission");
    expect(schema!.jobLocation.address.addressCountry).toBe("IN");
    expect(schema!.mainEntityOfPage["@id"]).toBe(url);
  });

  it("returns null when the window is open but no notification date resolves", () => {
    const schema = buildSarkariJobPostingSchema(
      vacancy({
        notificationDate: null,
        applicationStartDate: "2026-09-05",
        applicationEndDate: "2026-10-31",
      }),
      url,
      today,
    );
    expect(schema).toBeNull();
  });

  it("returns null when the window has already closed (today after end)", () => {
    const schema = buildSarkariJobPostingSchema(
      vacancy({
        notificationDate: "2026-01-01",
        applicationStartDate: "2026-01-05",
        applicationEndDate: "2026-02-28",
      }),
      url,
      today,
    );
    expect(schema).toBeNull();
  });

  it("returns null when the window has not opened yet (today before start)", () => {
    const schema = buildSarkariJobPostingSchema(
      vacancy({
        notificationDate: "2026-09-20",
        applicationStartDate: "2026-11-01",
        applicationEndDate: "2026-12-01",
      }),
      url,
      today,
    );
    expect(schema).toBeNull();
  });

  it("emits when the window is open even if the status column says completed (status ignored)", () => {
    const schema = buildSarkariJobPostingSchema(
      vacancy({
        status: "completed",
        notificationDate: "2026-09-01",
        applicationStartDate: "2026-09-05",
        applicationEndDate: "2026-10-31",
        verifiedAt: "2026-09-02T00:00:00Z",
        officialNotificationUrl: "https://ssc.nic.in/je-2026.pdf",
      }),
      url,
      today,
    );
    expect(schema).not.toBeNull();
  });

  it("returns null when verifiedAt is null even with an open window", () => {
    const schema = buildSarkariJobPostingSchema(
      vacancy({
        notificationDate: "2026-09-01",
        applicationStartDate: "2026-09-05",
        applicationEndDate: "2026-10-31",
        verifiedAt: null,
        officialNotificationUrl: "https://ssc.nic.in/je-2026.pdf",
      }),
      url,
      today,
    );
    expect(schema).toBeNull();
  });

  it("returns null when officialNotificationUrl is absent even when verified", () => {
    const schema = buildSarkariJobPostingSchema(
      vacancy({
        notificationDate: "2026-09-01",
        applicationStartDate: "2026-09-05",
        applicationEndDate: "2026-10-31",
        verifiedAt: "2026-09-02T00:00:00Z",
        officialNotificationUrl: null,
      }),
      url,
      today,
    );
    expect(schema).toBeNull();
  });

  it("returns null when status says application-open but the window is closed (status ignored)", () => {
    const schema = buildSarkariJobPostingSchema(
      vacancy({
        status: "application-open",
        notificationDate: "2026-01-01",
        applicationStartDate: "2026-01-05",
        applicationEndDate: "2026-02-28",
      }),
      url,
      today,
    );
    expect(schema).toBeNull();
  });

  it("returns null when the window bounds are missing entirely", () => {
    const schema = buildSarkariJobPostingSchema(
      vacancy({ notificationDate: "2026-09-01", applicationStartDate: null, applicationEndDate: null }),
      url,
      today,
    );
    expect(schema).toBeNull();
  });
});
