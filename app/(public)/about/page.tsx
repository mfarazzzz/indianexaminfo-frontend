import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { GLOBAL_SHORT_TAIL } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { getPageBySlug } from "@/services/pageService";
import { safeHtml } from "@/lib/sanitize";

export const revalidate = 3600; // hourly — so CMS edits appear within an hour

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("about");
  return buildExamMetadata({
    pageType: "static",
    title: page?.metaTitle ?? "About IndianExamInfo — India's Most Trusted Exam Portal",
    description: page?.metaDescription ?? "Learn about IndianExamInfo, India's most trusted exam information portal. Our mission, team, editorial policy and how we help millions of students.",
    keywords: ["about indianexaminfo", "exam information portal india", ...GLOBAL_SHORT_TAIL.slice(0, 4)],
    canonicalUrl: `${siteConfig.url}/about`,
  });
}

export default async function AboutPage() {
  const page = await getPageBySlug("about");

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <Breadcrumb items={[{ name: "About", href: "/about" }]} />
      <h1 className="font-heading font-bold text-2xl text-gray-900 mt-4 mb-6">
        {page?.title ?? "About IndianExamInfo"}
      </h1>

      {/* If CMS has content, render it; otherwise show hardcoded fallback */}
      {page?.content ? (
        <div
          className="prose prose-gray max-w-none text-sm text-gray-700 leading-relaxed"
          {...safeHtml(page.content)}
        />
      ) : (
        <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">Who We Are</h2>
            <p>
              IndianExamInfo is India&apos;s most trusted exam information portal, helping millions of students
              stay updated on government jobs, entrance exams, board results and university information.
              We are operated by {siteConfig.organization.name}, based in New Delhi.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">Our Mission</h2>
            <p>
              Our mission is to make accurate exam information accessible to every student in India —
              from rural villages to metro cities. We believe no student should miss an important exam
              deadline due to lack of information.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">What We Cover</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Sarkari Naukri:</strong> UPSC, SSC, Banking, Railways, Defence, Police and all government job notifications</li>
              <li><strong>Entrance Exams:</strong> JEE Main, NEET UG, CAT, CLAT, GATE and 200+ entrance exams</li>
              <li><strong>Board Exams:</strong> CBSE, UP Board, Bihar Board, and all state boards</li>
              <li><strong>Universities:</strong> MJPRU, CSJMU, BHU, IGNOU, DU and 100+ universities</li>
              <li><strong>Blog:</strong> Education news, exam preparation guides, career guidance and scholarships</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">Editorial Policy</h2>
            <p>
              All information on IndianExamInfo is sourced directly from official exam body websites.
              We verify dates and notifications before publishing.
            </p>
            <p className="mt-2">
              <strong>Important:</strong> IndianExamInfo is not affiliated with, endorsed by, or connected
              to any government body, university, or exam conducting authority.
            </p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-2">Contact</h2>
            <p>
              For corrections, feedback or partnership inquiries, please visit our{" "}
              <a href="/contact" className="text-primary hover:underline">Contact page</a>.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
