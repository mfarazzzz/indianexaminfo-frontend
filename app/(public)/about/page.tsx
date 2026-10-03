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
    description: page?.metaDescription ?? "Learn about IndianExamInfo, India's most trusted exam information portal. Our mission, team and editorial policy.",
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
              IndianExamInfo is India&apos;s most trusted exam information portal, helping students
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
            {/* Owner-approved text, Sprint 0 Part 2 2026-09-28. Replaces the old
                "sourced directly … we verify before publishing" claim: none of the
                361 vacancy pages links a checked notification, so the policy now
                states what is actually true. &quot; entities render as plain double
                quotes — displayed text is exactly the approved copy. */}
            <p>
              IndianExamInfo summarises recruitment, exam and admission information for readers. Where we have checked a page against the official notification, the page links to that notification. Pages marked &quot;not yet verified&quot; have not yet been checked against an official source and may contain errors. Always confirm dates, eligibility and fees on the official website before you apply or pay any fee. If you find a mistake, please tell us through the &quot;Report an error&quot; link on the page, our Contact page (/contact) or contact@indianexaminfo.com. We correct confirmed errors as quickly as we can.
            </p>
            <p lang="hi" className="mt-2">
              IndianExamInfo भर्ती, परीक्षा और प्रवेश से जुड़ी जानकारी पाठकों के लिए संक्षेप में प्रस्तुत करता है। जिन पेजों को हमने आधिकारिक अधिसूचना से मिलाकर जाँच लिया है, उनमें उस अधिसूचना का लिंक दिया गया है। जिन पेजों पर &quot;अभी सत्यापित नहीं&quot; लिखा है, उन्हें अभी किसी आधिकारिक स्रोत से नहीं मिलाया गया है और उनमें गलतियाँ हो सकती हैं। आवेदन करने या कोई भी शुल्क भरने से पहले तारीखें, पात्रता और शुल्क आधिकारिक वेबसाइट पर ज़रूर जाँच लें। अगर आपको कोई गलती दिखे, तो पेज पर दिए &quot;गलती बताएँ&quot; लिंक, हमारे संपर्क पेज (/contact) या contact@indianexaminfo.com के ज़रिए हमें बताएँ। पुष्टि होने पर हम गलती जल्द से जल्द ठीक करते हैं।
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
