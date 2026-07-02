import { siteConfig } from "@/config/site";

/**
 * Build an Open Graph image URL.
 * For now returns static default; later replace with dynamic /api/og route.
 */
export function buildOgImageUrl(params?: {
  title?: string;
  type?: "exam" | "blog" | "result" | "admit-card" | "default";
}): string {
  const type = params?.type ?? "default";

  // Static pre-generated OG images per type
  const staticImages: Record<string, string> = {
    exam:        `${siteConfig.url}/images/og/og-exam.jpg`,
    blog:        `${siteConfig.url}/images/og/og-blog.jpg`,
    result:      `${siteConfig.url}/images/og/og-result.jpg`,
    "admit-card": `${siteConfig.url}/images/og/og-admit-card.jpg`,
    default:     `${siteConfig.url}/images/og/og-default.jpg`,
  };

  return staticImages[type] ?? staticImages.default;
}

/**
 * Alt text formula: "[Exam] [ContentType] [Year] — [ShortDesc]"
 * e.g. "IBPS PO Admit Card 2025 — Download Hall Ticket"
 */
export function buildOgAlt(examName: string, contentType: string, year = "2025"): string {
  return `${examName} ${contentType} ${year} — IndianExamInfo`;
}
