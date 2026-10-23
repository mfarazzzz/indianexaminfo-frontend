/**
 * LatestUpdates.tsx — P1 item 8: the compact "latest updates" strip shown directly
 * under the key-dates block on the MAIN exam page.
 *
 * Why it exists: the full Updates timeline sat far down the page, below every
 * editorial section, so a reader who arrived for one question ("is the result out?",
 * "has the date changed?") had to scroll past eligibility, fee and vacancy first.
 * This shows the newest three LIVE updates - kind badge + date + title - with one
 * "all updates" link to the full timeline further down.
 *
 * It uses the SAME reader ruleset as the timeline and the home card - the exam's
 * already-live active set from partitionUpdates (published, unexpired, not withdrawn,
 * not superseded), ordered pinned-first by orderUpdatesForReader. It renders NOTHING
 * when there are no live updates: never an empty heading.
 */
import Link from "next/link";
import { contentTypeLabel, formatDate } from "@/lib/utils";
import { sectionHeading } from "@/lib/exam/sectionHeadings";
import type { UpdateViewModel } from "@/lib/exam/updates";

const KIND_LABEL: Record<string, string> = {
  provisional: "Provisional", final: "Final", revised: "Revised", corrigendum: "Corrigendum",
};

export function LatestUpdates({
  active, allHref, limit = 3,
}: {
  active: UpdateViewModel[];
  /** In-page anchor to the full timeline (the Updates section renders with this id). */
  allHref: string;
  limit?: number;
}) {
  if (active.length === 0) return null;
  const shown = active.slice(0, limit);
  return (
    <section aria-label="Latest updates" className="mb-4 rounded-lg border border-border bg-card p-3" data-testid="latest-updates">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="font-heading font-semibold text-sm text-gray-800">{sectionHeading("latest-updates")}</h2>
        <Link href={allHref} prefetch={false} className="text-xs font-medium text-primary hover:underline whitespace-nowrap">
          All updates
        </Link>
      </div>
      <ul className="divide-y divide-border">
        {shown.map(({ post, kind }) => (
          <li key={post.id} className="py-1.5 flex items-start gap-2 text-sm">
            <span className="content-type-badge bg-primary/10 text-primary shrink-0">{contentTypeLabel(post.contentType)}</span>
            <span className="min-w-0">
              <span className="text-gray-900 font-medium leading-snug">{post.title}</span>{" "}
              {kind && kind !== "withdrawn" && <span className="text-[11px] text-gray-500">({KIND_LABEL[kind] ?? kind})</span>}
              <time className="block text-xs text-gray-500 mt-0.5">{formatDate(post.publishedAt || post.updatedAt)}</time>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
