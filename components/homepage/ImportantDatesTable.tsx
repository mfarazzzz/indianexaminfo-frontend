import Link from "next/link";
import { formatDate, isUrgent, isClosingSoon, isFutureOrToday } from "@/lib/utils";
import { getAllExams, getTodayIST } from "@/services/examService";
import { cn } from "@/lib/utils";

export async function ImportantDatesTable() {
  const [exams, todayISO] = await Promise.all([getAllExams(), getTodayIST()]);

  // Flatten all upcoming dates from all exams. Past/future uses the single IST
  // anchor (todayISO), never the server clock.
  const rows = exams
    .flatMap((exam) =>
      exam.dates
        .filter((d) => isFutureOrToday(d.date, todayISO))
        .map((d) => ({
          examName: exam.shortName,
          examHref: `/${exam.pillar}/${exam.category}/${exam.slug}`,
          event: d.label,
          date: d.date,
          isUrgent: isUrgent(d.date, todayISO, 7),
          isClosingSoon: isClosingSoon(d.date, todayISO, 30),
        }))
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 15);

  return (
    <section aria-label="Important exam dates">
      <div className="mb-3">
        <h2 className="font-heading font-bold text-gray-900 text-base">Important dates</h2>
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
                  <Link href={row.examHref} prefetch={false} className="text-primary hover:underline font-medium text-xs">
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
