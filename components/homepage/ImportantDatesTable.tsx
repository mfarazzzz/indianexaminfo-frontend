import Link from "next/link";
import { formatDate, isUrgent, isClosingSoon } from "@/lib/utils";
import { getAllExams } from "@/services/examService";
import { cn } from "@/lib/utils";
import { AlarmClock } from "lucide-react";

export async function ImportantDatesTable() {
  const exams = await getAllExams();

  // Flatten all upcoming dates from all exams
  const rows = exams
    .flatMap((exam) =>
      exam.dates
        .filter((d) => new Date(d.date) >= new Date())
        .map((d) => ({
          examName: exam.shortName,
          examHref: `/${exam.pillar}/${exam.category}/${exam.slug}`,
          event: d.label,
          date: d.date,
          isUrgent: isUrgent(d.date, 7),
          isClosingSoon: isClosingSoon(d.date, 30),
        }))
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 15);

  return (
    <section aria-label="Important exam dates">
      <div className="flex items-center gap-2 mb-3">
        <AlarmClock className="w-5 h-5 text-accent" aria-hidden="true" />
        <h2 className="font-heading font-bold text-gray-900 text-base">Important Dates</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">Upcoming important exam dates</caption>
          <thead>
            <tr className="bg-primary text-white text-xs">
              <th scope="col" className="text-left px-3 py-2 font-semibold border-0">Exam</th>
              <th scope="col" className="text-left px-3 py-2 font-semibold border-0">Event</th>
              <th scope="col" className="text-left px-3 py-2 font-semibold border-0">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={`${row.examHref}-${row.event}`}
                className={cn(
                  "border-b border-border hover:bg-gray-50 transition-colors",
                  i % 2 === 1 && "bg-gray-50/50"
                )}
              >
                <td className="px-3 py-2 border-0">
                  <Link href={row.examHref} className="text-primary hover:underline font-medium text-xs">
                    {row.examName}
                  </Link>
                </td>
                <td className="px-3 py-2 border-0 text-gray-600 text-xs">{row.event}</td>
                <td className="px-3 py-2 border-0">
                  <span
                    className={cn(
                      "text-xs font-semibold font-mono",
                      row.isUrgent
                        ? "text-accent"
                        : row.isClosingSoon
                        ? "text-warning"
                        : "text-gray-700"
                    )}
                  >
                    {formatDate(row.date)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <p className="text-sm text-gray-500 py-4 text-center">No upcoming dates available.</p>
      )}
    </section>
  );
}
