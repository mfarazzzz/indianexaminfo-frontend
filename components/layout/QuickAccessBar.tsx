"use client";

/**
 * QuickAccessBar — Sticky horizontal bar below header.
 * Shows quick access links with icons, horizontally scrollable.
 */
import Link from "next/link";
import type { QuickAccessItem } from "@/types/navigation";

interface Props {
  items: QuickAccessItem[];
}

export function QuickAccessBar({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="sticky top-14 z-40 bg-gray-50/95 backdrop-blur-sm border-b border-gray-200/60 h-9">
      <div className="max-w-7xl mx-auto px-4 h-full">
        <nav
          className="flex items-center gap-0 overflow-x-auto scrollbar-hide h-full"
          aria-label="Quick access shortcuts"
        >
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-gray-600 hover:text-primary hover:bg-white/80 rounded transition-colors whitespace-nowrap"
            >
              <span className="text-xs">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
