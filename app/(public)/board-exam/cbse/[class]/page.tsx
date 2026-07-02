import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getExamBySlug } from "@/services/examService";
import { EntityDetailPage } from "@/components/exam/EntityDetailPage";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { buildPageKeywords, EXAM_KEYWORDS, getCurrentYear } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";

export const revalidate = 3600;

type Props = { params: Promise<{ class: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { class: cls } = await params;
  const year = getCurrentYear();
  const classLabel = cls === "class-10" ? "Class 10" : "Class 12";
  return buildExamMetadata({
    pageType: "board",
    title: `CBSE ${classLabel} Result ${year} — Check Marks at cbseresults.nic.in`,
    description: `CBSE ${classLabel} Board Result ${year}. Check your marks, subject-wise scores and pass/fail status. Download marksheet from DigiLocker.`,
    keywords: buildPageKeywords({ pageType: "board", pillar: "board-university", examSlug: "cbse" }),
    canonicalUrl: `${siteConfig.url}/board-exam/cbse/${cls}`,
  });
}

export default async function CBSEClassPage({ params }: Props) {
  const { class: cls } = await params;
  const slug = cls; // e.g. "class-10" or "class-12"
  const exam = await getExamBySlug(slug);

  if (!exam) notFound();

  const classLabel = cls === "class-10" ? "Class 10" : "Class 12";

  return (
    <EntityDetailPage
      exam={exam}
      breadcrumbs={[
        { name: "Board Exam", href: "/board-exam" },
        { name: "CBSE", href: "/board-exam/cbse" },
        { name: `CBSE ${classLabel}`, href: `/board-exam/cbse/${cls}` },
      ]}
    />
  );
}
