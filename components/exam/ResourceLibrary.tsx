/**
 * ResourceLibrary — renders the exam's accumulated library (exam_resources).
 *
 * Shows on the main exam page AND every archived edition page. The library is the SAME
 * for all editions (it's exam-level), so an archived 2024 page shows 2024's dates/result
 * but the COMPLETE library. Grouped by kind; within each kind, undated ("All years")
 * evergreen items first, then newest year descending. Renders nothing when empty — the
 * rows passed in are already RLS-filtered to published, non-deleted (see getExamResources),
 * so an all-unpublished library arrives here as an empty array and this returns null.
 */
import { ExternalLink, FileText, BookOpen, ClipboardList, ScrollText, FileCheck } from "lucide-react";
import type { ExamResourceRow, ResourceKind } from "@/services/examService";

// Stable display order + label + icon per kind.
const KIND_ORDER: { kind: ResourceKind; label: string; Icon: typeof FileText }[] = [
  { kind: "previous-paper", label: "Previous Year Papers", Icon: ScrollText },
  { kind: "sample-paper",   label: "Sample Papers",        Icon: FileCheck },
  { kind: "mock-test",      label: "Mock Tests",           Icon: ClipboardList },
  { kind: "study-material", label: "Study Material",       Icon: BookOpen },
  { kind: "syllabus-pdf",   label: "Syllabus PDFs",        Icon: FileText },
];

/** Sort within a kind: undated first (evergreen), then newest year descending. */
function sortForKind(rows: ExamResourceRow[]): ExamResourceRow[] {
  return [...rows].sort((a, b) => {
    const au = a.year == null, bu = b.year == null;
    if (au !== bu) return au ? -1 : 1;          // undated first
    if (au && bu) return a.displayOrder - b.displayOrder;
    return (b.year as number) - (a.year as number); // newest year first
  });
}

function ResourceItem({ r }: { r: ExamResourceRow }) {
  const meta = [r.stageLabel, r.language, r.paperType].filter(Boolean).join(" · ");
  return (
    <li>
      <a
        href={r.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <ExternalLink size={13} className="shrink-0 text-gray-400" />
        <span>{r.title}{meta && <span className="text-gray-400"> · {meta}</span>}</span>
      </a>
    </li>
  );
}

export function ResourceLibrary({ resources }: { resources: ExamResourceRow[] }) {
  if (!resources || resources.length === 0) return null;

  const groups = KIND_ORDER
    .map((k) => ({ ...k, items: sortForKind(resources.filter((r) => r.kind === k.kind)) }))
    .filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <section aria-label="Resource library" className="mb-5">
      <h2 className="font-heading font-semibold text-base text-gray-800 mb-3">Resources &amp; Downloads</h2>
      <div className="space-y-4">
        {groups.map(({ kind, label, Icon, items }) => {
          // Split into the "All years" (undated) block and the year-grouped rest.
          const undated = items.filter((r) => r.year == null);
          const dated = items.filter((r) => r.year != null);
          const years = [...new Set(dated.map((r) => r.year as number))].sort((a, b) => b - a);
          return (
            <div key={kind}>
              <div className="flex items-center gap-1.5 font-medium text-sm text-gray-700 mb-1.5">
                <Icon size={14} className="text-gray-400" /> {label}
              </div>
              {undated.length > 0 && (
                // Undated (evergreen) items: NO year label — an empty year or dash reads
                // like missing data. Just the titles, directly under the kind heading.
                <ul className="space-y-1 pl-1 mb-2">
                  {undated.map((r) => <ResourceItem key={r.id} r={r} />)}
                </ul>
              )}
              {years.map((y) => (
                <div key={y} className="mb-2">
                  <div className="text-xs text-gray-400 mb-0.5">{y}</div>
                  <ul className="space-y-1 pl-1">
                    {dated.filter((r) => r.year === y).map((r) => <ResourceItem key={r.id} r={r} />)}
                  </ul>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
