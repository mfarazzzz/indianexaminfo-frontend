import type { Metadata } from "next";
import { SearchHero } from "@/components/homepage/SearchHero";
import { AudienceGateway } from "@/components/homepage/AudienceGateway";
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
    deadlineBands,
    todayISO,
  ] = await Promise.all([
    getExamsByPillar("government-exam"),
    getExamsByPillar("entrance-exam"),
    getExamsByPillar("board-exam"),
    getAllExams(),
    getDeadlineBands(50),
    getTodayIST(),
  ]);

  // Exams already shown in the deadline strip (across all four bands). The sidebar
  // excludes these so the strip answers "what's imminent, by event" and the sidebar
  // answers "and after that, what's coming" — not the same exams twice.
  const stripExamIds = Array.from(
    new Set(
      [
        ...deadlineBands.closingSoon,
        ...deadlineBands.admitCardOut,
        ...deadlineBands.resultsOut,
        ...deadlineBands.examsThisMonth,
      ].map((i) => i.examId),
    ),
  );

  return (
    <>
      <h1 className="sr-only">
        {siteConfig.name} — India&apos;s Most Trusted Exam Information Portal
      </h1>

      {/* ── Top leaderboard ad — hidden until a real creative is served ── */}
      <div className="flex justify-center empty:hidden [&:has(>*:empty)]:hidden">
        <AdSlot position="homepage-top" size="728x90" hideWhenEmpty />
      </div>

      {/* Item 7: on MOBILE the reader reaches for search first, so it renders first;
          the deadline strip follows as a collapsed one-line summary (it expands on tap and
          carries real counts, or does not render at all when every band is empty). On DESKTOP
          (sm+) the original order is restored via flex `order`: strip above the hero, full grid. */}
      <div className="flex flex-col">
        <div className="order-1 sm:order-none">
          <SearchHero />
        </div>
        <div className="order-none sm:order-first">
          <DeadlineStrip bands={deadlineBands} />
        </div>
      </div>

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

            {/* Track 3: "Latest updates" removed — even fixed (posts-first) it was a
                full-width blog feed of exam_id-null posts, duplicating the Blog & News
                section below. The deadline strip (imminent, by event) + sidebar (soonest
                deadlines) cover the date-list need. */}

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

          {/* Sidebar — pre-fetched allExams; excludes exams already in the strip. */}
          <HomeSidebar exams={allExams} todayISO={todayISO} stripExamIds={stripExamIds} />
        </div>
      </div>
    </>
  );
}
