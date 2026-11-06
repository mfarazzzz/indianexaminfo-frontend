/**
 * SarkariNaukriDetailView.jobposting.test.tsx — owner batch 7, Phase C3.
 *
 * The claim being pinned is the one the C3 report depends on:
 *
 *   the reader-facing "last date" and the Google JobPosting are TWO DIFFERENT DECISIONS.
 *
 * `buildSarkariJobPostingSchema` returns null unless the window is open today AND the row
 * is verified with an official link (five gates). The Important Dates table only asks
 * whether each date EXISTS — so a row whose window has closed, or which nobody has
 * verified, still shows "Application End / last date" for the reader, in red, while
 * Google gets nothing. That is the correct split and it must not be "fixed" by loosening
 * the schema gate.
 *
 * Why it matters for the owner's hypothesis: the "Job listing / Job details" appearance
 * disappeared between the September and November Search Console windows. The gate that
 * decides the markup reads verified_at + official_notification_url + the two window
 * bounds, and the live database now holds 361 vacancy rows with ALL of those NULL — so no
 * vacancy page can be eligible today no matter how the gate is worded. Filling the data is
 * the only way back; weakening the gate would put unverified dates in front of Google.
 *
 * Rendered with renderToStaticMarkup (the frontend suite runs in node, no jsdom) and with
 * the ad slot and breadcrumb mocked out, because they are layout chrome and router
 * consumers — the thing under test is the decision, not the ads.
 */
import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  usePathname: () => "/sarkari-naukri/up-asha-worker-bharti-2026-varanasi",
  useParams: () => ({ segments: ["up-asha-worker-bharti-2026-varanasi"] }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock("@/components/ads/AdSlot", () => ({ AdSlot: () => null }));
vi.mock("@/components/layout/Breadcrumb", () => ({ Breadcrumb: () => null }));
// NOTE: JsonLd is deliberately NOT mocked. Its markup is what a crawler reads
// (dangerouslySetInnerHTML, unescaped), and a mock that renders the JSON as JSX text
// escapes every quote - which is exactly the difference between testing the decision and
// testing a stand-in.

import { SarkariNaukriDetailView } from "./SarkariNaukriDetailView";
import type { SarkariNaukriItem } from "@/services/sarkariNaukriService";

const TODAY = "2026-11-06";
const SLUG = "up-asha-worker-bharti-2026-varanasi";

function vacancy(over: Partial<SarkariNaukriItem> = {}): SarkariNaukriItem {
  return {
    id: "v1", slug: SLUG, title: "UP Asha Worker Bharti 2026",
    organization: "Department of Women Development and Child Services", department: null,
    state: "uttar-pradesh", district: "varanasi", category: "asha",
    recruitmentType: "direct", status: "completed",
    notificationDate: null, applicationStartDate: null, applicationEndDate: null,
    officialNotificationUrl: null, applicationUrl: null,
    vacancyCount: null, eligibility: null, ageLimit: null, payScale: null,
    description: "Short description of the vacancy.", seoDescription: null,
    verifiedAt: null, isVerified: false, isNew: false, isFeatured: false, isUrgent: false,
    examDate: null, admitCardDate: null, admitCardUrl: null, answerKeyDate: null, answerKeyUrl: null,
    examMode: null, resultDate: null, resultUrl: null, cutoffMarks: null, totalCandidates: null,
    passPercentage: null, interviewDate: null, documentVerificationDate: null, meritListDate: null,
    meritListUrl: null, joiningDetails: null, walkInDate: null, walkInVenue: null,
    tags: [], createdAt: "2026-07-05", updatedAt: "2026-09-28", ...over,
  } as unknown as SarkariNaukriItem;
}

const markup = (item: SarkariNaukriItem) =>
  renderToStaticMarkup(<SarkariNaukriDetailView item={item} slug={SLUG} todayISO={TODAY} />);

/** The ld+json block, if any, parsed. Exactly what a crawler sees on the page. */
function jsonLd(html: string): Record<string, unknown>[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => JSON.parse(m[1]) as Record<string, unknown>);
}
const jobPostings = (html: string) => jsonLd(html).filter((s) => s["@type"] === "JobPosting");

describe("the JobPosting gate and the visible last date are separate decisions", () => {
  it("a row in today's actual shape (no dates, unverified) emits no markup and says Dates Awaited", () => {
    const html = markup(vacancy());
    expect(jobPostings(html)).toHaveLength(0);
    expect(html).toContain("Dates Awaited");
    expect(html).not.toContain("Application End");     // nothing honest to show yet
  });

  it("shows the last date even when the window has closed and no JobPosting is allowed", () => {
    const html = markup(vacancy({
      notificationDate: "2026-05-01", applicationStartDate: "2026-05-10",
      applicationEndDate: "2026-08-30",
      officialNotificationUrl: "https://wcd.up.gov.in/asha-2026.pdf",
      verifiedAt: "2026-05-02T00:00:00Z",
    }));
    expect(jobPostings(html)).toHaveLength(0);                 // Google: the job is over
    expect(html).toContain("Application End");                  // reader: the date stands
    expect(html).toMatch(/30 August 2026/);
    expect(html).toContain("Registration Closed");
  });

  it("shows the last date when the row is simply unverified — the gate most likely behind the lost appearance", () => {
    const html = markup(vacancy({
      notificationDate: "2026-10-01", applicationStartDate: "2026-10-05",
      applicationEndDate: "2026-11-30",
      officialNotificationUrl: "https://wcd.up.gov.in/asha-2026.pdf",
      verifiedAt: null,
    }));
    expect(jobPostings(html)).toHaveLength(0);
    expect(html).toContain("Application End");
    expect(html).toContain("Registration Open");
  });

  it("emits the markup once all five gates hold, and the reader line does not change", () => {
    const open = vacancy({
      notificationDate: "2026-10-01", applicationStartDate: "2026-10-05",
      applicationEndDate: "2026-11-30",
      officialNotificationUrl: "https://wcd.up.gov.in/asha-2026.pdf",
      applicationUrl: "https://wcd.up.gov.in/apply",
      verifiedAt: "2026-10-02T00:00:00Z", vacancyCount: 1200,
    });
    const html = markup(open);
    const posts = jobPostings(html);
    expect(posts).toHaveLength(1);
    const schema = posts[0];
    expect(schema.datePosted).toBe("2026-10-01");
    expect(schema.validThrough).toBe("2026-11-30");
    // Google's required set, every value real and taken from the row
    expect(schema.title).toBe(open.title);
    expect(schema.description).toBe(open.description);
    expect((schema.hiringOrganization as Record<string, unknown>).name)
      .toBe(open.organization);
    expect(((schema.jobLocation as Record<string, Record<string, string>>).address).addressCountry).toBe("IN");
    expect(schema.baseSalary).toBeUndefined();       // never invented from a free-text pay scale
    expect(html).toContain("Application End");
    expect(html).toMatch(/30 November 2026/);
  });

  it("keeps seeded numbers off an unverified page whatever the columns hold", () => {
    const html = markup(vacancy({ totalCandidates: 4_000_000, passPercentage: 62, cutoffMarks: "145", vacancyCount: 1200 }));
    expect(html).not.toMatch(/40,00,000/);
    expect(html).not.toContain("Pass Percentage");
    expect(html).not.toContain("Cutoff Marks");
    expect(html).not.toContain("Total Vacancies");
  });
});
