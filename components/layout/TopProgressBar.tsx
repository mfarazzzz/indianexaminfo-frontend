"use client";

/**
 * TopProgressBar — a thin (2px) indeterminate progress bar shown while a
 * client-side navigation is in flight.
 *
 * Why not useLinkStatus(): that hook reports only the pending state of the
 * <Link> it is rendered INSIDE. Mounted once in <body>, outside every Link, it
 * is permanently false. So we drive the bar from real navigation signals:
 *   START  — a capture-phase click on a same-origin <a> (skips target=_blank,
 *            modifier-clicks, middle-clicks, hash-only links and the current URL).
 *   FINISH — usePathname() changing (the new page committed), or a 10s safety
 *            timeout so the bar can never get stuck.
 *
 * No third-party dependency, no new package. usePathname needs no <Suspense>
 * boundary, and the bar is NOT wrapped in any loading/Suspense boundary so it
 * cannot degrade notFound()/redirect() to soft 200s (see E1/E2). aria-hidden and
 * pointer-events:none throughout.
 */
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/** True when clicking this anchor should start the bar (a real in-app nav). */
function isNavigationalLink(anchor: HTMLAnchorElement): boolean {
  if (!anchor.getAttribute("href")) return false;
  if (anchor.target && anchor.target !== "_self") return false; // _blank etc.
  if (anchor.hasAttribute("download")) return false;
  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return false;
  }
  if (url.origin !== window.location.origin) return false; // external
  const samePage =
    url.pathname === window.location.pathname && url.search === window.location.search;
  if (samePage && url.hash) return false; // hash-only jump
  if (samePage) return false; // current URL
  return true;
}

export function TopProgressBar() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);

  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const safety = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPath = useRef(pathname);

  const clearTimers = useCallback(() => {
    if (ticker.current) {
      clearInterval(ticker.current);
      ticker.current = null;
    }
    if (safety.current) {
      clearTimeout(safety.current);
      safety.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    clearTimers();
    setWidth(100);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setActive(false);
      setWidth(0);
      hideTimer.current = null;
    }, 300);
  }, [clearTimers]);

  const start = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    setActive(true);
    setWidth((w) => (w === 0 || w >= 100 ? 10 : Math.max(w, 10)));
    if (ticker.current) clearInterval(ticker.current);
    // Ease toward 92% while in flight; only finish() reaches 100%.
    ticker.current = setInterval(() => {
      setWidth((w) => (w >= 92 ? w : w + Math.max(0.4, (92 - w) * 0.08)));
    }, 200);
    if (safety.current) clearTimeout(safety.current);
    safety.current = setTimeout(finish, 10_000); // 10s safety net
  }, [finish]);

  // START — capture-phase document click (runs before Next's Link handling).
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const el = e.target instanceof Element ? e.target.closest("a") : null;
      if (el instanceof HTMLAnchorElement && isNavigationalLink(el)) start();
    }
    document.addEventListener("click", onClick, true); // capture
    return () => document.removeEventListener("click", onClick, true);
  }, [start]);

  // FINISH — the committed route changed.
  useEffect(() => {
    if (pathname !== lastPath.current) {
      lastPath.current = pathname;
      if (ticker.current) finish();
    }
  }, [pathname, finish]);

  // Cleanup on unmount.
  useEffect(
    () => () => {
      clearTimers();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [clearTimers]
  );

  if (!active) return null;

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
        opacity: 1,
        transition: "width 0.2s ease-out, opacity 0.3s ease 0.1s",
        zIndex: 9999,
        pointerEvents: "none",
        boxShadow: "0 0 6px rgba(26, 60, 110, 0.45)",
      }}
    />
  );
}
