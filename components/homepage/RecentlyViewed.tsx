"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";

type RecentItem = {
  name: string;
  href: string;
  pillar: string;
  viewedAt: number;
};

const STORAGE_KEY = "iei_recently_viewed";

export function RecentlyViewed() {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: RecentItem[] = JSON.parse(raw);
        setItems(parsed.slice(0, 5));
      }
    } catch {}
  }, []);

  if (items.length === 0) return null;

  return (
    <section aria-label="Recently viewed exams" className="bg-card border border-border rounded p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-gray-400" aria-hidden="true" />
        <h2 className="font-heading font-semibold text-sm text-gray-800">You recently viewed:</h2>
      </div>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="text-sm text-gray-700 hover:text-primary hover:underline transition-colors flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" aria-hidden="true" />
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Call this from any exam entity page to record the visit.
 * Usage: trackRecentlyViewed({ name, href, pillar })
 */
export function trackRecentlyViewed(item: Omit<RecentItem, "viewedAt">) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: RecentItem[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((e) => e.href !== item.href);
    const updated  = [{ ...item, viewedAt: Date.now() }, ...filtered].slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}
