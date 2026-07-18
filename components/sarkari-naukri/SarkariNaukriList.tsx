import Link from "next/link";
import type { SarkariNaukriItem } from "@/services/sarkariNaukriService";

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    "upcoming": "bg-blue-100 text-blue-700",
    "application-open": "bg-green-100 text-green-700",
    "application-closed": "bg-gray-100 text-gray-600",
    "admit-card-released": "bg-purple-100 text-purple-700",
    "exam-scheduled": "bg-indigo-100 text-indigo-700",
    "answer-key-released": "bg-yellow-100 text-yellow-700",
    "result-declared": "bg-emerald-100 text-emerald-700",
    "interview-scheduled": "bg-orange-100 text-orange-700",
    "merit-list-released": "bg-teal-100 text-teal-700",
    "completed": "bg-gray-100 text-gray-600",
    "cancelled": "bg-red-100 text-red-700",
  };
  const label = status.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${colors[status] ?? "bg-gray-100 text-gray-600"}`}>
      {label}
    </span>
  );
}

function TypeBadge({ type }: { type: "exam" | "direct" }) {
  return type === "exam" ? (
    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-200">
      Exam
    </span>
  ) : (
    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium bg-green-50 text-green-600 border border-green-200">
      Bharti
    </span>
  );
}

export function SarkariNaukriList({ items }: { items: SarkariNaukriItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-center text-gray-400 py-12">No entries found.</p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/sarkari-naukri/${item.slug}`}
          className="block bg-card border border-border rounded p-4 hover:border-primary/50 hover:shadow-sm transition-all group"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <TypeBadge type={item.recruitmentType} />
                <StatusBadge status={item.status} />
                {item.isNew && (
                  <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">New</span>
                )}
                {item.isFeatured && (
                  <span className="text-amber-500 text-xs">★</span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 text-sm">
                {item.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
                <span>{item.organization}</span>
                {item.state && item.state !== "all-india" && (
                  <span className="capitalize">📍 {item.state.replace(/-/g, " ")}</span>
                )}
                {item.state === "all-india" && <span>🇮🇳 All India</span>}
                {item.vacancyCount && <span>👥 {item.vacancyCount.toLocaleString("en-IN")} posts</span>}
                {item.resultDate && <span>📅 {new Date(item.resultDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
