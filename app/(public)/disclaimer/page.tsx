import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { GLOBAL_SHORT_TAIL } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { getPageBySlug } from "@/services/pageService";
import { safeHtml } from "@/lib/sanitize";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("disclaimer");
  return buildExamMetadata({
    pageType: "static",
    title: page?.metaTitle ?? "Disclaimer — IndianExamInfo",
    description: page?.metaDescription ?? "IndianExamInfo disclaimer. We are not affiliated with any government body. Information is for guidance only — always verify from official sources.",
    keywords: ["indianexaminfo disclaimer", "not affiliated government", ...GLOBAL_SHORT_TAIL.slice(0, 3)],
    canonicalUrl: `${siteConfig.url}/disclaimer`,
  });
}

export default async function DisclaimerPage() {
  const page = await getPageBySlug("disclaimer");

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <Breadcrumb items={[{ name: "Disclaimer", href: "/disclaimer" }]} />
      <h1 className="font-heading font-bold text-2xl text-gray-900 mt-4 mb-2">
        {page?.title ?? "Disclaimer"}
      </h1>
      <p className="text-xs text-gray-400 mb-6">Last updated: June 1, 2025</p>

      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
        <p className="text-sm font-semibold text-yellow-800">
          ⚠️ IndianExamInfo is NOT affiliated with UPSC, SSC, IBPS, NTA, CBSE, or any government body. Always verify information from official websites.
        </p>
      </div>

      {page?.content ? (
        <div
          className="prose prose-gray max-w-none text-sm text-gray-700 leading-relaxed"
          {...safeHtml(page.content)}
        />
      ) : (
        <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-heading font-bold text-base text-gray-900 mb-2">1. Information Accuracy</h2>
            <p>IndianExamInfo strives to provide accurate and up-to-date information. However, exam dates, eligibility criteria, vacancies and other details may change without notice. We strongly recommend verifying all information from the official website of the respective exam conducting body before taking any action.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-base text-gray-900 mb-2">2. No Official Affiliation</h2>
            <p>IndianExamInfo ({siteConfig.organization.name}) is an independent information portal and is NOT affiliated with, endorsed by, or associated with UPSC, SSC, IBPS, SBI, NTA, CBSE, UPMSP, or any other government organization, university, or exam authority.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-base text-gray-900 mb-2">3. No Liability</h2>
            <p>We shall not be held liable for any loss, damage, or inconvenience arising from the use of information on this website. Users accessing and using information on IndianExamInfo do so at their own risk.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-base text-gray-900 mb-2">4. External Links</h2>
            <p>Our website contains links to official government and exam body websites. We are not responsible for the content, accuracy, or availability of these external websites.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-base text-gray-900 mb-2">5. Copyright</h2>
            <p>All original content on IndianExamInfo is the intellectual property of {siteConfig.organization.name}. Exam notifications, syllabi and other official documents remain the property of their respective government bodies.</p>
          </section>
        </div>
      )}
    </div>
  );
}
