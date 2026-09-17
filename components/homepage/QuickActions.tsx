import Link from "next/link";
import { Download, ClipboardList, Key, BookOpen, Calendar } from "lucide-react";

// Exactly five above-the-fold quick actions. Mock Test / Previous Papers /
// Study Material / Cutoff were removed (consistent with the retired module
// types). Each href points at an existing route.
const actions = [
  {
    label: "Admit Card",
    href: "/admit-card",
    icon: Download,
    bg: "bg-accent/10",
    iconColor: "text-accent",
    hoverBorder: "hover:border-accent",
  },
  {
    label: "Result",
    href: "/results",
    icon: ClipboardList,
    bg: "bg-success/10",
    iconColor: "text-success",
    hoverBorder: "hover:border-success",
  },
  {
    label: "Answer Key",
    href: "/answer-key",
    icon: Key,
    bg: "bg-warning/10",
    iconColor: "text-warning",
    hoverBorder: "hover:border-warning",
  },
  {
    label: "Syllabus",
    href: "/syllabus",
    icon: BookOpen,
    bg: "bg-primary/10",
    iconColor: "text-primary",
    hoverBorder: "hover:border-primary",
  },
  {
    label: "Date Sheet",
    href: "/date-sheet",
    icon: Calendar,
    bg: "bg-teal-50",
    iconColor: "text-teal-700",
    hoverBorder: "hover:border-teal-500",
  },
] as const;

export function QuickActions() {
  return (
    <section aria-label="Quick content actions">
      <h2 className="sr-only">Quick Access</h2>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href + action.label}
              href={action.href}
              className={`
                flex flex-col items-center gap-2 p-3 bg-white
                border border-border ${action.hoverBorder}
                shadow-sm hover:shadow-md transition-all group
              `}
              prefetch={false}
            >
              <div className={`w-9 h-9 rounded flex items-center justify-center ${action.bg}`}>
                <Icon className={`w-4 h-4 ${action.iconColor}`} aria-hidden="true" />
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center leading-tight group-hover:text-primary transition-colors">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
