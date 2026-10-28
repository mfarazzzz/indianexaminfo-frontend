import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { GLOBAL_SHORT_TAIL } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { getPageBySlug } from "@/services/pageService";
import { safeHtml } from "@/lib/sanitize";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("privacy-policy");
  return buildExamMetadata({
    pageType: "static",
    title: page?.metaTitle ?? "Privacy Policy",   // K2: the template adds the brand suffix
    description: page?.metaDescription ?? "IndianExamInfo privacy policy. How we collect, use and protect your data when you use our exam information portal.",
    keywords: ["privacy policy indianexaminfo", "data protection", ...GLOBAL_SHORT_TAIL.slice(0, 3)],
    canonicalUrl: `${siteConfig.url}/privacy-policy`,
  });
}

export default async function PrivacyPolicyPage() {
  const page = await getPageBySlug("privacy-policy");

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <Breadcrumb items={[{ name: "Privacy Policy", href: "/privacy-policy" }]} />
      <h1 className="font-heading font-bold text-2xl text-gray-900 mt-4 mb-2">
        {page?.title ?? "Privacy Policy"}
      </h1>
      <p className="text-xs text-gray-400 mb-6">Last updated: October 24, 2026</p>

      {page?.content ? (
        <div
          className="prose prose-gray max-w-none text-sm text-gray-700 leading-relaxed"
          {...safeHtml(page.content)}
        />
      ) : (
        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-heading font-bold text-base text-gray-900 mb-2">1. Information We Collect</h2>
            <p>IndianExamInfo collects the minimum needed to answer you. The only data we
              actively gather is what <em>you choose to submit</em> through our contact form or the
              &ldquo;Report an error&rdquo; sheet: an optional name, email and/or phone, your message,
              and the page you reported. We do not ask for, or store, anything beyond that.</p>
            <p className="mt-2">We do <strong>not</strong> currently load any analytics or advertising
              scripts by default. If analytics is enabled in future, it will load <strong>only after
              you accept the on-screen consent notice</strong>, and it will record anonymised usage
              (the page path and device type) — never your name, email, phone or the text of a form
              you submit. Choosing &ldquo;Decline&rdquo; keeps the whole site working and loads nothing.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-base text-gray-900 mb-2">2. Cookies &amp; Local Storage</h2>
            <p>We do not set tracking cookies by default. A few things are stored locally in your own
              browser (not on our servers): your analytics-consent choice, and a short
              &ldquo;recently viewed&rdquo; list to speed up navigation. You can clear these in your
              browser settings at any time.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-base text-gray-900 mb-2">3. Advertising</h2>
            <p>IndianExamInfo does <strong>not</strong> currently serve Google AdSense or any other
              personalised advertising, and does not sell your data. If advertising is ever added,
              this policy will be updated and a consent notice shown before any ad script loads.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-base text-gray-900 mb-2">4. Third-Party Links</h2>
            <p>Our website contains links to official exam body websites, government portals and other third-party sites. We are not responsible for the privacy practices of these external websites.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-base text-gray-900 mb-2">5. Data Security</h2>
            <p>We implement standard security measures including HTTPS encryption, secure hosting, and regular security updates. However, no internet transmission is 100% secure.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-base text-gray-900 mb-2">6. Children&apos;s Privacy</h2>
            <p>IndianExamInfo is designed for students aged 16 and above. We do not knowingly collect personal information from children under 13.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-base text-gray-900 mb-2">7. Contact</h2>
            <p>For privacy-related queries, contact us at our <a href="/contact" className="text-primary hover:underline">Contact page</a>.</p>
          </section>
        </div>
      )}
    </div>
  );
}
