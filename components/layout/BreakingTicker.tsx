import Link from "next/link";
import { getTickerUpdates } from "@/services/contentPostService";
import { contentTypeLabel } from "@/lib/utils";
import { getExamEntityHref } from "@/lib/exam/actionLinks";

/**
 * BreakingTicker.tsx — B1+B3 (owner decisions, 22 Oct): the global ticker shows
 * the LATEST PUBLISHED EXAM-LINKED updates — not generic news (that has /news).
 * Each cell links to the exam's own page, built from the JOINED exam row's
 * slug/pillar/category via getExamEntityHref — the old href built from
 * examEntityName could 404 and is gone (B1). An update whose exam join yields
 * no slug/pillar renders NO cell: we never invent a URL.
 *
 * Pool rules live in lib/exam/updateFeed (published, kind != withdrawn, not
 * expired, newest first, cap 8). A "Verified" mark appears ONLY when an editor
 * verified that update (verified_by set). Empty pool → render NOTHING — no
 * empty bar, ever (the old empty "LATEST UPDATE" bug).
 */
export async function BreakingTicker() {
  const posts = await getTickerUpdates(8);
  const items = posts
    .filter((p) => p.title?.trim() && p.examSlug && p.examPillar)
    .map((p) => ({
      id: p.id,
      label: p.title.trim(),
      contentType: p.contentType,
      href: getExamEntityHref({
        pillar: p.examPillar!,
        category: p.examCategorySlug ?? "",
        slug: p.examSlug!,
      }),
      verified: !!p.verifiedBy,
    }));

  if (items.length === 0) return null;

  return (
    <div
      className="bg-white border-b border-border flex items-stretch overflow-hidden h-9"
      aria-label="Latest exam updates"
    >
      {/* Static label */}
      <div className="bg-accent text-white font-bold text-xs uppercase tracking-wider px-3 flex items-center shrink-0 z-10 whitespace-nowrap">
        LATEST UPDATE:
      </div>

      {/* Scrolling track */}
      <div className="flex-1 overflow-hidden relative">
        <div className="ticker-inner flex items-center h-full gap-0 absolute whitespace-nowrap">
          {[...items, ...items].map((item, i) => (
            <Link
              key={`${item.id}-${i}`}
              href={item.href}
              prefetch={false}
              className="inline-flex items-center gap-2 text-xs text-gray-700 hover:text-primary transition-colors px-4"
              data-speakable="true"
            >
              {/* Content type pill */}
              <span className="bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded text-xs uppercase shrink-0">
                {contentTypeLabel(item.contentType)}
              </span>
              <span>{item.label}</span>
              {/* Editor verification mark - only when the update carries one */}
              {item.verified && (
                <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 shrink-0">
                  Verified
                </span>
              )}
              {/* Separator */}
              <span className="text-gray-300 ml-2" aria-hidden="true">|</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
