import Link from "next/link";
import {
  Download,
  ClipboardList,
  Key,
  BookOpen,
  Calendar,
  FileText,
  ScrollText,
  BookMarked,
  TrendingDown,
} from "lucide-react";

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
    label: "Results",
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
  {
    label: "Mock Test",
    href: "/mock-test",
    icon: FileText,
    bg: "bg-purple-50",
    iconColor: "text-purple-700",
    hoverBorder: "hover:border-purple-400",
  },
  {
    label: "Prev. Papers",
    href: "/previous-papers",
    icon: ScrollText,
    bg: "bg-cyan-50",
    iconColor: "text-cyan-700",
    hoverBorder: "hover:border-cyan-400",
  },
  {
    label: "Study Material",
    href: "/study-material",
    icon: BookMarked,
    bg: "bg-emerald-50",
    iconColor: "text-emerald-700",
    hoverBorder: "hover:border-emerald-400",
  },
  {
    label: "Cutoff",
    href: "/results",
    icon: TrendingDown,
    bg: "bg-rose-50",
    iconColor: "text-rose-700",
    hoverBorder: "hover:border-rose-400",
  },
] as const;

export function QuickActions() {
  return (
    <section aria-label="Quick content actions">
      <h2 className="sr-only">Quick Access</h2>
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
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
              prefetch
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
