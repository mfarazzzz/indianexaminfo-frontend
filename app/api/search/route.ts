import { NextRequest, NextResponse } from "next/server";
import { searchExams } from "@/services/examService";
import { searchBlogPosts } from "@/services/blogService";
import { searchContentPosts } from "@/services/contentPostService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const pillar = searchParams.get("pillar");
  const contentType = searchParams.get("contentType");

  if (q.length < 2) {
    return NextResponse.json({ exams: [], posts: [], blogPosts: [] });
  }

  const [exams, contentPosts, blogPosts] = await Promise.all([
    searchExams(q),
    searchContentPosts(q),
    searchBlogPosts(q),
  ]);

  // Apply optional filters
  const filteredExams = pillar
    ? exams.filter((e) => e.pillar === pillar)
    : exams;

  return NextResponse.json(
    {
      exams: filteredExams.slice(0, 10),
      posts: contentPosts.slice(0, 10),
      blogPosts: blogPosts.slice(0, 5),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
