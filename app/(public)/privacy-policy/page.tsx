import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { GLOBAL_SHORT_TAIL } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { getPageBySlug } from "@/services/pageService";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("privacy-policy");
  return buildExamMetadata({
    pageType: "static",
    title: page?.metaTitle ?? "Privacy Policy — IndianExamInfo",
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
      <p className="text-xs text-gray-400 mb-6">Last updated: June 1, 2025</p>

      {page?.content ? (
        <div
          className="prose prose-gray max-w-none text-sm text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      ) : (
        <div className="space-y-6 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="font-heading font-bold text-base text-gray-900 mb-2">1. Information We Collect</h2>
            <p>IndianExamInfo collects minimal data to provide our services. When you visit our website, we may collect: browsing data via Google Analytics (page views, session duration, device type), search queries entered on our site, and any information you voluntarily provide via our contact form.</p>
            <p className="mt-2">We do not collect names, email addresses, or personal identifiers unless you explicitly submit them through our contact form.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-base text-gray-900 mb-2">2. Cookies</h2>
            <p>We use cookies for: Google Analytics (anonymous usage statistics), recently viewed exams (stored locally in your browser), and advertising cookies from Google AdSense. You can disable cookies in your browser settings, though some features may not function properly.</p>
          </section>

          <section>
            <h2 className="font-heading font-bold text-base text-gray-900 mb-2">3. Advertising</h2>
            <p>IndianExamInfo uses Google AdSense to display advertisements. Google may use cookies to show personalized ads based on your browsing history. You can opt out of personalized advertising at <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">adssettings.google.com</a>.</p>
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
