"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDate, contentTypeLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type UpdateItem = {
  id: string;
  title: string;
  href: string;
  category: string;
  pillar: string;
  contentType: string;
  date: string;
  isUrgent: boolean;
};

type Props = { items: UpdateItem[] };

const FILTERS = ["All", "Government", "Entrance", "Boards"] as const;
type Filter = (typeof FILTERS)[number];

const pillarToFilter: Record<string, Filter> = {
  "sarkari-naukri":  "Government",
  "government-exam": "Government",
  "govt-vacancy":    "Government",
  "entrance-exam":   "Entrance",
  "board-exam":      "Boards",
  "university-exam": "Boards",
  "board-university": "Boards",
};

const ctColors: Record<string, string> = {
  "admit-card":  "bg-orange-100 text-orange-700",
  result:        "bg-green-100 text-green-700",
  "answer-key":  "bg-yellow-100 text-yellow-700",
  notification:  "bg-blue-100 text-blue-700",
  application:   "bg-blue-100 text-blue-700",
  syllabus:      "bg-indigo-100 text-indigo-700",
  "date-sheet":  "bg-teal-100 text-teal-700",
  cutoff:        "bg-pink-100 text-pink-700",
  default:       "bg-gray-100 text-gray-600",
};

function ctColor(ct: string): string {
  return ctColors[ct] ?? ctColors.default;
}

/** Prominent items shown before "View All" expands the rest. */
const INITIAL_COUNT = 6;

export function LatestUpdatesClient({ items }: Props) {
  const [active, setActive] = useState<Filter>("All");
  const [expanded, setExpanded] = useState(false);

  const filtered =
    active === "All"
      ? items
      : items.filter((i) => pillarToFilter[i.pillar] === active);

  // Reuse the already-fetched items — "View All" reveals the rest client-side,
  // it does NOT trigger another request.
  const visible = expanded ? filtered : filtered.slice(0, INITIAL_COUNT);
  const hiddenCount = filtered.length - visible.length;

  return (
    <section aria-labelledby="latest-updates-heading">
      {/* Header + filter tabs */}
      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
        <div>
          <h2 id="latest-updates-heading" className="font-heading font-black text-base text-gray-900 uppercase tracking-wide">
            Latest Updates
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Live notifications, results &amp; admit cards</p>
        </div>
        <div
          className="flex items-center gap-0 border border-border rounded overflow-hidden"
          role="group"
          aria-label="Filter updates by category"
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => { setActive(f); setExpanded(false); }}
              aria-pressed={active === f}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold border-r border-border last:border-r-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                active === f ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Updates list */}
      <div className="bg-white border border-border divide-y divide-border shadow-sm">
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">No updates found.</p>
        )}
        {visible.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            prefetch={false}
            className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
          >
            <span className={cn("shrink-0 mt-0.5 text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded", ctColor(item.contentType))}>
              {contentTypeLabel(item.contentType)}
            </span>
            <span className="flex-1 min-w-0 text-sm text-gray-800 group-hover:text-primary leading-snug">
              {item.title}
            </span>
            <span className={cn("shrink-0 text-xs font-mono", item.isUrgent ? "text-accent font-semibold" : "text-gray-400")}>
              {formatDate(item.date)}
            </span>
          </Link>
        ))}
      </div>

      {/* View All — reveals the remaining already-fetched items; no new request. */}
      {hiddenCount > 0 && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-primary bg-white border border-primary/30 hover:bg-primary/5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            View All Updates ({hiddenCount} more)
          </button>
        </div>
      )}
    </section>
  );
}
