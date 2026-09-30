"use client";

/**
 * ContactForm — the working /contact form (Sprint 0 Part 3, owner brief
 * S0-5 A.1). Designed for the tier-2/3 mobile reader: Hindi + English labels,
 * few fields, 44px tap targets, works on slow networks, no login, no
 * third-party scripts.
 *
 * Fields exactly per the brief:
 *  - category  (the six reader_messages categories, in readers' words)
 *  - message   (required, 10–2000 chars, live counter)
 *  - name      (optional)
 *  - email OR phone (at least one; Indian mobile format accepted — ONE smart
 *    field that tells them which it found, fewer boxes to fill)
 *  - page URL  (auto-filled when arriving from a page via ?page=&title=,
 *    editable)
 *  - one-line privacy consent linking the privacy notice
 *
 * Submit → submit-message edge function (source contact_form). Success
 * screen: the IEI reference number and, in plain words, what happens next.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  submitMessage,
  looksLikeEmail,
  looksLikePhone,
  canonicalizePhone,
  type MessageCategory,
  type SubmitResult,
} from "@/lib/contact/submitMessage";

const CATEGORIES: { value: MessageCategory; hi: string; en: string }[] = [
  { value: "report_error", hi: "किसी पेज में गलती", en: "Report an error on a page" },
  { value: "suggest_update", hi: "नई जानकारी / नई वैकेंसी जोड़ें", en: "Suggest an update or a new vacancy" },
  { value: "general_question", hi: "कोई सवाल", en: "General question" },
  { value: "technical_problem", hi: "साइट पर तकनीकी दिक्कत", en: "Technical problem on the site" },
  { value: "advertising", hi: "विज्ञापन / साझेदारी", en: "Advertising or partnership" },
  { value: "legal_removal", hi: "सामग्री हटाना / कानूनी अनुरोध", en: "Content removal or legal" },
];

export function ContactForm() {
  const [category, setCategory] = useState<MessageCategory>("general_question");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const shownAt = useRef<number>(Date.now());

  // Auto-fill the page the reader came from (?page=&title= — set by the
  // report sheet's "use the contact page" link and any future deep link).
  useEffect(() => {
    shownAt.current = Date.now();
    const p = new URLSearchParams(window.location.search);
    const from = p.get("page");
    if (from) setPageUrl(from);
    const t = p.get("title");
    if (t) setPageTitle(t);
  }, []);

  const contactKind = contact.trim() === "" ? "empty"
    : looksLikeEmail(contact) ? "email"
    : looksLikePhone(contact) ? "phone"
    : "invalid";

  const msgLen = message.trim().length;
  const msgOk = msgLen >= 10 && msgLen <= 2000;
  const canSend = msgOk && contactKind !== "empty" && contactKind !== "invalid" && consent && !busy;

  async function send() {
    if (!canSend) return;
    setBusy(true);
    const res = await submitMessage({
      source: "contact_form",
      category,
      message: message.trim().slice(0, 2000),
      name: name.trim() || undefined,
      email: contactKind === "email" ? contact.trim() : undefined,
      phone: contactKind === "phone" ? canonicalizePhone(contact) ?? undefined : undefined,
      pageUrl: pageUrl.trim() || undefined,
      pageTitle: pageTitle || undefined,
      consent: true,
      honeypot,
      filledMs: Date.now() - shownAt.current,
    });
    setResult(res);
    setBusy(false);
    if (res.ok) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (result?.ok) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-5" role="status">
        <p className="font-semibold text-green-800">संदेश मिल गया — your message is saved.</p>
        <p className="text-sm text-green-900 mt-2">
          Reference number: <strong className="font-mono text-base">{result.ref}</strong>
        </p>
        <p className="text-xs text-green-800/80 mt-3 leading-relaxed">
          अब आगे क्या होगा: हमारी टीम आपका संदेश पढ़ेगी। अगर आपने किसी पेज की गलती बताई है,
          हम उसे ऑफिशियल सोर्स से मिलाकर ठीक करेंगे। ज़रूरत लगी तो आपके दिए ईमेल/फ़ोन पर जवाब
          आएगा। — Our team reads every message. Page-error reports are checked against the
          official source and fixed; if we need to ask something, we reply on the email or
          phone you gave. Keep the reference number above.
        </p>
        <button
          type="button"
          onClick={() => { setResult(null); setMessage(""); setName(""); setContact(""); setConsent(false); }}
          className="mt-4 min-h-[44px] px-4 rounded-lg border border-green-300 text-sm font-semibold text-green-800"
        >
          दूसरा संदेश भेजें · Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      aria-label="Contact form · संपर्क फ़ॉर्म"
      onSubmit={(e) => { e.preventDefault(); void send(); }}
    >
      {/* Category */}
      <div>
        <label htmlFor="cf-cat" className="block text-sm font-medium text-gray-700 mb-1.5">
          किस बारे में? · What is it about?
        </label>
        <select
          id="cf-cat"
          value={category}
          onChange={(e) => setCategory(e.target.value as MessageCategory)}
          className="w-full border border-border rounded-lg px-3 py-2.5 min-h-[44px] text-sm outline-none focus:border-primary transition-colors bg-white"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.hi} — {c.en}</option>
          ))}
        </select>
      </div>

      {/* Message — the one required long field, with an honest counter */}
      <div>
        <label htmlFor="cf-msg" className="block text-sm font-medium text-gray-700 mb-1.5">
          अपना संदेश लिखें · Your message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="cf-msg"
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
          rows={5}
          required
          minLength={10}
          maxLength={2000}
          placeholder="कृपया विस्तार से लिखें — पेज का नाम, क्या गलत है, सही क्या होना चाहिए…"
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary transition-colors resize-y"
        />
        <p className={`text-xs mt-1 ${msgLen > 0 && !msgOk ? "text-red-600" : "text-gray-400"}`}>
          {msgLen}/2000 {msgLen > 0 && !msgOk ? " — कम से कम 10 अक्षर (at least 10 characters)" : ""}
        </p>
      </div>

      {/* Name optional; ONE smart contact field (email or phone) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="cf-name" className="block text-sm font-medium text-gray-700 mb-1.5">
            नाम · Name <span className="text-gray-400 font-normal">(वैकल्पिक · optional)</span>
          </label>
          <input
            id="cf-name"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 120))}
            autoComplete="name"
            className="w-full border border-border rounded-lg px-3 py-2.5 min-h-[44px] text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label htmlFor="cf-contact" className="block text-sm font-medium text-gray-700 mb-1.5">
            ईमेल या फ़ोन · Email or phone <span className="text-red-500">*</span>
          </label>
          <input
            id="cf-contact"
            value={contact}
            onChange={(e) => setContact(e.target.value.slice(0, 254))}
            required
            inputMode="email"
            autoComplete="email"
            placeholder="you@email.com या 9876543210"
            aria-describedby="cf-contact-hint"
            className={`w-full border rounded-lg px-3 py-2.5 min-h-[44px] text-sm outline-none transition-colors ${
              contactKind === "invalid" ? "border-red-400" : "border-border focus:border-primary"
            }`}
          />
          <p id="cf-contact-hint" className={`text-xs mt-1 ${
            contactKind === "invalid" ? "text-red-600" : contactKind === "email" || contactKind === "phone" ? "text-green-700" : "text-gray-400"
          }`}>
            {contactKind === "invalid" && "सही ईमेल या 10 अंकों का भारतीय मोबाइल नंबर डालें — enter a valid email or Indian mobile number"}
            {contactKind === "email" && "ईमेल पहचाना · recognised as email"}
            {contactKind === "phone" && "मोबाइल नंबर पहचाना · recognised as Indian mobile"}
            {(contactKind === "empty") && "कम से कम एक ज़रूरी — at least one is needed so we can reply"}
          </p>
        </div>
      </div>

      {/* Page URL — auto-filled from the report sheet link, editable */}
      <div>
        <label htmlFor="cf-url" className="block text-sm font-medium text-gray-700 mb-1.5">
          किस पेज के बारे में? · Which page is this about? <span className="text-gray-400 font-normal">(वैकल्पिक · optional)</span>
        </label>
        <input
          id="cf-url"
          value={pageUrl}
          onChange={(e) => setPageUrl(e.target.value.slice(0, 500))}
          inputMode="url"
          placeholder="https://www.indianexaminfo.com/… — the link is added automatically when you come from a page"
          className="w-full border border-border rounded-lg px-3 py-2.5 min-h-[44px] text-sm outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* One-line consent with the privacy link */}
      <label className="flex items-start gap-2.5 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
          className="mt-1 w-5 h-5 shrink-0 accent-primary"
        />
        <span>
          मैं सहमत हूँ कि यह जानकारी टीम को जवाब देने के लिए उपयोग होगी —{" "}
          <Link href="/privacy-policy" className="text-primary hover:underline">privacy notice</Link> में बताई
          गई जानकारी के अनुसार।
        </span>
      </label>

      {/* Honeypot — bots fill it, humans never see it (A: honeypot + time) */}
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
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {result.error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSend}
        className="w-full sm:w-auto min-h-[48px] px-8 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-40 transition-opacity"
      >
        {busy ? "भेज रहे हैं… Sending…" : "भेजें · Send message"}
      </button>
    </form>
  );
}
