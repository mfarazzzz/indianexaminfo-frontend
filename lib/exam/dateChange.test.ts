/**
 * dateChange.test.ts — P1 item 2: the "was X, now Y" note, and the cases where it must
 * NOT appear. The note is only ever an explanation of the canonical edition date; every
 * "no note" case below is a place where an older implementation could have invented a
 * history the record does not carry.
 */
import { describe, it, expect } from "vitest";
import { deriveDateChanges, dateChangeSentence, DATE_CHANGING_KINDS } from "@/lib/exam/dateChange";
import type { ContentPost, ExamEntity } from "@/types/exam";

const TODAY = "2026-10-23";
const iso = (s: string) => `${s}T09:00:00Z`;
const fmt = (s: string) => new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const editionDates = [
  { label: "Notification", date: "2026-09-01", type: "notification", state: "confirmed", isUrgent: false },
  { label: "Last Date to Apply", date: "2026-11-30", type: "application_end", state: "confirmed", isUrgent: true },
  { label: "Exam Date", date: "2026-12-20", type: "exam_written", state: "confirmed", isUrgent: false },
  { label: "Answer Key", date: "", type: "answer_key", state: "expected", isUrgent: false },
] as unknown as ExamEntity["dates"];

function notice(over: Partial<ContentPost> = {}): ContentPost {
  return {
    id: "n1", title: "notice", status: "published", kind: "corrigendum",
    publishedAt: iso("2026-10-20"), updatedAt: iso("2026-10-20"),
    importantDates: [{ label: "Last Date to Apply", date: "2026-11-10", isUrgent: true }],
    quickLinks: [], attachmentUrls: [], ...over,
  } as unknown as ContentPost;
}

describe("deriveDateChanges — the note appears", () => {
  it("when a published corrigendum carried a different date for the same event", () => {
    const changes = deriveDateChanges(editionDates, [notice()], TODAY);
    const c = changes.get("application_end");
    expect(c).toBeDefined();
    expect(c?.was).toBe("2026-11-10");
    expect(c?.now).toBe("2026-11-30");       // the edition stays canonical
    expect(c?.kind).toBe("corrigendum");
    expect(c?.noticeDate).toBe("2026-10-20");
  });

  it("matches on the machine type first and the label when there is no type", () => {
    const byLabel = deriveDateChanges(
      editionDates,
      [notice({ importantDates: [{ label: "exam date", date: "2026-12-05", isUrgent: false }] as ContentPost["importantDates"] })],
      TODAY,
    );
    expect(byLabel.get("exam_written")?.was).toBe("2026-12-05");
  });

  it("the newest qualifying notice wins", () => {
    const changes = deriveDateChanges(editionDates, [
      notice({ id: "newer", publishedAt: iso("2026-10-21"), importantDates: [{ label: "Last Date to Apply", date: "2026-11-15", isUrgent: true }] as ContentPost["importantDates"] }),
      notice({ id: "older", publishedAt: iso("2026-10-19"), importantDates: [{ label: "Last Date to Apply", date: "2026-11-10", isUrgent: true }] as ContentPost["importantDates"] }),
    ], TODAY);
    expect(changes.get("application_end")?.was).toBe("2026-11-15");
    expect(changes.get("application_end")?.noticeDate).toBe("2026-10-21");
  });

  it("a revised notice counts too, and says so", () => {
    const c = deriveDateChanges(editionDates, [notice({ kind: "revised" })], TODAY).get("application_end");
    expect(c?.kind).toBe("revised");
    expect(dateChangeSentence(c!, fmt)).toContain("revised notice of 20 Oct 2026");
  });
});

describe("deriveDateChanges — the note must NOT appear", () => {
  const noNote = (label: string, posts: ContentPost[]) =>
    it(label, () => expect(deriveDateChanges(editionDates, posts, TODAY).size).toBe(0));

  noNote("no updates at all", []);
  noNote("a draft notice", [notice({ status: "draft" })]);
  noNote("a withdrawn notice", [notice({ kind: "withdrawn" })]);
  noNote("an expired notice", [notice({ expiresAt: iso("2026-10-21") })]);
  noNote("a superseded notice", [
    notice({ id: "old" }),
    notice({ id: "new", supersedesId: "old", importantDates: [] as ContentPost["importantDates"] }),
  ]);
  noNote("a kind that does not move a date (final)", [notice({ kind: "final" })]);
  noNote("a kind that does not move a date (provisional)", [notice({ kind: "provisional" })]);
  noNote("the notice carries no dates", [notice({ importantDates: [] as ContentPost["importantDates"] })]);
  noNote("the notice agrees with the edition", [
    notice({ importantDates: [{ label: "Last Date to Apply", date: "2026-11-30", isUrgent: true }] as ContentPost["importantDates"] }),
  ]);
  noNote("the notice is about an event the edition does not date", [
    notice({ importantDates: [{ label: "Document Verification", date: "2027-01-10", isUrgent: false }] as ContentPost["importantDates"] }),
  ]);
  noNote("the edition row itself has no date (never 'was TBA, now X')", [
    notice({ importantDates: [{ label: "Answer Key", date: "2027-01-05", isUrgent: false }] as ContentPost["importantDates"] }),
  ]);
  noNote("the notice date is blank", [notice({ importantDates: [{ label: "Last Date to Apply", date: "", isUrgent: false }] as ContentPost["importantDates"] })]);

  it("only the moved row gets a note — the others stay silent", () => {
    const changes = deriveDateChanges(editionDates, [notice()], TODAY);
    expect([...changes.keys()]).toEqual(["application_end"]);
  });
});

describe("dateChangeSentence", () => {
  it("reads as one plain sentence with both dates and the notice date", () => {
    const c = deriveDateChanges(editionDates, [notice()], TODAY).get("application_end")!;
    expect(dateChangeSentence(c, fmt)).toBe(
      "Updated by the corrigendum of 20 Oct 2026: was 10 Nov 2026, now 30 Nov 2026.",
    );
  });

  it("recognises exactly the two kinds that move a date", () => {
    expect([...DATE_CHANGING_KINDS].sort()).toEqual(["corrigendum", "revised"]);
  });
});
