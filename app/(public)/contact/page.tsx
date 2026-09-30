import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { GLOBAL_SHORT_TAIL } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";
import { ContactForm } from "@/components/contact/ContactForm";

export const revalidate = 604800;

export const metadata: Metadata = buildExamMetadata({
  pageType: "static",
  title: "Contact IndianExamInfo — Reach Out to Our Team",
  description: "Contact the IndianExamInfo team for corrections, feedback, advertising inquiries or partnership opportunities.",
  keywords: ["contact indianexaminfo", ...GLOBAL_SHORT_TAIL.slice(0, 3)],
  canonicalUrl: `${siteConfig.url}/contact`,
});

/** Public contact email — owner decision 28 Sep (Sprint 0 brief §1). */
const CONTACT_EMAIL = "contact@indianexaminfo.com";

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Breadcrumb items={[{ name: "Contact", href: "/contact" }]} />
      <h1 className="font-heading font-bold text-2xl text-gray-900 mt-4 mb-1">
        संपर्क करें · Contact IndianExamInfo
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {siteConfig.organization.name} · New Delhi, India
      </p>

      <p className="text-sm text-gray-700 mb-6 leading-relaxed">
        गलती बताएँ, सुझाव दें, सवाल पूछें या साझेदारी की बात करें — हर संदेश हमारी टीम तक
        पहुँचता है। — Errors, suggestions, questions or partnerships: every message reaches
        our team. We read all of them, and page corrections are checked against the official
        source.
      </p>

      {/* The ONE working form (Sprint 0 Part 3, S0-5 A.1) — submits to the
          submit-message edge function; no third-party form scripts. */}
      <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
        <ContactForm />
      </div>

      <div className="mt-6 text-sm text-gray-600 space-y-2">
        <p>
          सीधे ईमेल करना पसंद करें? Prefer plain email?{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary font-medium hover:underline">
            {CONTACT_EMAIL}
          </a>
        </p>
        <div className="flex gap-4">
          <a href={siteConfig.telegramChannel} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Telegram Channel
          </a>
          <a href="https://twitter.com/IndianExamInfo" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Twitter / X
          </a>
        </div>
      </div>
    </div>
  );
}
