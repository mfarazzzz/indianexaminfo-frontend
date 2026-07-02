import type { Metadata } from "next";
import Link from "next/link";
import { getExamsByPillar } from "@/services/examService";
import { ExamCard } from "@/components/exam/ExamCard";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { AdSlot } from "@/components/ads/AdSlot";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { buildPageKeywords, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";

export const revalidate = 7200;

const YEAR = getCurrentYear();
export const metadata: Metadata = buildExamMetadata({
  pageType: "pillar",
  title: `Board Exam ${YEAR} — CBSE, UP Board, Bihar Board Result & Date Sheet`,
  description: `Latest board exam updates ${YEAR}. CBSE Class 10 & 12, UP Board, Bihar Board, RBSE result, date sheet, admit card. University result for BHU, MJPRU, IGNOU and more.`,
  keywords: buildPageKeywords({ pageType: "pillar", pillar: "board-university" }),
  canonicalUrl: `${siteConfig.url}/board-exam`,
});

export default async function BoardExamPage() {
  const exams = await getExamsByPillar("board-university");

  const centralBoards = exams.filter((e) => e.category === "cbse" || e.category === "cisce" || e.category === "nios");
  const stateBoards = exams.filter((e) => e.category === "up-board" || e.category === "bihar-board" || e.category === "rbse" || e.category === "mpbse");
  const universities = exams.filter((e) => e.entityType === "university");

  return (
    <div className="container mx-auto px-4 py-4">
      <Breadcrumb items={[{ name: "Board Exam", href: "/board-exam" }]} />

      <div className="flex justify-center mb-4">
        <AdSlot position="category-top" size="728x90" />
      </div>

      <h1 className="font-heading font-bold text-2xl text-gray-900 mb-1">
        Board &amp; University Exam 2025 — Results, Date Sheet &amp; Admit Card
      </h1>
      <p className="text-sm text-gray-500 mb-5">
        Last Updated: {new Date().toLocaleDateString("en-IN")}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <main className="space-y-8">
          {/* Central Boards */}
          <section aria-labelledby="central-boards-heading">
            <h2 id="central-boards-heading" className="font-heading font-bold text-lg text-gray-900 mb-4">
              Central Boards
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {centralBoards.length ? centralBoards.map((e) => (
                <ExamCard key={e.id} exam={e} />
              )) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "CBSE Class 10", href: "/board-exam/cbse/class-10" },
                    { label: "CBSE Class 12", href: "/board-exam/cbse/class-12" },
                    { label: "ICSE (Class 10)", href: "/board-exam/state/cisce/icse-class-10" },
                    { label: "ISC (Class 12)", href: "/board-exam/state/cisce/isc-class-12" },
                    { label: "NIOS Class 10", href: "/board-exam/state/nios/class-10" },
                    { label: "NIOS Class 12", href: "/board-exam/state/nios/class-12" },
                  ].map((l) => (
                    <Link key={l.href} href={l.href} className="bg-card border border-border rounded p-3 text-sm hover:border-primary hover:bg-primary/5 transition-colors font-medium text-gray-800">
                      {l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* State Boards */}
          <section aria-labelledby="state-boards-heading">
            <h2 id="state-boards-heading" className="font-heading font-bold text-lg text-gray-900 mb-4">
              State Boards
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stateBoards.map((e) => <ExamCard key={e.id} exam={e} />)}
            </div>
          </section>

          {/* Universities */}
          <section aria-labelledby="universities-heading">
            <h2 id="universities-heading" className="font-heading font-bold text-lg text-gray-900 mb-4">
              University Results
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {universities.map((e) => <ExamCard key={e.id} exam={e} />)}
            </div>
          </section>
        </main>

        <aside>
          <AdSlot position="category-sidebar" size="300x250" />
          <div className="mt-4 bg-card border border-border rounded p-4">
            <h2 className="font-heading font-semibold text-sm text-gray-800 mb-3 uppercase tracking-wide">All State Boards</h2>
            <ul className="space-y-1.5 text-sm columns-2">
              {["UP Board", "Bihar Board", "RBSE Rajasthan", "MPBSE", "Maharashtra Board", "DBSE Delhi",
                "UBSE Uttarakhand", "JAC Jharkhand", "CGBSE", "HBSE Haryana", "PSEB Punjab",
                "HPBOSE", "GSEB Gujarat", "WBBSE", "TN Board", "KSEEB Karnataka", "Kerala Board",
                "TS Board", "AP Board", "BSE Odisha"].map((b) => (
                <li key={b}>
                  <Link href={`/board-exam/state/${b.toLowerCase().replace(/\s+/g, "-")}`} className="text-gray-600 hover:text-primary text-xs hover:underline">
                    {b}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
