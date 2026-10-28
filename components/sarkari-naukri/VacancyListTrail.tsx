import Link from "next/link";
import { jobPageHref, pageTrail } from "@/lib/sarkari/vacancyPages";

/**
 * VacancyListTrail — the entry links into /sarkari-naukri/jobs/page/N (owner batch 4, K5).
 *
 * /sarkari-naukri shows its first 20 rows and appends the rest with a client "Load more".
 * That is a fine reader experience and a broken crawl: a crawl that follows links does not
 * click, so the ~160 records below the fold had no in-link anywhere (batch 3's orphan
 * measurement). These real anchors are the discovery entry — the pagination pages then carry
 * the rest of the chain — and they are the ONLY part of this feature that changes an existing
 * page. They are read-only links: the urgency list, its ordering and the Load-more button are
 * untouched, and this route keeps its own revalidate/cache behaviour.
 */
export function VacancyListTrail({ pages, total }: { pages: number; total: number }) {
  if (pages < 2) return null;   // one page holds the whole corpus — nothing to paginate
  const numbers = pageTrail(1, pages);
  return (
    <nav aria-label="All recruitments, page by page" className="mt-6">
      <h2 className="font-heading font-semibold text-sm text-gray-800 mb-2 uppercase tracking-wide">
        All {total} recruitments, 20 to a page
      </h2>
      <ul className="flex flex-wrap items-center gap-2 text-sm">
        {numbers.map((p) => (
          <li key={p}>
            <Link
              href={jobPageHref(p)}
              className="rounded border border-border bg-white px-3 py-1.5 font-semibold text-gray-700 hover:border-primary hover:text-primary transition-colors"
            >
              Page {p}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
