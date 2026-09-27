"use client";

/**
 * TopProgressBar — a thin (2px) indeterminate progress bar shown while a
 * client-side navigation is pending.
 *
 * Why this exists: with the root `loading.tsx` removed (E2), a tap on a link
 * gave no visual feedback until the server answered. This restores that
 * feedback WITHOUT adding a Suspense/loading boundary above any route (which
 * would re-degrade notFound()/redirect() to soft 200s — see E1/E2).
 *
 * Driven purely by Next's built-in `useLinkStatus()` (from `next/link`), which
 * reports `{ pending }` for <Link>/router.push transitions. No third-party
 * dependency, no new package. Renders nothing to the accessibility tree
 * (aria-hidden) and never intercepts pointer events.
 */
import { useLinkStatus } from "next/link";
import { useEffect, useRef, useState } from "react";

export function TopProgressBar() {
  const { pending } = useLinkStatus();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (pending) {
      setVisible(true);
      // (Re)start from a small offset on a fresh navigation.
      setWidth((w) => (w === 0 || w >= 100 ? 10 : Math.max(w, 10)));
      if (ticker.current) clearInterval(ticker.current);
      // Ease toward 92% while in flight; never reaches 100% until resolved.
      ticker.current = setInterval(() => {
        setWidth((w) => (w >= 92 ? w : w + Math.max(0.4, (92 - w) * 0.08)));
      }, 200);
    } else {
      if (ticker.current) {
        clearInterval(ticker.current);
        ticker.current = null;
      }
      // Snap to complete, then fade out and reset for the next navigation.
      setWidth(100);
      const hide = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 350);
      return () => clearTimeout(hide);
    }
    return () => {
      if (ticker.current) {
        clearInterval(ticker.current);
        ticker.current = null;
      }
    };
  }, [pending]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "2px",
        width: `${width}%`,
        background: "#1A3C6E",
        opacity: visible ? 1 : 0,
        transition: pending
          ? "width 0.2s linear, opacity 0.15s ease"
          : "width 0.2s ease-out, opacity 0.3s ease 0.1s",
        zIndex: 9999,
        pointerEvents: "none",
        boxShadow: "0 0 6px rgba(26, 60, 110, 0.45)",
      }}
    />
  );
}
