/**
 * keyDates.test.ts — 4a (2d) logic + P1 item 12. pickKeyDates returns ONLY the dates
 * still to come, soonest first (chronological, never a reverse-ordered history list);
 * pickAttestedAction returns a button ONLY when an attested URL matches the status
 * action (never a placeholder).
 */
import { describe, it, expect } from "vitest";
import { pickKeyDates, pickAttestedAction, relDayLabel, REL_DAY_WINDOW_DAYS } from "./keyDates";

describe("pickKeyDates", () => {
  const today = "2026-10-20";
  it("returns soonest-upcoming first, chronological, capped at the limit", () => {
    const out = pickKeyDates([
      { label: "Result", date: "2026-12-01" },
      { label: "Exam", date: "2026-10-25" },
      { label: "Admit", date: "2026-10-17" },
      { label: "City", date: "2026-10-12" },
    ], today, 3);
    // past rows (Admit, City) are NOT shown, so the list can never read backwards
    expect(out.map((d) => d.label)).toEqual(["Exam", "Result"]);
  });
  it("skips rows with no date (never a blank/TBA filler)", () => {
    const out = pickKeyDates([{ label: "Answer key", date: "" }, { label: "Exam", date: "2026-10-25" }], today);
    expect(out.map((d) => d.label)).toEqual(["Exam"]);
  });
  it("a record with nothing to come gets NO rows (P1 item 12: no past-date stack)", () => {
    const out = pickKeyDates([{ label: "Notification", date: "2026-04-01" }, { label: "Applied", date: "2026-03-01" }], today, 2);
    expect(out).toEqual([]);
  });
  it("rows are ascending by date whenever more than one is shown", () => {
    const out = pickKeyDates([
      { label: "Result", date: "2026-12-01" },
      { label: "Exam", date: "2026-10-25" },
      { label: "Apply ends", date: "2026-11-10" },
    ], today, 3);
    expect(out.map((d) => d.date)).toEqual(["2026-10-25", "2026-11-10", "2026-12-01"]);
  });
});

describe("pickAttestedAction", () => {
  it("returns a Download Admit Card button only when an admit-card URL is attested", () => {
    const links = [{ label: "Download Admit Card", url: "https://x/admit" }];
    expect(pickAttestedAction("admit-card-out", links)).toEqual({ label: "Download Admit Card", href: "https://x/admit" });
  });
  it("returns NO button when the status action has no attested URL (no placeholder)", () => {
    expect(pickAttestedAction("admit-card-out", [{ label: "Official site", url: "https://x" }])).toBeNull();
    expect(pickAttestedAction("admit-card-out", [])).toBeNull();
  });
  it("returns no button for a status with no primary action", () => {
    expect(pickAttestedAction("dates-awaited", [{ label: "Apply", url: "https://x/apply" }])).toBeNull();
  });
  it("apply for registration-open when an apply URL is attested", () => {
    expect(pickAttestedAction("registration-open", [{ label: "Apply Online", url: "https://x/apply" }])).toEqual({ label: "Apply Online", href: "https://x/apply" });
  });
});

describe("relDayLabel — colour-parity date badge (derived, never invented)", () => {
  const today = "2026-10-22";
  it("names today and tomorrow outright", () => {
    expect(relDayLabel("2026-10-22", today)).toBe("Today");
    expect(relDayLabel("2026-10-23", today)).toBe("Tomorrow");
  });
  it("counts the near future in days", () => {
    expect(relDayLabel("2026-10-25", today)).toBe("in 3 days");
    expect(relDayLabel("2026-12-21", today)).toBe(`in ${REL_DAY_WINDOW_DAYS} days`); // exactly at the window edge
  });
  it("no badge for past, beyond-window, malformed or missing dates", () => {
    expect(relDayLabel("2026-10-21", today)).toBeNull();
    expect(relDayLabel("2026-12-22", today)).toBeNull(); // 61 days — just past the window
    expect(relDayLabel("2026-12-31", today)).toBeNull(); // 70 days out
    expect(relDayLabel("25.12.2026", today)).toBeNull();
    expect(relDayLabel("", today)).toBeNull();
    expect(relDayLabel(null, today)).toBeNull();
    expect(relDayLabel(undefined, today)).toBeNull();
  });
});
