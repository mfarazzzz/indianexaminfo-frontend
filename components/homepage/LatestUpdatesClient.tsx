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

// Part E: plain coloured TEXT for the informative content-type tags — no pastel
// pill backgrounds. Status/result colours are retained (result green, admit
// card orange); everything else is neutral grey.
const ctTextColors: Record<string, string> = {
  "admit-card":  "text-orange-700",
  result:        "text-green-700",
  "answer-key":  "text-yellow-700",
  "date-sheet":  "text-teal-700",
  default:       "text-gray-500",
};

function ctTextColor(ct: string): string {
  return ctTextColors[ct] ?? ctTextColors.default;
}

/** Initial items shown on the homepage (~6–8). The dedicated list route owns
 *  access to the full collection — no on-page "View All" button. */
const INITIAL_COUNT = 7;

export function LatestUpdatesClient({ items }: Props) {
  const [active, setActive] = useState<Filter>("All");

  const filtered =
    active === "All"
      ? items
      : items.filter((i) => pillarToFilter[i.pillar] === active);

  const visible = filtered.slice(0, INITIAL_COUNT);

  return (
    <section aria-labelledby="latest-updates-heading">
      {/* Header + filter tabs */}
      <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
        <div>
          <h2 id="latest-updates-heading" className="font-heading font-bold text-lg text-gray-900">
            Latest updates
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Notifications, results, admit cards and more</p>
        </div>
        <div
          className="flex items-center gap-0 border border-border rounded-md overflow-hidden"
          role="group"
          aria-label="Filter updates by category"
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
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

      {/* Updates list — subtle row separators, not heavy boxes */}
      <div className="bg-white border border-border rounded-lg divide-y divide-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">No updates found.</p>
        )}
        {visible.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            prefetch={false}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
          >
            {/* Part E: the NOTIFICATION badge carries no information (every row
                would be tagged) — drop it. Informative types (result, admit
                card, answer key) keep a plain text tag, no pastel pill. */}
            {item.contentType !== "notification" && (
              <span className={cn("shrink-0 text-[10px] font-semibold uppercase tracking-wide", ctTextColor(item.contentType))}>
                {contentTypeLabel(item.contentType)}
              </span>
            )}
            <span className="flex-1 min-w-0 text-sm font-medium text-gray-800 group-hover:text-primary leading-snug truncate">
              {item.title}
            </span>
            <span className={cn("shrink-0 text-xs", item.isUrgent ? "text-accent font-semibold" : "text-gray-500")}>
              {formatDate(item.date)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
