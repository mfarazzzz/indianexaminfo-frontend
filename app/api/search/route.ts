/**
 * /api/search — Global search API.
 * Searches ALL content sources in parallel:
 *   - exams (entrance exams, board exams)
 *   - sarkari_naukri (government jobs — exam + direct)
 *   - content_posts (admit cards, results, answer keys, etc.)
 *   - blog_posts (articles, guides, news)
 *   - cms_education_news (education sector news)
 *
 * Supports:
 *   ?q=query         — required, min 2 chars
 *   ?type=jobs|exams|news|all  — optional filter by content domain
 *
 * Returns categorized results with metadata for instant display.
 */

import { NextRequest, NextResponse } from "next/server";
import { searchExams } from "@/services/examService";
import { searchBlogPosts } from "@/services/blogService";
import { searchContentPosts } from "@/services/contentPostService";
import { searchSarkariNaukri } from "@/services/sarkariNaukriService";
import { searchEducationNews } from "@/services/educationNewsService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const type = searchParams.get("type") ?? "all";

  if (q.length < 2) {
    return NextResponse.json({
      query: q,
      results: [],
      counts: { jobs: 0, exams: 0, posts: 0, news: 0, total: 0 },
    });
  }

  // Run all searches in parallel
  const [exams, sarkariNaukri, contentPosts, blogPosts, educationNews] = await Promise.all([
    type === "all" || type === "exams" ? searchExams(q) : Promise.resolve([]),
    type === "all" || type === "jobs" ? searchSarkariNaukri(q) : Promise.resolve([]),
    type === "all" || type === "exams" ? searchContentPosts(q) : Promise.resolve([]),
    type === "all" || type === "news" ? searchBlogPosts(q) : Promise.resolve([]),
    type === "all" || type === "news" ? searchEducationNews(q) : Promise.resolve([]),
  ]);

  // Build unified results with category labels
  const results = [
    // Government Jobs
    ...sarkariNaukri.slice(0, 8).map((item) => ({
      id: item.id,
      title: item.title,
      url: `/sarkari-naukri/${item.slug}`,
      category: "Government Jobs",
      subcategory: item.recruitmentType === "exam" ? "Sarkari Exam" : "Sarkari Bharti",
      meta: [item.organization, item.state?.replace(/-/g, " ")].filter(Boolean).join(" · "),
      badge: item.isNew ? "NEW" : null,
    })),
    // Entrance / Board Exams
    ...exams.slice(0, 8).map((exam) => ({
      id: exam.id,
      title: exam.name,
      url: `/${exam.pillar}/${exam.category}/${exam.slug}`,
      category: exam.pillar === "entrance-exam" ? "Entrance Exams" : exam.pillar === "board-university" ? "Board & University" : "Exams",
      subcategory: exam.conductingBody,
      meta: exam.status.replace(/-/g, " "),
      badge: exam.isFeatured ? "⭐" : null,
    })),
    // Content Posts (Admit Cards, Results, etc.)
    ...contentPosts.slice(0, 6).map((post) => ({
      id: post.id,
      title: post.title,
      url: `/sarkari-naukri/${post.slug}`,
      category: "Updates",
      subcategory: post.contentType.replace(/-/g, " "),
      meta: post.examEntityName,
      badge: null,
    })),
    // Blog Articles
    ...blogPosts.slice(0, 5).map((post) => ({
      id: post.id,
      title: post.title,
      url: `/blog/${post.section}/${post.slug}`,
      category: "News & Articles",
      subcategory: post.section.replace(/-/g, " "),
      meta: post.author?.name ?? "",
      badge: null,
    })),
    // Education News
    ...educationNews.slice(0, 5).map((item) => ({
      id: item.id,
      title: item.title,
      url: `/blog/education-news`,
      category: "Education News",
      subcategory: item.category.replace(/-/g, " "),
      meta: item.source ?? "",
      badge: item.isBreaking ? "BREAKING" : null,
    })),
  ];

  const counts = {
    jobs: sarkariNaukri.length,
    exams: exams.length + contentPosts.length,
    news: blogPosts.length + educationNews.length,
    total: results.length,
  };

  return NextResponse.json(
    { query: q, results: results.slice(0, 25), counts },
    { headers: { "Cache-Control": "no-store" } }
  );
}
