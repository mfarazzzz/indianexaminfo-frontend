import Link from "next/link";
import { Download, ClipboardList, Key, BookOpen, Calendar } from "lucide-react";

// Exactly five above-the-fold quick actions, styled as a compact utility bar
// (not large cards). Mock Test / Previous Papers / Study Material / Cutoff were
// removed earlier (retired module types). Each href points at an existing route.
const actions = [
  { label: "Admit Card", href: "/admit-card", icon: Download, iconColor: "text-accent" },
  { label: "Result", href: "/results", icon: ClipboardList, iconColor: "text-success" },
  { label: "Answer Key", href: "/answer-key", icon: Key, iconColor: "text-warning" },
  { label: "Syllabus", href: "/syllabus", icon: BookOpen, iconColor: "text-primary" },
  { label: "Date Sheet", href: "/date-sheet", icon: Calendar, iconColor: "text-teal-700" },
] as const;

export function QuickActions() {
  return (
    <section aria-label="Quick content actions">
      <h2 className="sr-only">Quick Access</h2>
      <div className="flex flex-wrap items-stretch gap-2 rounded-md border border-border bg-white p-1.5">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href + action.label}
              href={action.href}
              prefetch={false}
              className="group flex flex-1 min-w-[88px] items-center justify-center gap-2 rounded px-3 py-2 text-sm hover:bg-gray-50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Icon className={`w-4 h-4 shrink-0 ${action.iconColor}`} aria-hidden="true" />
              <span className="font-semibold text-gray-700 group-hover:text-primary transition-colors whitespace-nowrap">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
