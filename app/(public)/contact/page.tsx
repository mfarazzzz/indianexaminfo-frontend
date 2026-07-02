import type { Metadata } from "next";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { buildExamMetadata } from "@/lib/seo/metadata";
import { GLOBAL_SHORT_TAIL } from "@/lib/seo/keywords";
import { siteConfig } from "@/config/site";

export const revalidate = 604800;

export const metadata: Metadata = buildExamMetadata({
  pageType: "static",
  title: "Contact IndianExamInfo — Reach Out to Our Team",
  description: "Contact the IndianExamInfo team for corrections, feedback, advertising inquiries or partnership opportunities.",
  keywords: ["contact indianexaminfo", ...GLOBAL_SHORT_TAIL.slice(0, 3)],
  canonicalUrl: `${siteConfig.url}/contact`,
});

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Breadcrumb items={[{ name: "Contact", href: "/contact" }]} />
      <h1 className="font-heading font-bold text-2xl text-gray-900 mt-4 mb-2">Contact Us</h1>
      <p className="text-sm text-gray-500 mb-6">{siteConfig.organization.name} · New Delhi, India</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[
          { label: "Editorial Corrections", desc: "Report incorrect exam information or dates", icon: "✏️" },
          { label: "Advertise With Us", desc: "Ad placement and sponsorship opportunities", icon: "📢" },
          { label: "Content Partnership", desc: "Colleges, coaching institutes, publishers", icon: "🤝" },
          { label: "General Feedback", desc: "Suggestions to improve IndianExamInfo", icon: "💬" },
        ].map((item) => (
          <div key={item.label} className="bg-card border border-border rounded p-4">
            <div className="text-2xl mb-2">{item.icon}</div>
            <p className="font-semibold text-gray-800 text-sm">{item.label}</p>
            <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded p-6">
        <h2 className="font-heading font-semibold text-base text-gray-900 mb-4">Send a Message</h2>
        <form className="space-y-4" aria-label="Contact form">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input id="name" name="name" type="text" required className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors" placeholder="Your name" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="email" name="email" type="email" required className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors" placeholder="your@email.com" />
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select id="subject" name="subject" className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors bg-white">
              <option>Editorial Correction</option>
              <option>Advertising Inquiry</option>
              <option>Content Partnership</option>
              <option>General Feedback</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea id="message" name="message" rows={5} required className="w-full border border-border rounded px-3 py-2 text-sm outline-none focus:border-primary transition-colors resize-none" placeholder="Describe your query..."></textarea>
          </div>
          <button type="submit" className="bg-primary text-white px-6 py-2.5 rounded text-sm font-semibold hover:bg-primary-600 transition-colors">
            Send Message
          </button>
        </form>
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <p>Also reach us on:</p>
        <div className="flex gap-4 mt-2">
          <a href={siteConfig.telegramChannel} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Telegram Channel</a>
          <a href={`https://twitter.com/IndianExamInfo`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Twitter / X</a>
        </div>
      </div>
    </div>
  );
}
