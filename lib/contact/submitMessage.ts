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

export type MessageSource = "contact_form" | "report_sheet";

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
 * Indian mobile (10 digits starting 6-9), optional +91/91/9/1 prefix —
 * EXACTLY the edge function's regex. Keep in lock-step with
 * supabase/functions/submit-message: the server does not strip separators,
 * so callers must normalizePhone() before validating AND before sending.
 */
export const PHONE_RE = /^\+?9?1?[6-9][0-9]{9}$/;

/**
 * Strip spaces/dashes/parentheses a reader types for readability, keeping
 * digits and a leading '+'. This is the value we both validate and send, so
 * the client's decision always matches the server's raw regex test.
 */
export function normalizePhone(v: string): string {
  const trimmed = v.trim();
  const leadPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  return leadPlus ? `+${digits}` : digits;
}

export function looksLikeEmail(v: string): boolean {
  return EMAIL_RE.test(v.trim());
}

export function looksLikePhone(v: string): boolean {
  return PHONE_RE.test(normalizePhone(v));
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
    phone: input.phone?.trim() ?? "",
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
