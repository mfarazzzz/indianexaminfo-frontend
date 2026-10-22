/**
 * KeyDatesStrip.tsx — 4a (2d): the mobile-first strip shown right under the
 * title / status chip / unverified notice. It surfaces the next 2-3 key dates
 * (date prominent on the left, event on the right — compact, no repeated
 * "Event/Date" labels, no horizontal scroll at 360px) and the primary buttons.
 *
 * A button appears ONLY when there is a real destination: the official website
 * (when stored) and a Download/Apply action ONLY when an attested URL exists
 * (see pickAttestedAction). There is never a greyed-out "URL pending" button.
 */
import { ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { pickKeyDates, relDayLabel, type KeyDate } from "@/lib/exam/keyDates";

export function KeyDatesStrip({
  dates, todayISO, officialWebsite, action,
}: {
  dates: KeyDate[];
  todayISO: string;
  officialWebsite?: string | null;
  action?: { label: string; href: string } | null;
}) {
  const keyDates = pickKeyDates(dates, todayISO, 3);
  if (keyDates.length === 0 && !officialWebsite && !action) return null;

  return (
    <section aria-label="Key dates and actions" className="mb-4 rounded-lg border border-border bg-card p-3" data-testid="key-dates-strip">
      {keyDates.length > 0 && (
        <ul className="divide-y divide-border">
          {keyDates.map((d, i) => {
            // "Today / Tomorrow / in N days" — derived from the stored date and
            // the IST anchor; null (no badge) for far or past dates.
            const badge = i === 0 ? relDayLabel(String(d.date), todayISO) : null;
            return (
              <li key={`${d.label}-${i}`} className="flex items-baseline justify-between gap-3 py-1.5">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-sm font-semibold text-gray-900 shrink-0">{formatDate(String(d.date))}</span>
                  {badge && <span className="exam-date-badge" data-testid="key-date-badge">{badge}</span>}
                </span>
                <span className="text-sm text-gray-600 text-right">{d.label}</span>
              </li>
            );
          })}
        </ul>
      )}
      {(action || officialWebsite) && (
        <div className="mt-3 grid gap-2">
          {action && (
            <a
              href={action.href}
              target="_blank"
              rel="noopener noreferrer"
              className="exam-btn-primary"
              data-testid="primary-action"
            >
              {action.label} <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {officialWebsite && (
            <a
              href={officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="exam-btn-secondary"
              data-testid="official-website-btn"
            >
              Official website <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      )}
    </section>
  );
}
