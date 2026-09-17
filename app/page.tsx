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
  getExamCountByPillar,
  getDeadlineBands,
} from "@/services/examService";
import { getSarkariNaukriStats } from "@/services/sarkariNaukriService";
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
    sarkariStats,
    admissionsCount,
    boardCount,
    universityCount,
    deadlineBands,
  ] = await Promise.all([
    getExamsByPillar("government-exam"),
    getExamsByPillar("entrance-exam"),
    getExamsByPillar("board-exam"),
    getAllExams(),
    getLatestContentPosts(20),
    getSarkariNaukriStats(),
    getExamCountByPillar("entrance-exam"),
    getExamCountByPillar("board-exam"),
    getExamCountByPillar("university-exam"),
    getDeadlineBands(8),
  ]);

  return (
    <>
      <h1 className="sr-only">
        {siteConfig.name} — India&apos;s Most Trusted Exam Information Portal
      </h1>

      {/* ── Top leaderboard ad ── */}
      <div className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-2 flex justify-center">
          <AdSlot position="homepage-top" size="728x90" />
        </div>
      </div>

      {/* ① Deadline / status strip — four date-derived bands (exam_derived_status VIEW) */}
      <DeadlineStrip bands={deadlineBands} />

      {/* ② Search Hero */}
      <SearchHero />

      {/* ③ Audience Gateway — counts pre-fetched, passed as props */}
      <section className="bg-white border-b border-border py-6">
        <div className="container mx-auto px-4">
          <AudienceGateway
            sarkariExamCount={sarkariStats.exam}
            sarkariDirectCount={sarkariStats.direct}
            admissionsCount={admissionsCount}
            boardCount={boardCount}
            universityCount={universityCount}
          />
        </div>
      </section>

      {/* ③ Main two-column layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

          {/* Main column */}
          <div className="min-w-0 space-y-8">

            {/* ④ Latest Updates — pre-fetched data passed in */}
            <LatestUpdates exams={allExams} posts={latestPosts} />

            {/* ⑤ Quick Actions */}
            <QuickActions />

            {/* Mid-page leaderboard */}
            <div className="flex justify-center">
              <AdSlot position="category-top" size="728x90" />
            </div>

            {/* ⑥ Government Exams — pre-fetched */}
            <SarkariNaukriSection exams={sarkariExams} />

            {/* ⑦ Entrance Exams — pre-fetched */}
            <EntranceExamSection exams={entranceExams} />

            {/* ⑧ Boards & Universities — pre-fetched */}
            <BoardUniversitySection exams={boardExams} />

            {/* ⑨ Blog */}
            <EditorialSpotlight />
          </div>

          {/* Sidebar — pre-fetched allExams */}
          <HomeSidebar exams={allExams} />
        </div>
      </div>
    </>
  );
}
