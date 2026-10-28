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
  //
  // Why this WAITS rather than checking once: gtag.js is injected with strategy
  // "afterInteractive" and measured ~330 ms AFTER the document on a local production build
  // (qa/parity/ga-probe.mjs), while this effect runs on mount — so at the first pass
  // window.gtag is usually still undefined, and with send_page_view:false in the config
  // nothing else covers for it. The loop waits for the script, bounded at 30 × 200 ms, and
  // clears its timer on unmount. Verified after the change: BOTH documents of a hard
  // navigation emit an `en=page_view` hit to google-analytics.com/g/collect (2 of 2).
  //
  // Stated honestly: GA4 also BATCHES the hit (the request left ~5 s after the call), so an
  // earlier reading of "1 hit for 2 pages", taken with a 4 s wait, could not tell a dropped
  // call from a batched one. The ordering above is why the retry is right; a proven pre-fix
  // loss is NOT claimed here.
  useEffect(() => {
    if (!load) return;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let fired = false;
    const fire = () => {
      if (fired) return;
      if (typeof window.gtag === "function") {
        fired = true;
        window.gtag("event", "page_view", { page_path: pathname });
        return;
      }
      if (++tries >= 30) return;
      timer = setTimeout(fire, 200);
    };
    fire();
    return () => { if (timer) clearTimeout(timer); };
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
