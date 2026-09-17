import Link from "next/link";
import { Briefcase, ClipboardList, GraduationCap, BookOpen, School } from "lucide-react";

/**
 * Five primary category cards. Counts are fetched ONCE in app/page.tsx and
 * passed in as props — this component performs NO data fetching of its own.
 *
 * The former single "Sarkari Naukri" card is split into two first-class
 * destinations that keep the existing route semantics:
 *   Government Exams     → /sarkari-naukri/exam    (competitive/recruitment exams)
 *   Government Vacancies → /sarkari-naukri/bharti  (direct recruitment / vacancies)
 *
 * Zero is rendered as "Coming soon" rather than a fabricated number.
 */
type AudienceGatewayProps = {
  /** government-exam side of sarkari_naukri (recruitment_type = 'exam'). */
  governmentExamCount: number;
  /** govt-vacancy side of sarkari_naukri (recruitment_type = 'direct'). */
  governmentVacancyCount: number;
  /** Entrance-exam pillar count — public label is "Admissions". */
  admissionsCount: number;
  /** Board-exam pillar count. */
  boardCount: number;
  /** University-exam pillar count. */
  universityCount: number;
};

type Card = {
  href: string;
  title: string;
  subtitle: string;
  Icon: typeof Briefcase;
  /** icon tile + count-chip accent */
  iconWrap: string;
  iconColor: string;
  chip: string;
  cta: string;
  count: number;
  countUnit: string;
  tags: string[];
};

export function AudienceGateway({
  governmentExamCount,
  governmentVacancyCount,
  admissionsCount,
  boardCount,
  universityCount,
}: AudienceGatewayProps) {
  const cards: Card[] = [
    {
      href: "/sarkari-naukri/exam",
      title: "Government Exams",
      subtitle: "Recruitment exams",
      Icon: Briefcase,
      iconWrap: "bg-primary/10",
      iconColor: "text-primary",
      chip: "bg-blue-50 text-blue-700",
      cta: "text-primary",
      count: governmentExamCount,
      countUnit: "exams",
      tags: ["SSC", "Banking", "Railway", "UPSC"],
    },
    {
      href: "/sarkari-naukri/bharti",
      title: "Government Vacancies",
      subtitle: "Direct recruitment",
      Icon: ClipboardList,
      iconWrap: "bg-green-50",
      iconColor: "text-green-700",
      chip: "bg-green-50 text-green-700",
      cta: "text-green-700",
      count: governmentVacancyCount,
      countUnit: "vacancies",
      tags: ["Anganwadi", "Police", "Panchayat", "Health"],
    },
    {
      href: "/entrance-exam",
      title: "Admissions",
      subtitle: "Entrance exams",
      Icon: GraduationCap,
      iconWrap: "bg-amber-50",
      iconColor: "text-amber-700",
      chip: "bg-amber-50 text-amber-700",
      cta: "text-amber-700",
      count: admissionsCount,
      countUnit: "exams",
      tags: ["NEET", "JEE", "CAT", "CLAT"],
    },
    {
      href: "/board-exam",
      title: "Board Exams",
      subtitle: "School boards",
      Icon: BookOpen,
      iconWrap: "bg-success/10",
      iconColor: "text-success",
      chip: "bg-green-50 text-green-700",
      cta: "text-success",
      count: boardCount,
      countUnit: "boards",
      tags: ["CBSE", "UP Board", "ICSE"],
    },
    {
      href: "/university-exam",
      title: "University Exams",
      subtitle: "Universities",
      Icon: School,
      iconWrap: "bg-editorial/10",
      iconColor: "text-editorial",
      chip: "bg-purple-50 text-purple-700",
      cta: "text-editorial",
      count: universityCount,
      countUnit: "exams",
      tags: ["IGNOU", "BHU", "DU"],
    },
  ];

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3"
      role="navigation"
      aria-label="Choose your exam category"
    >
      {cards.map((card) => {
        const Icon = card.Icon;
        return (
          <Link
            key={card.href}
            href={card.href}
            className="group flex flex-col bg-white border border-border rounded-md p-4 hover:border-gray-300 hover:shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label={`${card.title} — ${card.subtitle}`}
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${card.iconWrap}`}>
                <Icon className={`w-[18px] h-[18px] ${card.iconColor}`} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-gray-900 text-sm leading-tight truncate">{card.title}</h3>
                <p className="text-[11px] text-gray-400 leading-tight">{card.subtitle}</p>
              </div>
            </div>

            <div className="mb-3">
              <span className={`inline-block text-[11px] px-2 py-0.5 rounded font-semibold ${card.chip}`}>
                {card.count > 0 ? `${card.count} ${card.countUnit}` : "Coming soon"}
              </span>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {card.tags.map((tag) => (
                <span key={tag} className="text-[11px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>

            <span className={`mt-auto text-xs font-semibold ${card.cta} group-hover:underline`}>
              Explore →
            </span>
          </Link>
        );
      })}
    </div>
  );
}
