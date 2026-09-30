/**
 * submitMessage.ts — the ONE client-side path for reader submissions
 * (Sprint 0 Part 3, owner brief S0-5 A).
 *
 * Contract with supabase/functions/submit-message (deployed verify_jwt OFF,
 * public by design — readers are not logged in):
 *   POST body { source, category, message, reason?, name?, email?, phone?,
 *               page_url?, page_title?, consent, website?, filled_ms? }
 *   reply     { ok: true, ref } | { ok: false, error }
 *
 * Everything that protects the site (validation, honeypot, fill-time, rate
 * limit per salted IP hash, entity resolution) runs SERVER-SIDE in the edge
 * function; the DB gives anon nothing. This file only shapes the payload and
 * reads the reply — a non-2xx still carries a JSON { ok:false, error }.
 *
 * Both forms must send:
 *  - website   : hidden honeypot input; a bot fills it and gets a FAKE success
 *  - filled_ms : ms since the form RENDERED (not since page load) — the
 *                function rejects below 2000 ms; humans are slower than bots
 */
import { env } from "@/config/env";

export type MessageSource = "contact_form" | "page_report";

/** Mirrors the reader_messages.category CHECK values (reader_messages.sql). */
export type MessageCategory =
  | "report_error"
  | "suggest_update"
  | "general_question"
  | "technical_problem"
  | "advertising"
  | "legal_removal";

/** Mirrors the reader_messages.reason CHECK values — the one-tap reasons. */
export type MessageReason =
  | "wrong_last_date"
  | "broken_link"
  | "wrong_eligibility"
  | "missing_result"
  | "other";

export interface SubmitInput {
  source: MessageSource;
  category: MessageCategory;
  message: string;
  reason?: MessageReason;
  name?: string;
  email?: string;
  phone?: string;
  pageUrl?: string;
  pageTitle?: string;
  consent?: boolean;
  /** Honeypot value — MUST be empty for a human. */
  honeypot?: string;
  /** ms the reader took from form-shown to submit. */
  filledMs: number;
}

export type SubmitResult =
  | { ok: true; ref: string }
  | { ok: false; error: string };

export function submitMessage(input: SubmitInput): Promise<SubmitResult> {
  return postSubmitMessage(input);
}

/**
 * Same rules as the edge function, enforced here too so the reader sees the
 * problem before sending (the function remains the authority).
 */
export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * ONE shared phone rule, used by this client AND the submit-message edge
 * function (supabase/functions/submit-message). Indian mobile: 10 digits
 * starting 6-9, with an optional +91 / 91 / 0 country/trunk prefix. Separators
 * a reader types for readability (spaces, dashes, dots, brackets) are stripped
 * BEFORE the test.
 *
 * Deliberately stricter than the old /^\+?9?1?[6-9][0-9]{9}$/, which read the
 * leading "9" as an optional country-code prefix and therefore accepted an
 * 11-digit number such as 98765432101. Here the prefix is anchored to the exact
 * strings +91 / 91 / 0, so 98765432101 is rejected while 09876543210 is accepted.
 */
export const PHONE_RE = /^(?:\+91|91|0)?[6-9]\d{9}$/;

/** Remove the separators a reader types for readability (keeps digits and +). */
export function stripPhoneSeparators(v: string): string {
  return v.trim().replace(/[\s\-().\[\]]/g, '');
}

/**
 * Canonical storage form: +91 followed by the 10-digit national number. Returns
 * null when the value is not a valid Indian mobile number. Any accepted prefix
 * (+91 / 91 / 0 / none) is dropped and re-added as +91, so every valid spelling
 * collapses to the same stored value.
 */
export function canonicalizePhone(v: string): string | null {
  const s = stripPhoneSeparators(v);
  if (!PHONE_RE.test(s)) return null;
  return `+91${s.replace(/\D/g, '').slice(-10)}`;
}

export function looksLikeEmail(v: string): boolean {
  return EMAIL_RE.test(v.trim());
}

export function looksLikePhone(v: string): boolean {
  return PHONE_RE.test(stripPhoneSeparators(v));
}

async function postSubmitMessage(input: SubmitInput): Promise<SubmitResult> {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return { ok: false, error: "The site cannot reach the message service right now. Please try again later." };
  }

  const body = {
    source: input.source,
    category: input.category,
    message: input.message,
    reason: input.reason ?? null,
    name: input.name?.trim() ?? "",
    email: input.email?.trim().toLowerCase() ?? "",
    phone: input.phone?.trim() ? (canonicalizePhone(input.phone) ?? input.phone.trim()) : "",
    page_url: input.pageUrl ?? "",
    page_title: input.pageTitle ?? "",
    consent: input.consent === true,
    website: input.honeypot ?? "",
    filled_ms: input.filledMs,
  };

  let res: Response;
  try {
    res = await fetch(`${env.SUPABASE_URL}/functions/v1/submit-message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    // Slow network / offline — plain words, no retry loop implied.
    return { ok: false, error: "Your connection could not reach us. Please check your network and try again." };
  }

  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; ref?: string; error?: string };
  if (data.ok === true && typeof data.ref === "string") {
    return { ok: true, ref: data.ref };
  }
  return { ok: false, error: data.error || "Something went wrong. Please try again." };
}
