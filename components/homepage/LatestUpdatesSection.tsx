import Link from "next/link";
import type { ContentPost } from "@/types/exam";
import { getExamEntityHref } from "@/lib/exam/actionLinks";
import { formatDate } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = { provisional: "Provisional", final: "Final", revised: "Revised", corrigendum: "Corrigendum" };
const KIND_TONE: Record<string, string> = { provisional: "is-neutral", final: "is-final", revised: "is-revised", corrigendum: "is-corrigendum", withdrawn: "is-withdrawn" };

/**
 * LatestUpdatesSection - B4 (owner decision, 22 Oct): the home "Latest Updates /
 * ताज़ा अपडेट" card. The pool (getHomeBulletin) is PUBLISHED EXAM-LINKED updates -
 * pinned first (reader cap 3) then newest, 6 total max. Renders NOTHING when
 * empty (no empty card). Cells link to the exam page from the joined exam
 * identity; an update without a usable exam join renders no row (never an
 * invented URL). Mock card language: 14px radius, card/border tokens, muted
 * timestamps, palette kind badges.
 */
export function LatestUpdatesSection({ posts }: { posts: ContentPost[] }) {
  const items = posts.filter((p) => p.title?.trim() && p.examSlug && p.examPillar);
  if (items.length === 0) return null;
  return (
    <section aria-label="Latest updates" className="bg-card border border-border rounded-[14px] p-4" data-testid="home-latest-updates">
      <h2 className="font-heading font-semibold text-[1.05rem] text-gray-800 mb-2">Latest Updates / ताज़ा अपडेट</h2>
      <ul className="divide-y divide-border">
        {items.map((p) => (
          <li key={p.id}>
            <Link
              href={getExamEntityHref({ pillar: p.examPillar!, category: p.examCategorySlug ?? "", slug: p.examSlug! })}
              prefetch={false}
              className="group flex items-start justify-between gap-3 py-2"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-900 group-hover:text-[#1d4ed8] leading-snug">{p.title}</span>
                <span className="block text-xs text-gray-500 mt-0.5 truncate">{p.examEntityName || p.examSlug}</span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                {p.kind && p.kind !== "withdrawn" && (
                  <span className={`exam-kind ${KIND_TONE[p.kind] ?? "is-neutral"}`}>{KIND_LABEL[p.kind] ?? p.kind}</span>
                )}
                {p.verifiedBy && <span className="exam-kind is-final">Verified</span>}
                <time className="text-xs text-gray-500">{formatDate(p.publishedAt || p.updatedAt)}</time>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}