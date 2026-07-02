import Link from "next/link";
import { Briefcase, GraduationCap, BookOpen } from "lucide-react";

const portals = [
  {
    icon: Briefcase,
    title: "Government Jobs",
    subtitle: "Sarkari Naukri",
    description: "UPSC, SSC, Banking, Railway, Defence, Police, State PSC",
    stats: "200+ active recruitments",
    categories: ["Banking", "Railways", "SSC", "Police", "UPSC"],
    href: "/sarkari-naukri",
    cta: "Explore Govt Jobs →",
    activeCount: 24,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    borderTop: "border-t-4 border-primary",
    badgeColor: "bg-blue-100 text-blue-700",
    ctaColor: "text-primary hover:text-primary-700",
  },
  {
    icon: GraduationCap,
    title: "Entrance Exams",
    subtitle: "College Admissions",
    description: "Engineering, Medical, MBA, Law, Agriculture, Design",
    stats: "150+ entrance exams",
    categories: ["NEET", "JEE", "CAT", "CLAT", "GATE"],
    href: "/entrance-exam",
    cta: "Explore Entrance Exams →",
    activeCount: 18,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
    borderTop: "border-t-4 border-amber-500",
    badgeColor: "bg-amber-100 text-amber-700",
    ctaColor: "text-amber-700 hover:text-amber-800",
  },
  {
    icon: BookOpen,
    title: "Board & University",
    subtitle: "Academic Exams",
    description: "Boards, Universities, Semester Exams, Results",
    stats: "All state boards + 40+ universities",
    categories: ["CBSE", "UP Board", "IGNOU", "BHU", "MJPRU"],
    href: "/board-exam",
    cta: "Explore Board Exams →",
    activeCount: 31,
    iconBg: "bg-success/10",
    iconColor: "text-success",
    borderTop: "border-t-4 border-success",
    badgeColor: "bg-green-100 text-green-700",
    ctaColor: "text-success hover:text-green-800",
  },
] as const;

export function AudienceGateway() {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      role="navigation"
      aria-label="Choose your exam category"
    >
      {portals.map((p) => {
        const Icon = p.icon;
        return (
          <Link
            key={p.href}
            href={p.href}
            className={`block bg-white border border-border shadow-sm p-5 ${p.borderTop} hover:shadow-md transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
            aria-label={`${p.title} — ${p.description}`}
          >
            {/* Header: icon + title + active badge */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded flex items-center justify-center ${p.iconBg}`}>
                  <Icon className={`w-5 h-5 ${p.iconColor}`} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-gray-900 text-sm leading-tight">{p.title}</h2>
                  <p className="text-xs text-gray-400">{p.subtitle}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-semibold shrink-0 ${p.badgeColor}`}>
                {p.activeCount} active
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-500 leading-relaxed mb-3">{p.description}</p>

            {/* Category pills */}
            <div className="flex flex-wrap gap-1 mb-4">
              {p.categories.map((cat) => (
                <span key={cat} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {cat}
                </span>
              ))}
              <span className="text-xs text-gray-400 px-1 py-0.5">+more</span>
            </div>

            {/* Stats + CTA */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">{p.stats}</span>
              <span className={`text-xs font-semibold ${p.ctaColor} transition-colors`}>{p.cta}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
