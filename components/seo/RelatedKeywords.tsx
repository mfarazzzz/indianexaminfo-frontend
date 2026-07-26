import Link from "next/link";
import { EXAM_KEYWORDS } from "@/lib/seo/keywords";

// ─── Related Searches for exam/content-type pages ─────────────────────────
type RelatedKeywordsSectionProps = {
  examSlug: string;
};

export function RelatedKeywordsSection({ examSlug }: RelatedKeywordsSectionProps) {
  const examKw = EXAM_KEYWORDS[examSlug];
  if (!examKw?.questions?.length) return null;

  return (
    <section
      aria-label="Related searches"
      className="mt-6 pt-4 border-t border-border"
    >
      <h3 className="font-heading font-semibold text-sm text-gray-700 mb-3 uppercase tracking-wide">
        People Also Ask
      </h3>
      <div className="flex flex-wrap gap-2">
        {examKw.questions.map((q) => (
          <Link
            key={q}
            href={`/search?q=${encodeURIComponent(q)}`}
            className="text-xs px-2.5 py-1 bg-surface border border-border text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors rounded"
          >
            {q}
          </Link>
        ))}
      </div>
    </section>
  );
}


