/**
 * OnThisPage.tsx — P1 item 9: the sticky jump row under the tab strip.
 *
 * A long exam page is a scroll marathon: the reader wants the fee, not the top of
 * the page again. These chips are anchors into the sections that ACTUALLY rendered
 * (the caller passes the same list the body loop used — see lib/exam/onThisPage.ts),
 * so a chip never scrolls to an empty slot.
 *
 * Mobile rules the row has to obey: it scrolls horizontally instead of wrapping
 * (no tall chip wall over the content), every target is at least 44px tall, and it
 * disappears entirely when there is nothing to jump between — a one-item "table of
 * contents" is not a control, it is noise.
 */
import { sectionHeadingEn } from "@/lib/exam/sectionHeadings";
import type { TocItem } from "@/lib/exam/onThisPage";

export function OnThisPageChips({ items }: { items: TocItem[] }) {
  if (items.length < 2) return null;
  return (
    <nav
      aria-label="On this page"
      data-testid="on-this-page"
      className="sticky top-0 z-20 -mx-4 px-4 py-2 mb-4 bg-surface/95 backdrop-blur border-b border-border"
    >
      <ul className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
        {items.map((it) => (
          <li key={it.key} className="shrink-0">
            <a
              href={it.href}
              className="inline-flex items-center whitespace-nowrap text-sm font-semibold px-3.5 min-h-[44px] rounded border border-border bg-card text-gray-700 hover:border-primary hover:text-primary transition-colors focus:ring-2 focus:ring-primary/50 focus:outline-none"
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
      {/* Screen-reader note: the row is English labels from the ONE heading config; the
          bilingual heading itself is the section it points at. */}
      <span className="sr-only">Jump to a section on this page. Labels match the {sectionHeadingEn("important-dates")} and section headings below.</span>
    </nav>
  );
}
