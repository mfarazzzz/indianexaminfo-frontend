import type { Metadata } from "next";
import { SearchHero } from "@/components/homepage/SearchHero";
import { AudienceGateway } from "@/components/homepage/AudienceGateway";
import { LatestUpdates } from "@/components/homepage/LatestUpdates";
import { QuickActions } from "@/components/homepage/QuickActions";
import { SarkariNaukriSection } from "@/components/homepage/SarkariNaukriSection";
import { EntranceExamSection } from "@/components/homepage/EntranceExamSection";
import { BoardUniversitySection } from "@/components/homepage/BoardUniversitySection";
import { EditorialSpotlight } from "@/components/homepage/EditorialSpotlight";
import { HomeSidebar } from "@/components/homepage/HomeSidebar";
import { AdSlot } from "@/components/ads/AdSlot";
import { buildHomepageMetadata } from "@/lib/seo/metadata";
import { GLOBAL_SHORT_TAIL, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { DeadlineStrip } from "@/components/homepage/DeadlineStrip";
import {
  getExamsByPillar,
  getAllExams,
  getDeadlineBands,
  getTodayIST,
} from "@/services/examService";
import { getLatestContentPosts } from "@/services/contentPostService";

export const revalidate = 1800;

export function generateMetadata(): Metadata {
  const meta = buildHomepageMetadata();
  const year = getCurrentYear();
  return {
    ...meta,
    title: `IndianExamInfo — Sarkari Result, Admit Card, Exam ${year}`,
    keywords: GLOBAL_SHORT_TAIL,
  };
}

/**
 * CQ-02 fix: fetch all homepage data once via a single Promise.all.
 * Previously each section component fetched independently — 6+ DB calls.
 * Now: 1 Promise.all → 5 parallel queries → pass data down as props.
 */
export default async function HomePage() {
  // CQ-02: every homepage query runs once here, in one Promise.all, and the
  // results are passed down as props. Category-card counts and the deadline
  // strip are fetched here too, so no child component issues its own query.
  const [
    sarkariExams,
    entranceExams,
    boardExams,
    allExams,
    latestPosts,
    deadlineBands,
    todayISO,
  ] = await Promise.all([
    getExamsByPillar("government-exam"),
    getExamsByPillar("entrance-exam"),
    getExamsByPillar("board-exam"),
    getAllExams(),
    getLatestContentPosts(20),
    getDeadlineBands(50),
    getTodayIST(),
  ]);

  return (
    <>
      <h1 className="sr-only">
        {siteConfig.name} — India&apos;s Most Trusted Exam Information Portal
      </h1>

      {/* ── Top leaderboard ad — hidden until a real creative is served ── */}
      <div className="flex justify-center empty:hidden [&:has(>*:empty)]:hidden">
        <AdSlot position="homepage-top" size="728x90" hideWhenEmpty />
      </div>

      {/* ① Status cards — four date-derived cards, above the hero */}
      <DeadlineStrip bands={deadlineBands} />

      {/* ② Search Hero */}
      <SearchHero />

      {/* ③ Five destination cards — full width, below the hero */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <AudienceGateway />
        </div>
      </section>

      {/* ④ Quick Actions — prominent utility bar, full width */}
      <section className="pb-2">
        <div className="container mx-auto px-4">
          <QuickActions />
        </div>
      </section>

      {/* ⑤ Main two-column layout: Latest Updates + sidebar, then sections */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

          {/* Main column */}
          <div className="min-w-0 space-y-8">

            {/* Latest Updates — pre-fetched data passed in */}
            <LatestUpdates exams={allExams} posts={latestPosts} todayISO={todayISO} />

            {/* Mid-page leaderboard — hidden until a real creative is served */}
            <div className="flex justify-center empty:hidden">
              <AdSlot position="category-top" size="728x90" hideWhenEmpty />
            </div>

            {/* Government Exams — pre-fetched */}
            <SarkariNaukriSection exams={sarkariExams} />

            {/* Entrance Exams — pre-fetched */}
            <EntranceExamSection exams={entranceExams} />

            {/* Boards & Universities — pre-fetched */}
            <BoardUniversitySection exams={boardExams} />

            {/* Blog */}
            <EditorialSpotlight />
          </div>

          {/* Sidebar — pre-fetched allExams */}
          <HomeSidebar exams={allExams} todayISO={todayISO} />
        </div>
      </div>
    </>
  );
}
