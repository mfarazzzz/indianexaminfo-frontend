/**
 * keyDates.test.ts — 4a (2d) logic. pickKeyDates prefers soonest-upcoming then
 * most-recent-past, skipping undated rows; pickAttestedAction returns a button
 * ONLY when an attested URL matches the status action (never a placeholder).
 */
import { describe, it, expect } from "vitest";
import { pickKeyDates, pickAttestedAction } from "./keyDates";

describe("pickKeyDates", () => {
  const today = "2026-10-20";
  it("returns soonest-upcoming first, capped at the limit", () => {
    const out = pickKeyDates([
      { label: "Result", date: "2026-12-01" },
      { label: "Exam", date: "2026-10-25" },
      { label: "Admit", date: "2026-10-17" },
      { label: "City", date: "2026-10-12" },
    ], today, 3);
    expect(out.map((d) => d.label)).toEqual(["Exam", "Result", "Admit"]);
  });
  it("skips rows with no date (never a blank/TBA filler)", () => {
    const out = pickKeyDates([{ label: "Answer key", date: "" }, { label: "Exam", date: "2026-10-25" }], today);
    expect(out.map((d) => d.label)).toEqual(["Exam"]);
  });
  it("falls back to recent past dates so the strip is not empty when nothing is upcoming", () => {
    const out = pickKeyDates([{ label: "Notification", date: "2026-04-01" }, { label: "Applied", date: "2026-03-01" }], today, 2);
    expect(out.map((d) => d.label)).toEqual(["Notification", "Applied"]);
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
