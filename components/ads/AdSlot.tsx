"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";

export type AdSize = "728x90" | "300x250" | "336x280" | "160x600" | "320x50";

const sizeMap: Record<AdSize, { w: number; h: number }> = {
  "728x90":  { w: 728, h: 90 },
  "300x250": { w: 300, h: 250 },
  "336x280": { w: 336, h: 280 },
  "160x600": { w: 160, h: 600 },
  "320x50":  { w: 320, h: 50 },
};

export type AdCreative = {
  id: string;
  type: "image" | "html" | "text-link";
  imageUrl?: string | null;
  htmlCode?: string | null;
  linkUrl: string;
  altText?: string | null;
};

type AdSlotProps = {
  position: string;
  size: AdSize;
  className?: string;
  /** If the parent already resolved an active creative, pass it here to avoid a client-side fetch */
  creative?: AdCreative | null;
  /** AdSense publisher ID — injected from settings, falls back to env */
  adsensePublisherId?: string;
};

/**
 * AdSlot — renders a CMS-managed ad creative or falls back to Google AdSense.
 *
 * Priority:
 *  1. Direct creative passed via `creative` prop (pre-resolved server-side)
 *  2. Direct ad creative fetched client-side from /api/ads/[position]
 *  3. Google AdSense
 *  4. Empty reserved space (dev: shows dashed placeholder)
 */
export function AdSlot({ position, size, className, creative: initialCreative, adsensePublisherId }: AdSlotProps) {
  const dim = sizeMap[size] ?? { w: 728, h: 90 };
  const isDev = process.env.NODE_ENV === "development";
  const ref = useRef<HTMLDivElement>(null);
  const [creative, setCreative] = useState<AdCreative | null>(initialCreative ?? null);
  const [adSenseLoaded, setAdSenseLoaded] = useState(false);

  // If no creative pre-resolved, try fetching from API route
  useEffect(() => {
    if (creative || initialCreative !== undefined) return; // already have data or explicit null
    fetch(`/api/ads/${encodeURIComponent(position)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data: AdCreative | null) => {
        if (data) setCreative(data);
      })
      .catch(() => {/* silent fail — fall through to AdSense */});
  }, [position, creative, initialCreative]);

  // Trigger AdSense push when no direct creative and AdSense is configured
  useEffect(() => {
    if (creative) return; // direct ad takes priority
    const pubId = adsensePublisherId || process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
    if (!pubId || adSenseLoaded) return;

    // Push the adsbygoogle command — AdSense script must already be in layout
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      setAdSenseLoaded(true);
    } catch {/* ignore */}
  }, [creative, adsensePublisherId, adSenseLoaded]);

  const pubId = adsensePublisherId || process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "ca-pub-XXXXXXXXXX";

  // ── Dev mode placeholder ──────────────────────────────────────────────
  if (isDev) {
    return (
      <div
        ref={ref}
        data-ad-slot={position}
        data-ad-size={size}
        style={{ width: "100%", maxWidth: dim.w, minHeight: dim.h, margin: "0 auto" }}
        className={cn(
          "border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1",
          className
        )}
        aria-hidden="true"
      >
        <span className="text-xs text-gray-300 select-none font-mono">{size}</span>
        <span className="text-[10px] text-gray-200 select-none font-mono">{position}</span>
      </div>
    );
  }

  // ── Direct HTML creative ──────────────────────────────────────────────
  if (creative?.type === "html" && creative.htmlCode) {
    return (
      <div
        ref={ref}
        data-ad-slot={position}
        style={{ width: "100%", maxWidth: dim.w, margin: "0 auto", display: "block" }}
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(creative.htmlCode) }}
        aria-label="Advertisement"
      />
    );
  }

  // ── Direct image creative ─────────────────────────────────────────────
  if (creative?.type === "image" && creative.imageUrl) {
    return (
      <div
        ref={ref}
        data-ad-slot={position}
        style={{ width: "100%", maxWidth: dim.w, margin: "0 auto" }}
        className={className}
      >
        <a href={creative.linkUrl} target="_blank" rel="noopener noreferrer sponsored" aria-label={creative.altText ?? "Advertisement"}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={creative.imageUrl}
            alt={creative.altText ?? "Advertisement"}
            width={dim.w}
            height={dim.h}
            loading="lazy"
            style={{ width: "100%", height: "auto", maxWidth: dim.w }}
          />
        </a>
      </div>
    );
  }

  // ── Direct text-link creative ─────────────────────────────────────────
  if (creative?.type === "text-link") {
    return (
      <div
        ref={ref}
        data-ad-slot={position}
        style={{ width: "100%", maxWidth: dim.w, minHeight: dim.h, margin: "0 auto" }}
        className={cn("flex items-center justify-center", className)}
      >
        <a
          href={creative.linkUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="text-sm text-primary hover:underline"
          aria-label={creative.altText ?? "Sponsored link"}
        >
          {creative.altText ?? "Advertisement"}
        </a>
      </div>
    );
  }

  // ── Google AdSense fallback ───────────────────────────────────────────
  return (
    <div
      ref={ref}
      data-ad-slot={position}
      style={{ width: "100%", maxWidth: dim.w, margin: "0 auto", display: "block" }}
      className={className}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height: dim.h }}
        data-ad-client={pubId}
        data-ad-slot={position}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
