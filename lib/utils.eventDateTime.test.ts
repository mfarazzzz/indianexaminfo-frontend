/**
 * FX3 C4 (frontend) — time-with-dates rendering + IST deadline helpers.
 * Covers: a range, a time_text, a clock time, and the IST/UTC boundary
 * (18:00 IST = 12:30 UTC) for a countdown deadline.
 */
import { describe, it, expect } from "vitest";
import {
  formatEventTime,
  formatEventDateTime,
  eventDeadlineDate,
  eventDeadlineInstantISO,
} from "@/lib/utils";

describe("formatEventTime (IST clock -> 12h)", () => {
  it("renders 24h as 12h AM/PM", () => {
    expect(formatEventTime("18:00")).toBe("6:00 PM");
    expect(formatEventTime("09:00")).toBe("9:00 AM");
    expect(formatEventTime("00:30")).toBe("12:30 AM");
    expect(formatEventTime("12:00")).toBe("12:00 PM");
  });
  it("blank/invalid -> empty", () => {
    expect(formatEventTime("")).toBe("");
    expect(formatEventTime(undefined)).toBe("");
    expect(formatEventTime("25:00")).toBe("");
  });
});

describe("formatEventDateTime (range + time_text + clock)", () => {
  it("multi-day range with a time_text and an end time", () => {
    expect(formatEventDateTime({ date: "2026-10-05", end_date: "2026-10-07", end_time: "18:00", time_text: "afternoon" }))
      .toBe("5 Oct 2026 (afternoon) – 7 Oct 2026, till 6:00 PM");
  });
  it("multi-day range with only an end time (a deadline)", () => {
    expect(formatEventDateTime({ date: "2026-10-09", end_date: "2026-10-14", end_time: "17:00" }))
      .toBe("9 Oct 2026 – 14 Oct 2026, till 5:00 PM");
  });
  it("single day with a start–end time window", () => {
    expect(formatEventDateTime({ date: "2026-12-01", start_time: "09:00", end_time: "12:30" }))
      .toBe("1 Dec 2026, 9:00 AM – 12:30 PM");
  });
  it("plain date with no time info renders just the date", () => {
    expect(formatEventDateTime({ date: "2026-12-01" })).toBe("1 Dec 2026");
  });
});

describe("eventDeadlineDate + eventDeadlineInstantISO (IST/UTC boundary)", () => {
  it("deadline uses end_date for a range, else date", () => {
    expect(eventDeadlineDate({ date: "2026-10-05", end_date: "2026-10-07" })).toBe("2026-10-07");
    expect(eventDeadlineDate({ date: "2026-10-05" })).toBe("2026-10-05");
  });

  it("18:00 IST on 7 Oct 2026 is 12:30 UTC (the countdown instant is IST-correct)", () => {
    const iso = eventDeadlineInstantISO({ date: "2026-10-05", end_date: "2026-10-07", end_time: "18:00" });
    expect(iso).toBe("2026-10-07T12:30:00.000Z");
  });

  it("no clock time defaults to 23:59 IST -> 18:29 UTC", () => {
    const iso = eventDeadlineInstantISO({ date: "2026-10-07" });
    expect(iso).toBe("2026-10-07T18:29:00.000Z");
  });

  it("empty date -> empty instant", () => {
    expect(eventDeadlineInstantISO({ date: "" })).toBe("");
  });
});
