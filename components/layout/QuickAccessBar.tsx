"use client";

import Link from "next/link";
import type { Menu } from "@/services/menuService";

type QuickAccessBarProps = {
  menu: Menu | null;
};

/**
 * Sticky quick access bar below the main navigation.
 * CMS-driven — items come from the `quick-access-bar` menu.
 * Shows lifecycle shortcuts: Latest Jobs, Admit Card, Result, etc.
 */
export function QuickAccessBar({ menu }: QuickAccessBarProps) {
  if (!menu || menu.items.length === 0) return null;

  return (
    <div className="sticky top-14 z-40 bg-gray-50 border-b border-border shadow-sm h-10">
      <div className="container mx-auto px-4 h-full">
        <nav
          className="flex items-center gap-0 overflow-x-auto scrollbar-hide h-full -mx-1"
          aria-label="Quick access shortcuts"
        >
          {menu.items.map((item) => (
            <Link
              key={item.id}
              href={item.url ?? "#"}
              className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-primary hover:bg-white rounded transition-colors whitespace-nowrap"
            >
              {item.icon && <span className="text-sm">{item.icon}</span>}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
