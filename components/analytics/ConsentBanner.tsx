"use client";
/**
 * ConsentBanner — a minimal, honest analytics-consent notice (Phase C).
 *
 * Shows ONLY when the NEXT_PUBLIC_CONSENT_BANNER flag is on AND the reader has not
 * yet decided. Accept and Decline are equal-prominence buttons (no dark patterns);
 * "Learn more" goes to the privacy page. Decline keeps the site fully working and
 * loads nothing. The choice is stored via lib/analytics/consent and broadcast so
 * GATag can start (or stay off). With the flag OFF this renders nothing — the site
 * is byte-for-byte as it was before analytics existed.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { env } from "@/config/env";
import { writeConsent, hasConsentDecision } from "@/lib/analytics/consent";

export function ConsentBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (env.CONSENT_BANNER && !hasConsentDecision()) setOpen(true);
  }, []);

  if (!env.CONSENT_BANNER || !open) return null;

  const decide = (choice: "granted" | "denied") => {
    writeConsent(choice);
    window.dispatchEvent(new Event("iei-consent-change"));
    setOpen(false);
  };

  return (
    <div
      role="region"
      aria-label="Cookie and analytics consent / कुकी और एनालिटिक्स सहमति"
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-slate-200 bg-white/95 backdrop-blur px-4 py-3 shadow-lg"
    >
      <div className="container mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-700 leading-relaxed">
          We use optional analytics to understand which pages help readers; we do not sell
          your data. / वैकल्पिक एनालिटिक्स केवल यह समझने के लिए कि कौन-से पेज उपयोगी हैं; आपका डेटा नहीं बेचा जाता।{" "}
          <Link href="/privacy-policy" className="underline text-slate-900">Learn more / अधिक जानें</Link>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => decide("denied")}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
            Decline / अस्वीकार
          </button>
          <button type="button" onClick={() => decide("granted")}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50">
            Accept / स्वीकार
          </button>
        </div>
      </div>
    </div>
  );
}
