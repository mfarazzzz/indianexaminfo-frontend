/**
 * SyllabusSection — renders the exam's structured syllabus (subjects + typed weightage).
 *
 * Identity-level: one current syllabus, shared across editions. On an ARCHIVED edition page,
 * this MUST be labelled "current syllabus" (never presented as that year's) — the historical
 * syllabus for a past cycle is the year-attributed PDF in the Resources library, shown
 * separately. Renders nothing when there are no subjects.
 */
import type { StructuredSyllabus } from "@/services/examService";

const UNIT_LABEL: Record<string, string> = { marks: "Marks", questions: "Questions", percent: "%" };

export function SyllabusSection({
  syllabus,
  archived = false,
}: {
  syllabus: StructuredSyllabus;
  /** True on an archived edition page — forces the "current syllabus" label. */
  archived?: boolean;
}) {
  if (!syllabus || syllabus.subjects.length === 0) return null;

  const showWeightage = syllabus.weightageType != null && syllabus.subjects.some((s) => s.weightageValue != null);
  const unit = syllabus.weightageType ? UNIT_LABEL[syllabus.weightageType] : "";

  return (
    <section aria-label="Syllabus" className="mb-5">
      <h2 className="font-heading font-semibold text-base text-gray-800 mb-1">
        Syllabus{showWeightage ? " & Weightage" : ""}
      </h2>
      {archived && (
        // Never let the current structured syllabus read as "this was the archived year's".
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-2">
          Showing the <strong>current</strong> syllabus. For this cycle&apos;s exact syllabus, see the
          year&apos;s Syllabus PDF in Resources below.
        </p>
      )}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="min-w-[320px] w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th scope="col" className="py-1 pr-4">Subject</th>
              <th scope="col" className="py-1 pr-4">Key Topics</th>
              {showWeightage && <th scope="col" className="py-1 text-right">Weightage{unit ? ` (${unit})` : ""}</th>}
            </tr>
          </thead>
          <tbody>
            {syllabus.subjects.map((s, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="py-1.5 pr-4 font-medium text-gray-800">{s.subject}</td>
                <td className="py-1.5 pr-4 text-gray-600">{s.topics || "—"}</td>
                {showWeightage && (
                  <td className="py-1.5 text-right text-gray-700">
                    {s.weightageValue != null ? `${s.weightageValue}${syllabus.weightageType === "percent" ? "%" : ""}` : "—"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
