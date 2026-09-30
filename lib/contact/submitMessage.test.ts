import { describe, it, expect } from "vitest";
import {
  EMAIL_RE,
  PHONE_RE,
  normalizePhone,
  looksLikeEmail,
  looksLikePhone,
} from "@/lib/contact/submitMessage";

/**
 * CLIENT ↔ SERVER VALIDATION PARITY (Sprint 0 Part 3).
 *
 * The submit-message edge function is the authority; the form pre-validates to
 * save the reader a round-trip. These tests pin the client regex to the SERVER
 * regex (copied verbatim from supabase/functions/submit-message/index.ts) so a
 * value the client accepts can NEVER be one the server rejects — the divergence
 * (client accepting a leading 0, or spaces that the server does not strip) was
 * the bug this guards against.
 */

// Verbatim from the deployed edge function — if this changes there, change it
// here and this test will fail loudly rather than silently mis-validate.
const SERVER_EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SERVER_PHONE_RE = /^\+?9?1?[6-9][0-9]{9}$/;

describe("email validation parity", () => {
  it("client EMAIL_RE is identical to the server regex", () => {
    expect(EMAIL_RE.source).toBe(SERVER_EMAIL_RE.source);
  });
  const cases = [
    "user@example.com", "a.b+c@sub.domain.co.in",
  ];
  for (const c of cases) {
    it(`accepts ${c}`, () => expect(looksLikeEmail(c)).toBe(true));
  }
  for (const bad of ["no-at-sign", "a@b", "@x.com", "a b@c.com", "a@b c.com"]) {
    it(`rejects ${bad}`, () => {
      expect(looksLikeEmail(bad)).toBe(false);
      expect(SERVER_EMAIL_RE.test(bad.trim())).toBe(false);
    });
  }
});

describe("phone validation parity", () => {
  it("client PHONE_RE is identical to the server regex", () => {
    expect(PHONE_RE.source).toBe(SERVER_PHONE_RE.source);
  });

  const accepted = [
    "9876543210",        // bare 10-digit
    "+919876543210",     // +91
    "919876543210",      // 91
    "98765 43210",       // space separated → normalized
    "98765-43210",       // dash separated → normalized
    "+91 98765 43210",   // international + spaces
  ];
  for (const c of accepted) {
    it(`accepts "${c}" AND the server accepts the value we send`, () => {
      expect(looksLikePhone(c)).toBe(true);
      // The form sends normalizePhone(c); assert the server agrees on that exact string.
      expect(SERVER_PHONE_RE.test(normalizePhone(c))).toBe(true);
    });
  }

  const rejected = [
    "09876543210",       // leading 0 — the OLD client bug, server rejects
    "5876543210",        // starts with 5
    "987654321",         // 9 digits
    "88765432101",       // 11 digits not starting with a 9-prefix
    "abcdefghij",
    "",
  ];
  for (const c of rejected) {
    it(`rejects "${c}" (client and server agree)`, () => {
      expect(looksLikePhone(c)).toBe(false);
      expect(SERVER_PHONE_RE.test(normalizePhone(c))).toBe(false);
    });
  }

  // DOCUMENTED SERVER QUIRK: /^\+?9?1?[6-9][0-9]{9}$/ treats the leading "9"
  // as an optional country-code prefix, so "9" + a valid 10-digit mobile (an
  // 11-digit string) PASSES. The client mirrors the server exactly, so it too
  // accepts this. Kept as an explicit test so the parity is never "fixed" on
  // one side only — if the server regex changes, this assertion fails loudly.
  it("accepts 11-digit 9-prefixed numbers, matching the server (quirk preserved)", () => {
    expect(looksLikePhone("98765432101")).toBe(true);
    expect(SERVER_PHONE_RE.test(normalizePhone("98765432101"))).toBe(true);
  });

  it("normalizePhone keeps a leading + and strips separators", () => {
    expect(normalizePhone("+91 98765-4321 0")).toBe("+919876543210");
    expect(normalizePhone("98765 43210")).toBe("9876543210");
  });
});
