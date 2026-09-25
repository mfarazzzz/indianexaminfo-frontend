"use client";

/**
 * StickyContextBar — the collapsed, detail-page header.
 *
 * On a detail page the global site header (HeaderWithMenu, 56px, sticky top-0)
 * is all the reader needs at the top of the page. Once they scroll down into
 * the content, that full header is wasted space and its wide nav is a
 * distraction. This bar replaces it on scroll with a compact strip carrying
 * only what the reader needs to stay oriented and get out: BACK, the exam's
 * SHORT NAME, and its STATUS.
 *
 * "One replaces the other" — not two bars stacked. This bar is fixed at the
 * very top with a z-index ABOVE the site header, and only appears after the
 * reader has scrolled past the header's own height while scrolling DOWN.
 * Scrolling back UP hides this bar again, revealing the sticky site header
 * underneath — so at any moment exactly one of them is visible at top:0.
 *
 * Height: h-12 (48px) — deliberately shorter than the 56px header so the
 * collapsed state reads as different, and small enough (12% of a 400px screen)
 * to leave the content the space.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { statusColor } from "@/lib/utils";

interface Props {
  shortName: string;
  status: string;
}

// Reveal only after scrolling past roughly the site header height, so the bar
// never flickers in at the very top where the real header still sits.
const REVEAL_AFTER_PX = 120;

export function StickyContextBar({ shortName, status }: Props) {
  const [visible, setVisible] = useState(false);
  const lastYRef = useRef(0);
  const router = useRouter();

  useEffect(() => {
    lastYRef.current = window.scrollY;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const goingDown = y > lastYRef.current;
        // Show when scrolling down past the header; hide the moment the reader
        // scrolls up (the sticky site header comes back), or near the top.
        if (y < REVEAL_AFTER_PX) {
          setVisible(false);
        } else if (goingDown) {
          setVisible(true);
        } else {
          setVisible(false);
        }
        lastYRef.current = y;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed top-0 inset-x-0 z-[70] h-12 bg-white border-b border-gray-200 shadow-sm transition-transform duration-200 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="max-w-7xl mx-auto h-full px-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="shrink-0 flex items-center gap-1 -ml-1 px-2 py-1.5 rounded-md text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">Back</span>
        </button>

        <span className="flex-1 min-w-0 truncate text-sm font-semibold text-gray-900">
          {shortName}
        </span>

        <span className={`shrink-0 status-badge ${statusColor(status)}`}>
          {status.replace(/-/g, " ")}
        </span>
      </div>
    </div>
  );
}
