import Link from "next/link";
import {
  FileText,
  Download,
  Key,
  BookOpen,
  Calendar,
  ClipboardList,
  ScrollText,
  BookMarked,
} from "lucide-react";

const quickLinks = [
  { label: "Admit Card", href: "/admit-card", icon: Download, color: "text-accent bg-accent/10 hover:bg-accent hover:text-white" },
  { label: "Results", href: "/results", icon: ClipboardList, color: "text-success bg-success/10 hover:bg-success hover:text-white" },
  { label: "Answer Key", href: "/answer-key", icon: Key, color: "text-warning bg-warning/10 hover:bg-warning hover:text-white" },
  { label: "Syllabus", href: "/syllabus", icon: BookOpen, color: "text-primary bg-primary/10 hover:bg-primary hover:text-white" },
  { label: "Date Sheet", href: "/date-sheet", icon: Calendar, color: "text-editorial bg-editorial/10 hover:bg-editorial hover:text-white" },
  { label: "Mock Test", href: "/mock-test", icon: FileText, color: "text-purple-600 bg-purple-50 hover:bg-purple-600 hover:text-white" },
  { label: "Previous Papers", href: "/previous-papers", icon: ScrollText, color: "text-cyan-600 bg-cyan-50 hover:bg-cyan-600 hover:text-white" },
  { label: "Study Material", href: "/study-material", icon: BookMarked, color: "text-teal-600 bg-teal-50 hover:bg-teal-600 hover:text-white" },
];

export function ContentTypeQuickLinks() {
  return (
    <section aria-label="Quick links to content types">
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-2 p-3 rounded border border-border transition-all duration-150 group ${link.color}`}
              prefetch
            >
              <Icon className="w-6 h-6 shrink-0" aria-hidden="true" />
              <span className="text-xs font-semibold text-center leading-tight">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
