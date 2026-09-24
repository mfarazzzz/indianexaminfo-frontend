"use client";

import { useState } from "react";
import Link from "next/link";
import type { SarkariNaukriItem } from "@/services/sarkariNaukriService";
import { daysUntil, formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

// ── Status badge ────────────────────────────────────────────────────────────
// ONE signal per row — only status. TypeBadge (Govt Exam / Vacancy), the "New"
// pill and the ★ star are removed: they either duplicate information already
// in the context or add noise without meaning on a filtered listing page.
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
  "completed":           { label: "Completed",       cls: "bg-gray-200 text-gray-700 border border-gray-300", weight: "muted" },
  "cancelled":           { label: "Cancelled",       cls: "bg-red-100 text-red-400",            weight: "muted" },
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
    ? "px-2 py-0.5 text-[10px] font-semibold rounded-full"
    : "px-2 py-0.5 text-[10px] font-semibold rounded-full";
  return (
    <span className={`inline-block uppercase ${sizeCls} ${cfg.cls}`}>
      {cfg.label}
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
  if (isNaN(days) || days < 0) return null;
  if (days === 0) return { text: "Closes today", urgent: true };
  if (days === 1) return { text: "Closes tomorrow", urgent: true };
  if (days <= 7) return { text: `${days} days left`, urgent: true };
  if (days <= 15) return { text: `${days} days left`, urgent: false };
  return null;
}

/**
 * The date that matters for this record's current state — shown in the row
 * beside the status badge instead of showing no date at all. Rules match the
 * homepage ExamListRow convention: one date, the most actionable one.
 */
function relevantDate(item: SarkariNaukriItem): { label: string; date: string } | null {
  switch (item.status) {
    case "application-open":
      if (item.applicationEndDate) return { label: "Last date", date: item.applicationEndDate };
      if (item.applicationStartDate) return { label: "Opens", date: item.applicationStartDate };
      break;
    case "admit-card-released":
      if (item.admitCardDate) return { label: "Admit card", date: item.admitCardDate };
      break;
    case "exam-scheduled":
      if (item.examDate) return { label: "Exam", date: item.examDate };
      break;
    case "result-declared":
      if (item.resultDate) return { label: "Result", date: item.resultDate };
      break;
    case "interview-scheduled":
    case "merit-list-released":
    case "answer-key-released":
      if (item.resultDate) return { label: "Date", date: item.resultDate };
      break;
    case "upcoming":
      if (item.applicationStartDate) return { label: "Opens", date: item.applicationStartDate };
      if (item.examDate) return { label: "Exam", date: item.examDate };
      break;
  }
  // Fallback: first non-null date in priority order
  if (item.applicationEndDate) return { label: "Last date", date: item.applicationEndDate };
  if (item.examDate) return { label: "Exam", date: item.examDate };
  if (item.resultDate) return { label: "Result", date: item.resultDate };
  return null;
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
      <div className="divide-y divide-border border-t border-border">
        {visible.map((item) => {
          const dl = deadlineInfo(item, todayISO);
          const rd = relevantDate(item);
          const muted = item.status === "cancelled" || item.status === "application-closed";

          return (
            <Link
              key={item.id}
              href={`/sarkari-naukri/${item.slug}`}
              className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-4 py-3 group hover:bg-gray-50/50 transition-colors ${muted ? "opacity-70" : ""}`}
            >
              <div className="min-w-0 flex-1">
                {/* Status badge + name on same line */}
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={item.status} />
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors text-sm leading-snug">
                    {item.title}
                  </h3>
                </div>
                {/* Meta: org · state · vacancy · relevant date */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
                  <span>{item.organization}</span>
                  {item.state && item.state !== "all-india" && (
                    <span className="capitalize">{item.state.replace(/-/g, " ")}</span>
                  )}
                  {item.state === "all-india" && <span>All India</span>}
                  {item.vacancyCount != null && item.vacancyCount > 0 && (
                    <span className="font-medium text-primary">{item.vacancyCount.toLocaleString("en-IN")} posts</span>
                  )}
                  {rd && (
                    <span>
                      <span className="text-gray-400">{rd.label}: </span>
                      <span className="font-medium text-gray-700">{formatDate(rd.date)}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Deadline urgency chip when application is closing */}
              {dl && (
                <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded whitespace-nowrap self-start sm:self-auto ${dl.urgent ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                  {dl.text}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Load more */}
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
