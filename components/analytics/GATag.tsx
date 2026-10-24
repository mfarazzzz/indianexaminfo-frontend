"use client";
/**
 * GATag — loads GA4 (gtag.js) ONLY when a real GA_ID is configured AND the reader
 * has granted consent (Phase C). strategy "afterInteractive" so it never blocks the
 * initial paint. With no ID or no consent it renders nothing and loads nothing.
 * Re-checks consent when the ConsentBanner records a decision (custom event).
 */
import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { env } from "@/config/env";
import { readConsent, shouldLoadAnalytics, type ConsentChoice } from "@/lib/analytics/consent";

declare global { interface Window { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[] } }

export function GATag() {
  const [consent, setConsent] = useState<ConsentChoice | null>(null);
  const pathname = usePathname();

  // Read consent on mount + whenever the banner records a decision.
  useEffect(() => {
    setConsent(readConsent());
    const onChange = () => setConsent(readConsent());
    window.addEventListener("iei-consent-change", onChange);
    return () => window.removeEventListener("iei-consent-change", onChange);
  }, []);

  const load = shouldLoadAnalytics(env.GA_ID, consent);

  // page_view on every route change once loaded. (Path only — no query is sent.)
  useEffect(() => {
    if (!load || typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", { page_path: pathname });
  }, [load, pathname]);

  if (!load) return null;
  const id = env.GA_ID;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${id}', { send_page_view: false });`}
      </Script>
    </>
  );
}
