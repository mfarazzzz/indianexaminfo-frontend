import Link from "next/link";
import { getLatestContentPosts } from "@/services/contentPostService";
import { contentTypeLabel } from "@/lib/utils";

export async function BreakingTicker() {
  // Priority order: result > admit-card > notification > others
  const all = await getLatestContentPosts(20);
  const sorted = [
    ...all.filter((p) => p.contentType === "result"),
    ...all.filter((p) => p.contentType === "admit-card"),
    ...all.filter((p) => p.contentType === "notification"),
    ...all.filter((p) => !["result", "admit-card", "notification"].includes(p.contentType)),
  ].slice(0, 8);

  if (!sorted.length) return null;

  const items = sorted.map((p) => ({
    id:          p.id,
    label:       p.title,
    contentType: p.contentType,
    href:        `/${p.pillar}/${p.examEntityName.toLowerCase().replace(/\s+/g, "-")}/${p.slug}`,
  }));

  return (
    <div
      className="bg-white border-b border-border flex items-stretch overflow-hidden h-9"
      aria-label="Latest updates ticker"
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
              {/* Separator */}
              <span className="text-gray-300 ml-2" aria-hidden="true">▶</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
