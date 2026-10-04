"use client";

/**
 * ReportErrorControl — "इस पेज में गलती बताएँ / Report an error on this page"
 * (Sprint 0 Part 3, owner brief S0-5 A.2).
 *
 * Sits NEAR THE TOP of the content on every content page (vacancy, exam and
 * its tabs, admission, board, university, news, blog) — never buried in the
 * footer. Opens a BOTTOM SHEET on mobile and a MODAL on desktop (one
 * component, Tailwind decides). Pre-filled with the page URL and title from
 * the live location — the reader corrects, never retypes.
 *
 * One-tap reasons (exactly the reader_messages.reason enum), an optional
 * note, OPTIONAL contact details to lower the barrier. Submit goes to the
 * submit-message edge function (source page_report) with the honeypot and
 * the fill-time; the success screen shows the IEI reference.
 *
 * Mobile-first rules from the brief: Hindi + English labels, tap targets
 * ≥ 44 px, no login, no third-party scripts, works on slow networks (one
 * small POST, plain-word failures).
 */
import { useEffect, useRef, useState } from "react";
import {
  submitMessage,
  validateContact,
  canonicalizePhone,
  type MessageReason,
  type SubmitResult,
} from "@/lib/contact/submitMessage";

const REASONS: { value: MessageReason; hi: string; en: string }[] = [
  { value: "wrong_last_date", hi: "अंतिम तिथि गलत है", en: "Last date is wrong" },
  { value: "broken_link", hi: "कोई लिंक नहीं खुल रहा", en: "A link is broken" },
  { value: "wrong_eligibility", hi: "योग्यता / आयु / फ़ीस गलत", en: "Eligibility / age / fee wrong" },
  { value: "missing_result", hi: "रिज़ल्ट / एडमिट कार्ड आया, यहाँ नहीं दिखा", en: "Result or admit card out but not shown here" },
  { value: "other", hi: "कोई और गलती", en: "Some other mistake" },
];

export function ReportErrorControl() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<MessageReason | null>(null);
  const [note, setNote] = useState("");
  const [name, setName] = useState("");
  // B3: separate optional email + mobile reply contacts (both optional here).
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [pageUrl, setPageUrl] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const shownAt = useRef<number>(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstTapRef = useRef<HTMLButtonElement>(null);

  // Esc closes; opening moves focus and stamps the fill-time clock.
  useEffect(() => {
    if (!open) return;
    shownAt.current = Date.now();
    setPageUrl(window.location.href);
    setPageTitle(document.title);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    firstTapRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function reset() {
    setReason(null);
    setNote("");
    setName("");
    setEmail("");
    setPhone("");
    setHoneypot("");
    setResult(null);
  }

  const emailFilled = email.trim() !== "";
  const phoneFilled = phone.trim() !== "";
  // B3: both optional here (requireOne=false); each validated only when filled.
  const { emailValid, phoneValid } = validateContact(email, phone, false);

  const canSend =
    reason !== null &&
    (reason !== "other" || note.trim().length >= 10) &&
    emailValid && phoneValid &&
    !busy;

  async function send() {
    if (!canSend || !reason) return;
    setBusy(true);
    const label = REASONS.find((r) => r.value === reason)!;
    // The function requires message 10-2000 chars: the one-tap reason IS the
    // message; a note is appended when given. ("Other" makes the note required.)
    const message = note.trim()
      ? `${label.en} — ${note.trim()}`
      : `${label.en} (reported from this page)`;
    const res = await submitMessage({
      source: "page_report",
      category: "report_error",
      message: message.slice(0, 2000),
      reason,
      name: name.trim() || undefined,
      email: emailFilled ? email.trim() : undefined,
      phone: phoneFilled ? (canonicalizePhone(phone.trim()) ?? undefined) : undefined,
      pageUrl,
      pageTitle,
      honeypot,
      filledMs: Date.now() - shownAt.current,
    });
    setResult(res);
    setBusy(false);
  }

  return (
    <>
      {/* The trigger — deliberately in the reader's words, both languages. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded border border-border bg-card text-xs sm:text-sm text-gray-600 hover:border-primary hover:text-primary transition-colors focus:ring-2 focus:ring-primary/50 focus:outline-none"
        aria-haspopup="dialog"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        इस पेज में गलती बताएँ · Report an error on this page
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Report an error on this page · इस पेज में गलती बताएँ"
            className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-xl border border-border shadow-lg max-h-[85vh] overflow-y-auto"
          >
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h2 className="font-heading font-bold text-base text-gray-900">
                  इस पेज में गलती बताएँ
                  <span className="block text-sm font-semibold text-gray-500 mt-0.5">Report an error on this page</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="min-h-[44px] min-w-[44px] -mr-2 -mt-1 rounded text-gray-400 hover:text-gray-700 text-xl leading-none"
                  aria-label="Close · बंद करें"
                >
                  ×
                </button>
              </div>

              {result?.ok ? (
                /* Success — reference + what happens next, in plain words. */
                <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="font-semibold text-green-800 text-sm">धन्यवाद! Thank you — your report is saved.</p>
                  <p className="text-sm text-green-900 mt-2">
                    Reference: <strong className="font-mono">{result.ref}</strong>
                  </p>
                  <p className="text-xs text-green-800/80 mt-2 leading-relaxed">
                    हमारी टीम इस पेज की जाँच करेगी और गलति मिलने पर उसे ठीक करेगी।
                    Our team will check this page against the official source and fix anything
                    wrong. You don&apos;t need to do anything else.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setOpen(false); reset(); }}
                    className="mt-3 min-h-[44px] px-4 rounded bg-primary text-white text-sm font-semibold"
                  >
                    बंद करें · Close
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mb-3 truncate" title={pageTitle}>
                    {pageUrl}
                  </p>

                  {/* One-tap reasons */}
                  <div className="grid gap-2" role="radiogroup" aria-label="What is wrong? · क्या गलत है?">
                    {REASONS.map((r, i) => (
                      <button
                        key={r.value}
                        type="button"
                        ref={i === 0 ? firstTapRef : undefined}
                        role="radio"
                        aria-checked={reason === r.value}
                        onClick={() => setReason(r.value)}
                        className={`min-h-[44px] text-left px-3 rounded-lg border text-sm transition-colors ${
                          reason === r.value
                            ? "border-primary bg-primary/5 text-gray-900 font-semibold"
                            : "border-border bg-white text-gray-700 hover:border-primary/50"
                        }`}
                      >
                        {r.hi}
                        <span className="block text-xs text-gray-500 font-normal">{r.en}</span>
                      </button>
                    ))}
                  </div>

                  {/* Optional note — required only for "other" (10 chars min). */}
                  <label className="block mt-3 text-sm font-medium text-gray-700" htmlFor="re-note">
                    कुछ और बताएँ (ज़रूरी नहीं) <span className="text-gray-500 font-normal">— Add a note (optional)</span>
                  </label>
                  <textarea
                    id="re-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, 1500))}
                    rows={3}
                    required={reason === "other"}
                    placeholder={reason === "other" ? "कृपया बताएँ क्या गलत है (कम से कम 10 अक्षर) — please describe the mistake" : "तिथि, लिंक, विभाग… — date, link, category…"}
                    className="mt-1 w-full border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors resize-none"
                  />

                  {/* Optional contact — lowers the barrier (A.2). B3: separate
                      optional email + mobile, each validated only when filled. */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value.slice(0, 120))}
                      placeholder="नाम (वैकल्पिक) · Name (optional)"
                      aria-label="Name (optional)"
                      className="border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.slice(0, 254))}
                      placeholder="ईमेल (वैकल्पिक) · Email"
                      aria-label="Email (optional)"
                      inputMode="email"
                      autoComplete="email"
                      aria-invalid={emailFilled && !emailValid}
                      className={`border rounded-lg px-3 py-2.5 text-sm outline-none transition-colors ${
                        emailFilled && !emailValid ? "border-red-400" : "border-border focus:border-primary"
                      }`}
                    />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.slice(0, 20))}
                      placeholder="मोबाइल नंबर (वैकल्पिक) · Mobile number"
                      aria-label="Mobile number (optional)"
                      inputMode="numeric"
                      autoComplete="tel"
                      aria-invalid={phoneFilled && !phoneValid}
                      className={`border rounded-lg px-3 py-2.5 text-sm outline-none transition-colors ${
                        phoneFilled && !phoneValid ? "border-red-400" : "border-border focus:border-primary"
                      }`}
                    />
                  </div>
                  {(emailFilled && !emailValid) && (
                    <p className="text-xs text-red-600 mt-1">यह ईमेल सही नहीं लग रहा — that email doesn&apos;t look right.</p>
                  )}
                  {(phoneFilled && !phoneValid) && (
                    <p className="text-xs text-red-600 mt-1">यह मोबाइल नंबर सही नहीं लग रहा — that mobile number doesn&apos;t look right.</p>
                  )}

                  {/* Honeypot: bots fill it, humans never see it. */}
                  <input
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    name="website"
                    type="text"
                    autoComplete="off"
                    tabIndex={-1}
                    aria-hidden="true"
                    className="absolute left-[-9999px] top-[-9999px] h-0 w-0 opacity-0"
                  />

                  {result && !result.ok && (
                    <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3">
                      {result.error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={send}
                    disabled={!canSend}
                    className="mt-4 w-full min-h-[48px] rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-40 transition-opacity"
                  >
                    {busy ? "भेज रहे हैं… Sending…" : "भेजें · Send report"}
                  </button>

                  <p className="text-xs text-gray-400 mt-3 text-center">
                    कोई और बात?{" "}
                    <a href={`/contact?page=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(pageTitle)}`} className="text-primary hover:underline">
                      Contact page खोलें · use the contact page
                    </a>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
