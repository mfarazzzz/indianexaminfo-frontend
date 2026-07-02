// Pure server component — NO "use client"
// Client interactivity lives in LatestUpdatesClient.tsx
import { getAllExams } from "@/services/examService";
import { getLatestContentPosts } from "@/services/contentPostService";
import { LatestUpdatesClient, type UpdateItem } from "./LatestUpdatesClient";

import type { ContentPost } from "@/types/exam";

type LatestUpdatesProps = {
  exams?: import("@/types/exam").ExamEntity[];
  posts?: ContentPost[];
};

export async function LatestUpdates({ exams: examsProp, posts: postsProp }: LatestUpdatesProps = {}) {
  const [exams, posts] = await Promise.all([
    examsProp ? Promise.resolve(examsProp) : getAllExams(),
    postsProp ? Promise.resolve(postsProp) : getLatestContentPosts(20),
  ]);

  // Posts → update items
  const fromPosts: UpdateItem[] = posts.map((p) => ({
    id:          `post-${p.id}`,
    title:       p.title,
    href:        `/${p.pillar}/${p.examEntityName.toLowerCase().replace(/\s+/g, "-")}/${p.slug}`,
    category:    p.examEntityName,
    pillar:      p.pillar,
    contentType: p.contentType,
    date:        p.updatedAt,
    isUrgent:    false,
  }));

  // Upcoming exam dates as notification items (supplement when post list is thin)
  const fromExams: UpdateItem[] = exams
    .flatMap((e) =>
      e.dates
        .filter((d) => new Date(d.date) >= new Date())
        .slice(0, 1)
        .map((d) => ({
          id:          `exam-${e.id}-${d.label}`,
          title:       `${e.shortName} — ${d.label}`,
          href:        `/${e.pillar}/${e.category}/${e.slug}`,
          category:    e.category,
          pillar:      e.pillar,
          contentType: "notification" as const,
          date:        d.date,
          isUrgent:    d.isUrgent,
        }))
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  // Merge, deduplicate, sort newest-first
  const seen = new Set<string>();
  const merged: UpdateItem[] = [];
  for (const item of [...fromPosts, ...fromExams]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  }

  const items = merged
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);

  return <LatestUpdatesClient items={items} />;
}
