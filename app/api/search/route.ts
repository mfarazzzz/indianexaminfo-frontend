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
 *   ?q=query         — trimmed, capped at MAX_QUERY_LENGTH, and a query shorter than
 *                      MIN_QUERY_LENGTH still returns an empty 200 (unchanged behaviour, which
 *                      the panel/header search box depends on)
 *   ?type=jobs|exams|news|all  — optional filter by content domain
 *
 * Returns categorized results with metadata for instant display.
 *
 * Guards (owner batch 6, W1) live in lib/api/searchGuard.ts so their arithmetic is unit-testable:
 *   • over-long query  -> 400 with the limit named;
 *   • too many from one client IP -> 429 with Retry-After.
 * The bucket is per Node process and the IP is fail-open when no proxy header is present — both
 * stated in that file, because a guard that locks out real readers is worse than no guard.
 */

import { NextRequest, NextResponse } from "next/server";
import { searchExams } from "@/services/examService";
import { searchBlogPosts } from "@/services/blogService";
import { searchContentPosts } from "@/services/contentPostService";
import { searchSarkariNaukri } from "@/services/sarkariNaukriService";
import { searchEducationNews } from "@/services/educationNewsService";
import { pillarToUrlSegment } from "@/lib/exam/pillarUrl";
import {
  MIN_QUERY_LENGTH, clientIpFromHeaders, createTokenBucket, validateSearchQuery,
} from "@/lib/api/searchGuard";

export const dynamic = "force-dynamic";

/** One bucket for this process. See the header of lib/api/searchGuard.ts. */
const searchRateLimiter = createTokenBucket();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q");

  // 1. Length cap. Rejected before any work, so an oversized query never reaches Supabase.
  const verdict = validateSearchQuery(rawQuery);
  if (!verdict.ok) {
    return NextResponse.json(
      { error: verdict.code, message: verdict.message, max: verdict.max, query: "" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  // 2. Per-client throttle. Checked before the database work, which is the point of it.
  const rate = searchRateLimiter.check(clientIpFromHeaders((n) => request.headers.get(n)));
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many searches from this connection. Try again shortly.", query: verdict.q },
      {
        status: 429,
        headers: {
          "Retry-After": String(rate.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const q = verdict.q;
  const type = searchParams.get("type") ?? "all";

  // Unchanged historical behaviour: a query too short to be useful answers 200 with nothing.
  if (q.length < MIN_QUERY_LENGTH) {
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
      url: `/${pillarToUrlSegment(exam.pillar)}/${exam.category}/${exam.slug}`,
      category: exam.pillar === "entrance-exam" ? "Entrance Exams" : exam.pillar === "board-exam" ? "Board & University" : "Exams",
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
