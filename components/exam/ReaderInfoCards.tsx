/**
 * ReaderInfoCards.tsx — the two mock blocks that had NO code on our exam page
 * (mock gap audit, 22 Oct): the Quick information facts card and the Important
 * links table. Markup follows docs/design/exam-page-mock.html exactly:
 *
 *  • Quick information — a facts grid built ONLY from stored fields
 *    (conducting body, cycle frequency, official website). A fact with no
 *    stored value is omitted; if NO fact exists the card renders NOTHING
 *    (no empty shell, no invented text).
 *  • Important links — rows whose URL is ATTESTED: the stored official website
 *    plus the quick-links/attachments carried by the exam's PUBLISHED,
 *    NON-EXPIRED, non-withdrawn updates (the same live filter the reader
 *    timeline uses). A label with no attested URL never becomes a row — the
 *    mock's rule, kept literally. Empty pool → the card renders NOTHING.
 *
 * Both are plain server components; they fetch nothing and take the already
 * loaded record + updates, so they can never disagree with the page body.
 */
import type { ExamEntity, ContentPost } from "@/types/exam";
import { isExpired } from "@/lib/exam/updateFeed";
import { sectionHeading } from "@/lib/exam/sectionHeadings";

/** exams.cycle_frequency, stored value → the mock's plain words. Anything
 *  unrecognised renders the stored text itself — never a guess. */
export function cycleFrequencyText(v: string | null | undefined): string | null {
  const s = (v ?? "").trim();
  if (!s) return null;
  if (s === "annual") return "Once a year";
  if (s === "biannual") return "Multiple cycles per year";
  if (s === "irregular") return "Irregular / on demand";
  return s;
}

/** Hostname of a stored URL, for the mock's "upsssc.gov.in" style label.
 *  Only rewrites the display text; the href stays the stored URL. */
function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

interface QuickInfoProps {
  exam: Pick<ExamEntity, "conductingBody" | "officialWebsite" | "cycleFrequency" | "name">;
}

/** Mock section: "Quick information". Facts come from stored fields only. */
export function QuickInfoCard({ exam }: QuickInfoProps) {
  const facts: { label: string; value: string; href?: string }[] = [];
  const cb = (exam.conductingBody ?? "").trim();
  if (cb) facts.push({ label: "Conducting body", value: cb });
  const freq = cycleFrequencyText(exam.cycleFrequency);
  if (freq) facts.push({ label: "Frequency", value: freq });
  const site = (exam.officialWebsite ?? "").trim();
  if (site) facts.push({ label: "Official website", value: hostLabel(site), href: site });
  if (facts.length === 0) return null; // nothing trustworthy to say → no card

  return (
    <section aria-label="Quick information" className="mb-5" data-testid="quick-info-card">
      <h2 className="font-heading font-semibold text-[1.05rem] text-gray-900 mb-2">{sectionHeading("quick-info")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
        {facts.map((f) => (
          <div key={f.label}>
            <div className="text-[11px] uppercase tracking-wide text-gray-500">{f.label}</div>
            {f.href ? (
              <a
                href={f.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-primary hover:underline break-words"
              >
                {f.value}
              </a>
            ) : (
              <div className="text-sm font-semibold text-gray-800">{f.value}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

interface ImportantLinksProps {
  exam: Pick<ExamEntity, "officialWebsite">;
  /** The exam's own updates, as loaded for the page. Filters applied HERE
   *  (published / not withdrawn / not expired) — the same live rule. */
  contentPosts: ContentPost[];
  /** ISO now, passed down so the render is deterministic (testable). */
  todayISO: string;
}

/** Mock section: "Important links" — attested URLs only, de-duped by url. */
export function ImportantLinksCard({ exam, contentPosts, todayISO }: ImportantLinksProps) {
  const rows: { label: string; url: string }[] = [];
  const seen = new Set<string>();
  const push = (label: string, url: string | null | undefined) => {
    const u = (url ?? "").trim();
    if (!u || seen.has(u)) return;
    seen.add(u);
    rows.push({ label: label.trim() || hostLabel(u), url: u });
  };

  const site = (exam.officialWebsite ?? "").trim();
  if (site) push("Official website", site);

  for (const p of contentPosts) {
    if (p.status !== "published" || p.kind === "withdrawn" || isExpired(p, todayISO)) continue;
    for (const l of [...(p.quickLinks ?? []), ...(p.attachmentUrls ?? [])]) {
      if (l?.url) push(l.label ?? hostLabel(l.url), l.url);
    }
  }

  if (rows.length === 0) return null; // nothing attested → no card

  return (
    <section aria-label="Important links" className="mb-5" data-testid="important-links-card">
      <h2 className="font-heading font-semibold text-[1.05rem] text-gray-900 mb-2">{sectionHeading("important-links")}</h2>
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="min-w-[280px] exam-dates-table">
          <caption className="sr-only">Attested links for this exam</caption>
          <thead>
            <tr><th scope="col">Link</th><th scope="col">Status</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.url}>
                <td data-label="Link">{r.label}</td>
                <td data-label="Status">
                  <a href={r.url} target="_blank" rel="noopener noreferrer nofollow" className="text-primary hover:underline break-words">
                    {hostLabel(r.url)}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* P1 item 10: the old explainer ("A link appears here only when its URL was
          published with the update it belongs to…") described OUR pipeline, not the
          reader's task, so it is gone. The attestation rule still holds — it is simply
          no longer narrated on the page. */}
    </section>
  );
}
