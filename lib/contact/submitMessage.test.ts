import { describe, it, expect } from "vitest";
import {
  EMAIL_RE,
  PHONE_RE,
  stripPhoneSeparators,
  canonicalizePhone,
  looksLikeEmail,
  looksLikePhone,
} from "@/lib/contact/submitMessage";

/**
 * CLIENT ↔ SERVER VALIDATION PARITY (Sprint 0 Part 3, P3-0).
 *
 * The submit-message edge function is the authority; the form pre-validates to
 * save the reader a round-trip. These tests pin the client to the SERVER rule
 * (copied verbatim from supabase/functions/submit-message/index.ts) so a value
 * the client accepts can NEVER be one the server rejects, and the value the
 * client SENDS is the canonical one the server stores.
 *
 * The rule (one shared definition, edge function AND frontend):
 *   1. normalise first — strip spaces, dashes, dots, brackets
 *   2. then /^(?:\+91|91|0)?[6-9]\d{9}$/
 *   3. store the canonical form +91XXXXXXXXXX
 */

// Verbatim from the deployed edge function — if it changes there, change it
// here and this test fails loudly rather than silently mis-validating.
const SERVER_EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SERVER_PHONE_RE = /^(?:\+91|91|0)?[6-9]\d{9}$/;

describe("email validation parity", () => {
  it("client EMAIL_RE is identical to the server regex", () => {
    expect(EMAIL_RE.source).toBe(SERVER_EMAIL_RE.source);
  });
  for (const c of ["user@example.com", "a.b+c@sub.domain.co.in"]) {
    it(`accepts ${c}`, () => expect(looksLikeEmail(c)).toBe(true));
  }
  for (const bad of ["no-at-sign", "a@b", "@x.com", "a b@c.com", "a@b c.com"]) {
    it(`rejects ${bad}`, () => {
      expect(looksLikeEmail(bad)).toBe(false);
      expect(SERVER_EMAIL_RE.test(bad.trim())).toBe(false);
    });
  }
});

describe("phone rule: one shared definition", () => {
  it("client PHONE_RE is identical to the server regex", () => {
    expect(PHONE_RE.source).toBe(SERVER_PHONE_RE.source);
  });

  // The four fixtures the owner pinned for P3-0.
  it("rejects 98765432101 (the old bug: leading 9 read as a country code)", () => {
    expect(looksLikePhone("98765432101")).toBe(false);
    expect(canonicalizePhone("98765432101")).toBeNull();
    expect(SERVER_PHONE_RE.test(stripPhoneSeparators("98765432101"))).toBe(false);
  });
  it("accepts 09876543210 (leading 0 trunk prefix)", () => {
    expect(looksLikePhone("09876543210")).toBe(true);
    expect(canonicalizePhone("09876543210")).toBe("+919876543210");
  });
  it("accepts '+91 98765-43210' (spaces and dashes stripped first)", () => {
    expect(looksLikePhone("+91 98765-43210")).toBe(true);
    expect(canonicalizePhone("+91 98765-43210")).toBe("+919876543210");
  });
  it("rejects 5876543210 (first digit not 6-9)", () => {
    expect(looksLikePhone("5876543210")).toBe(false);
    expect(canonicalizePhone("5876543210")).toBeNull();
  });
});

describe("phone acceptance set", () => {
  const accepted: Array<[string, string]> = [
    ["9876543210", "+919876543210"],         // bare 10-digit
    ["+919876543210", "+919876543210"],      // +91
    ["919876543210", "+919876543210"],       // 91
    ["09876543210", "+919876543210"],        // 0 trunk
    ["98765 43210", "+919876543210"],        // space
    ["98765-43210", "+919876543210"],        // dash
    ["+91 98765-43210", "+919876543210"],    // intl + separators
    ["(0987) 654-3210", "+919876543210"],    // brackets + dashes + 0 trunk prefix
  ];
  for (const [input, canonical] of accepted) {
    it(`accepts "${input}" and the value we send passes the server regex`, () => {
      expect(looksLikePhone(input)).toBe(true);
      const sent = canonicalizePhone(input);
      expect(sent).toBe(canonical);
      // The server tests the SAME normalised string we send.
      expect(SERVER_PHONE_RE.test(stripPhoneSeparators(sent as string))).toBe(true);
    });
  }
});

describe("phone rejection set", () => {
  const rejected = [
    "98765432101",   // 11 digits, leading 9 — the P3-0 bug, now rejected
    "5876543210",    // starts with 5
    "987654321",     // 9 digits
    "098765432101",  // 0 + 11 digits
    "abcdefghij",
    "",
    "91",            // prefix only, no national number
  ];
  for (const c of rejected) {
    it(`rejects "${c}" (client and server agree, no canonical form)`, () => {
      expect(looksLikePhone(c)).toBe(false);
      expect(canonicalizePhone(c)).toBeNull();
      expect(SERVER_PHONE_RE.test(stripPhoneSeparators(c))).toBe(false);
    });
  }
});

describe("strip + canonicalise", () => {
  it("strips spaces, dashes, dots and brackets", () => {
    expect(stripPhoneSeparators("+91 98765-4321 0")).toBe("+919876543210");
    expect(stripPhoneSeparators("(987) 654.32.10")).toBe("9876543210");
  });
  it("every valid spelling collapses to the same canonical +91 number", () => {
    const forms = ["9876543210", "+919876543210", "919876543210", "09876543210", "+91 98765-43210"];
    for (const f of forms) expect(canonicalizePhone(f)).toBe("+919876543210");
  });
});
