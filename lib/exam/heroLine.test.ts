/**
 * heroLine.test.ts — P1 item 7 (clean H1 + status subtitle) and the H1 guard.
 *
 * The page heading must say what the exam IS, not what template rendered it. The
 * old H1 was `${name} — Notification, Eligibility & Apply` on every record — wrong
 * on a completed exam and identical on all 398. The status and the one date that
 * matters now come from deriveHeroLine(), which reuses the shared pickDisplayDate
 * (the P0 item 4 rule), so the subtitle can never disagree with the dates list.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { deriveHeroLine, hasUpcomingDates, POSITIVE_STATUSES } from "@/lib/exam/heroLine";
import type { ExamEntity } from "@/types/exam";

const ROOT = resolve(__dirname, "../..");

function exam(over: Partial<ExamEntity> = {}): ExamEntity {
  return {
    id: "e1", slug: "zz-test-sample", name: "Sample Clerk Recruitment", shortName: "Sample Clerk",
    pillar: "government-exam", category: "state-government-jobs",
    conductingBody: "Sample Commission", officialWebsite: "https://example.org",
    status: "registration-open", currentEditionYear: 2026,
    dates: [
      { label: "Application Begin", date: "2026-10-01", type: "application_start", state: "confirmed" },
      { label: "Last Date to Apply", date: "2026-11-30", type: "application_end", state: "confirmed" },
    ],
    ...over,
  } as unknown as ExamEntity;
}

describe("deriveHeroLine", () => {
  it("titles the page with the exam's own name (+ the edition year) and nothing else", () => {
    const h = deriveHeroLine(exam(), "2026-10-23");
    expect(h.title).toBe("Sample Clerk Recruitment 2026");
    expect(h.title).not.toMatch(/Notification|Eligibility|Apply/);
  });

  it("does not double the year when the official name already ends in one", () => {
    const h = deriveHeroLine(exam({ name: "Sample Clerk Recruitment 2026" }), "2026-10-23");
    expect(h.title).toBe("Sample Clerk Recruitment 2026");
  });

  it("an open record gets the deadline it must act on, with days remaining", () => {
    const h = deriveHeroLine(exam(), "2026-10-23");
    expect(h.status).toBeTruthy();
    expect(h.date?.label).toBe("Last Date to Apply");
    expect(h.date?.value).toBe("2026-11-30");
    expect(h.daysRemaining).toBe(38);
    expect(h.isPositive).toBe(POSITIVE_STATUSES.has("registration-open"));
  });

  it("a completed record states its result date instead of a marketing suffix", () => {
    const done = exam({
      status: "result-declared" as never,
      dates: [
        { label: "Exam Date", date: "2026-06-01", type: "exam_written", state: "confirmed", isUrgent: false },
        { label: "Result", date: "2026-06-10", type: "result", state: "confirmed", isUrgent: false },
      ],
    });
    const h = deriveHeroLine(done, "2026-10-23");
    expect(h.date?.value).toBe("2026-06-10");
    expect(h.daysRemaining).toBeNull();          // nothing to count down to
    expect(hasUpcomingDates(done, "2026-10-23")).toBe(false); // → the strip shows no date rows
  });
});

describe("no page template may put a status sentence in the H1", () => {
  function walk(dir: string, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name === ".next") continue;
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p, out);
      else if (p.endsWith(".tsx")) out.push(p);
    }
    return out;
  }

  it("no <h1> in app/ or components/ carries the old template tail", () => {
    const offenders: string[] = [];
    for (const f of [...walk(join(ROOT, "app")), ...walk(join(ROOT, "components"))]) {
      const src = readFileSync(f, "utf8");
      const re = /<h1[\s\S]{0,400}?<\/h1>/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src)) !== null) {
        if (/Notification, Eligibility & Apply/.test(m[0])) offenders.push(f.replace(ROOT, ""));
      }
    }
    expect(offenders, "H1 carries a template sentence: " + offenders.join(", ")).toEqual([]);
  });
});
