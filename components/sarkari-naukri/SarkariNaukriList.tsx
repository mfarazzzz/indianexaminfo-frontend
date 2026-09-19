"use client";

import { useState } from "react";
import Link from "next/link";
import type { SarkariNaukriItem } from "@/services/sarkariNaukriService";
import { daysUntil } from "@/lib/utils";

const PAGE_SIZE = 20;

// ── Status badge ────────────────────────────────────────────────────────────
// Actionable / urgent statuses get a larger, more prominent badge.
// Completed/cancelled get a quiet muted treatment.
type BadgeWeight = "high" | "normal" | "muted";

const STATUS_CONFIG: Record<string, { label: string; cls: string; weight: BadgeWeight }> = {
  "application-open":    { label: "Apply Now",       cls: "bg-green-600 text-white",            weight: "high" },
  "admit-card-released": { label: "Admit Card Out",  cls: "bg-purple-600 text-white",           weight: "high" },
  "result-declared":     { label: "Result Declared", cls: "bg-emerald-600 text-white",          weight: "high" },
  "exam-scheduled":      { label: "Exam Scheduled",  cls: "bg-indigo-100 text-indigo-700",      weight: "normal" },
  "notified":            { label: "Notified",        cls: "bg-blue-100 text-blue-700",          weight: "normal" },
  "upcoming":            { label: "Upcoming",        cls: "bg-blue-100 text-blue-700",          weight: "normal" },
  "application-closed":  { label: "Closed",          cls: "bg-gray-200 text-gray-500",          weight: "muted" },
  "answer-key-released": { label: "Answer Key Out",  cls: "bg-yellow-100 text-yellow-700",      weight: "normal" },
  "interview-scheduled": { label: "Interview",       cls: "bg-orange-100 text-orange-700",      weight: "normal" },
  "merit-list-released": { label: "Merit List",      cls: "bg-teal-100 text-teal-700",          weight: "normal" },
  "completed":           { label: "Completed",       cls: "bg-gray-100 text-gray-400",          weight: "muted" },
  "cancelled":           { label: "Cancelled",       cls: "bg-red-100 text-red-400",            weight: "muted" },
};

// Left border accent by urgency bucket — scannable without reading the badge.
const CARD_ACCENT: Record<string, string> = {
  "application-open":    "border-l-4 border-l-green-500",
  "admit-card-released": "border-l-4 border-l-purple-500",
  "result-declared":     "border-l-4 border-l-emerald-500",
  "exam-scheduled":      "border-l-4 border-l-indigo-300",
  "notified":            "border-l-4 border-l-blue-300",
  "upcoming":            "border-l-4 border-l-blue-200",
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    cls: "bg-gray-100 text-gray-500",
    weight: "normal" as const,
  };
  const sizeCls = cfg.weight === "high"
    ? "px-2.5 py-0.5 text-xs font-bold rounded"
    : cfg.weight === "muted"
    ? "px-2 py-0.5 text-[10px] font-medium rounded-full opacity-70"
    : "px-2 py-0.5 text-[10px] font-semibold rounded-full";
  return (
    <span className={`inline-block uppercase ${sizeCls} ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type }: { type: "exam" | "direct" }) {
  return type === "exam" ? (
    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200">
      Govt Exam
    </span>
  ) : (
    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium bg-green-50 text-green-600 border border-green-200">
      Vacancy
    </span>
  );
}

/**
 * Returns a human deadline string + urgency flag when applicationEndDate is
 * upcoming. Past/future is decided against the single IST anchor `todayISO`
 * (from getTodayIST) via daysUntil — never Date.now()/the server UTC clock —
 * so this chip agrees with every other past/future decision in the app. */
function deadlineInfo(item: SarkariNaukriItem, todayISO: string): { text: string; urgent: boolean } | null {
  if (!item.applicationEndDate) return null;
  const days = daysUntil(item.applicationEndDate, todayISO);
  if (isNaN(days) || days < 0) return null; // unparseable or past — don't show
  if (days === 0) return { text: "Closes today", urgent: true };
  if (days === 1) return { text: "Closes tomorrow", urgent: true };
  if (days <= 7) return { text: `${days} days left`, urgent: true };
  if (days <= 15) return { text: `${days} days left`, urgent: false };
  return null; // no urgency strip needed beyond 15 days
}

export function SarkariNaukriList({ items, todayISO }: { items: SarkariNaukriItem[]; todayISO: string }) {
  const [shown, setShown] = useState(PAGE_SIZE);

  if (items.length === 0) {
    return <p className="text-center text-gray-400 py-12">No entries found.</p>;
  }

  const visible = items.slice(0, shown);
  const remaining = items.length - shown;

  return (
    <div>
      <div className="space-y-2">
        {visible.map((item) => {
          const accent = CARD_ACCENT[item.status] ?? "";
          const dl = deadlineInfo(item, todayISO);
          const muted = item.status === "completed" || item.status === "cancelled" || item.status === "application-closed";

          return (
            <Link
              key={item.id}
              href={`/sarkari-naukri/${item.slug}`}
              className={`block bg-white border border-border rounded ${accent} p-4 hover:border-primary/50 hover:shadow-sm transition-all group ${muted ? "opacity-70" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Badge row */}
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <TypeBadge type={item.recruitmentType} />
                    <StatusBadge status={item.status} />
                    {item.isNew && (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">New</span>
                    )}
                    {item.isFeatured && (
                      <span className="text-amber-500 text-xs" aria-label="Featured">★</span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 text-sm leading-snug">
                    {item.title}
                  </h3>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
                    <span>{item.organization}</span>
                    {item.state && item.state !== "all-india" && (
                      <span className="capitalize">{item.state.replace(/-/g, " ")}</span>
                    )}
                    {item.state === "all-india" && <span>All India</span>}
                    {item.vacancyCount != null && item.vacancyCount > 0 && (
                      <span className="font-medium text-primary">{item.vacancyCount.toLocaleString("en-IN")} posts</span>
                    )}
                  </div>
                </div>

                {/* Deadline urgency chip — right side, visually distinct */}
                {dl && (
                  <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded whitespace-nowrap ${dl.urgent ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                    {dl.text}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Load more — reuses already-fetched data, no new request */}
      {remaining > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShown((s) => s + PAGE_SIZE)}
            className="flex-1 sm:flex-none rounded border border-border bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Load more ({remaining} remaining)
          </button>
          {shown > PAGE_SIZE && (
            <button
              type="button"
              onClick={() => setShown(PAGE_SIZE)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
}
