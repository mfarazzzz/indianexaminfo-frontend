"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CalendarEvent = {
  date: string;       // YYYY-MM-DD
  label: string;
  href: string;
  pillar: "sarkari-naukri" | "entrance-exam" | "board-university";
};

type ExamCalendarProps = {
  events: CalendarEvent[];
};

const PILLAR_COLORS = {
  "sarkari-naukri":  "bg-primary",
  "entrance-exam":   "bg-editorial",
  "board-university": "bg-success",
} as const;

const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export function ExamCalendar({ events }: ExamCalendarProps) {
  const today   = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [popup, setPopup] = useState<{ day: number; events: CalendarEvent[] } | null>(null);

  // Build event map keyed by YYYY-MM-DD
  const eventMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [events]);

  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  );

  return (
    <section aria-label="Exam calendar" className="bg-card border border-border rounded p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading font-bold text-sm text-gray-900">
          Exam Calendar — {MONTHS[month]} {year}
        </h2>
        <div className="flex gap-1">
          <button onClick={prevMonth} aria-label="Previous month"
            className="p-1 text-gray-500 hover:text-primary hover:bg-gray-100 rounded transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextMonth} aria-label="Next month"
            className="p-1 text-gray-500 hover:text-primary hover:bg-gray-100 rounded transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />Sarkari</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-editorial inline-block" />Entrance</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block" />Board</span>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} className="bg-white min-h-[36px]" />;
          const dateStr  = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = eventMap[dateStr] ?? [];
          const isToday  = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

          return (
            <button
              key={idx}
              onClick={() => dayEvents.length && setPopup({ day, events: dayEvents })}
              className={cn(
                "bg-white min-h-[36px] p-1 text-left relative hover:bg-gray-50 transition-colors",
                isToday && "ring-1 ring-inset ring-primary"
              )}
              aria-label={`${day} ${MONTHS[month]}${dayEvents.length ? `, ${dayEvents.length} event(s)` : ""}`}
            >
              <span className={cn(
                "text-xs font-medium",
                isToday ? "text-primary font-bold" : "text-gray-700"
              )}>
                {day}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-0.5 flex-wrap">
                  {dayEvents.slice(0, 3).map((ev, i) => (
                    <span key={i} className={cn("w-1.5 h-1.5 rounded-full", PILLAR_COLORS[ev.pillar])} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Popup */}
      {popup && (
        <div className="mt-3 bg-surface border border-border rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-800">
              {popup.day} {MONTHS[month]} {year}
            </p>
            <button onClick={() => setPopup(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
          </div>
          <ul className="space-y-1.5">
            {popup.events.map((ev, i) => (
              <li key={i}>
                <Link href={ev.href} className="text-xs text-primary hover:underline flex items-center gap-1.5">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", PILLAR_COLORS[ev.pillar])} />
                  {ev.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
