/**
 * FX3 B3 — two-field contact validation matrix (validateContact).
 * Contact form: at least one required. Report sheet: both optional.
 */
import { describe, it, expect } from "vitest";
import { validateContact, canonicalizePhone } from "./submitMessage";

const VALID_EMAIL = "reader@example.com";
const VALID_PHONE = "9876543210";

describe("validateContact — requireOne=true (contact form)", () => {
  it("email only -> ok", () => {
    expect(validateContact(VALID_EMAIL, "", true).ok).toBe(true);
  });
  it("phone only -> ok", () => {
    expect(validateContact("", VALID_PHONE, true).ok).toBe(true);
  });
  it("both -> ok", () => {
    expect(validateContact(VALID_EMAIL, VALID_PHONE, true).ok).toBe(true);
  });
  it("neither -> not ok, hasContact false", () => {
    const r = validateContact("", "", true);
    expect(r.ok).toBe(false);
    expect(r.hasContact).toBe(false);
  });
  it("invalid email only -> not ok, emailValid false", () => {
    const r = validateContact("nope", "", true);
    expect(r.ok).toBe(false);
    expect(r.emailValid).toBe(false);
  });
  it("invalid phone only -> not ok, phoneValid false", () => {
    const r = validateContact("", "12345", true);
    expect(r.ok).toBe(false);
    expect(r.phoneValid).toBe(false);
  });
  it("valid email + invalid phone -> not ok (every filled field must be valid)", () => {
    const r = validateContact(VALID_EMAIL, "12345", true);
    expect(r.ok).toBe(false);
    expect(r.emailValid).toBe(true);
    expect(r.phoneValid).toBe(false);
  });
});

describe("validateContact — requireOne=false (report sheet, both optional)", () => {
  it("neither -> ok (contact optional here)", () => {
    expect(validateContact("", "", false).ok).toBe(true);
  });
  it("valid email only -> ok", () => {
    expect(validateContact(VALID_EMAIL, "", false).ok).toBe(true);
  });
  it("invalid phone only -> not ok", () => {
    expect(validateContact("", "abc", false).ok).toBe(false);
  });
});

describe("phone canonicalisation (B3 rule)", () => {
  it("accepts +91/91/0/bare and stores +91 + 10 digits", () => {
    expect(canonicalizePhone("9876543210")).toBe("+919876543210");
    expect(canonicalizePhone("09876543210")).toBe("+919876543210");
    expect(canonicalizePhone("+91 98765 43210")).toBe("+919876543210");
  });
  it("rejects the 11-digit 9-prefixed mistake and short numbers", () => {
    expect(canonicalizePhone("98765432101")).toBeNull();
    expect(canonicalizePhone("12345")).toBeNull();
  });
});
