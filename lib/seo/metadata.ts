import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { env } from "@/config/env";
import { isTestSlug, TEST_SLUG_PREFIX } from "@/lib/testContent";
import type { BuildMetadataProps } from "@/types/seo";

const DEFAULT_OG_IMAGE = `${siteConfig.url}/api/og?title=${encodeURIComponent("IndianExamInfo — India's Most Trusted Exam Portal")}&type=default`;

/**
 * K2 — the layout's `title.template` ("%s | IndianExamInfo") is the ONLY place the brand
 * suffix is added, so a builder that was handed a title which already ends in it produced
 * "<page> | IndianExamInfo | IndianExamInfo" — measured live on an edition page: "UP Board
 * Class 10 (High School) 2026 — Cycle Details | IndianExamInfo | IndianExamInfo".
 * Two sources made that possible: a hard-coded suffix in lib/exam/editionDispatch.tsx and
 * any CMS-authored `seo_title` that arrives with the brand already appended (line 93 below
 * passes seo_title straight through). Rather than trust every caller, the suffix is removed
 * here once, and re-appended only by the template. A brand inside the sentence ("…
 * IndianExamInfo says…") is untouched: only a trailing delimiter + brand is stripped.
 */
const TRAILING_BRAND = /\s*[|\-–—:]\s*IndianExamInfo\s*$/i;
export function stripBrandSuffix(title: string): string {
  const out = title.replace(TRAILING_BRAND, "").trimEnd();
  return out === "" ? title.trim() : out;   // never blank a title down to nothing
}

export function buildExamMetadata({
  pageType,
  title,
  description,
  keywords = [],
  canonicalUrl,
  ogImage = DEFAULT_OG_IMAGE,
  ogAlt = "IndianExamInfo — India's Most Trusted Exam Portal",
  section,
  publishedAt,
  updatedAt,
  tags = [],
  noIndex = false,
  slug,
}: BuildMetadataProps): Metadata {
  // K2: the brand suffix belongs to the layout template, not to the caller.
  const metaTitle = stripBrandSuffix(title ?? siteConfig.name);
  const metaDesc = description ?? siteConfig.description;
  const isArticle = pageType === "blog-post" || pageType === "content-type";

  // A reference TEST record is always noindex/nofollow, whatever the caller
  // passed. Its page stays reachable by direct URL for the owner but must never
  // enter the index or a crawl. Detected from the explicit slug AND from the
  // canonical URL (a test page's own canonical always carries `/zz-test-`; a
  // real page's never does), so no per-route wiring is required. Static hub
  // pages pass neither → unaffected.
  const forceNoIndex =
    noIndex ||
    isTestSlug(slug) ||
    (typeof canonicalUrl === "string" && canonicalUrl.includes(`/${TEST_SLUG_PREFIX}`));

  const robots = forceNoIndex
    ? { index: false, follow: false }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1 as const,
          "max-image-preview": "large" as const,
          "max-snippet": -1 as const,
        },
      };

  return {
    // When a page supplies a title, emit it as a plain string so the root
    // layout's `%s | IndianExamInfo` template applies. Page titles from
    // buildSEOTitle() carry no brand suffix of their own.
    // With no title, fall back to the brand name absolutely (no double suffix).
    title: title ? metaTitle : { absolute: siteConfig.name },
    description: metaDesc,
    keywords: [...siteConfig.keywords, ...keywords],
    authors: [{ name: "IndianExamInfo Team" }],
    creator: "IndianExamInfo",
    publisher: "IndianExamInfo Media",

    alternates: {
      canonical: canonicalUrl,
      languages: {
        "en-IN": canonicalUrl,
      },
    },

    openGraph: {
      title: metaTitle,
      description: metaDesc,
      url: canonicalUrl,
      siteName: "IndianExamInfo",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: ogAlt,
        },
      ],
      locale: "en_IN",
      type: isArticle ? "article" : "website",
      ...(isArticle && {
        publishedTime: publishedAt,
        // D2 / PART 3: emit og:article:modified_time ONLY when a trustworthy
        // updatedAt exists; a false freshness date is worse than none.
        ...(updatedAt && { modifiedTime: updatedAt }),
        section: section ?? "Education",
        tags,
      }),
    },

    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitterHandle,
      creator: siteConfig.twitterHandle,
      title: metaTitle,
      description: metaDesc,
      images: [ogImage],
    },

    robots,

    verification: {
      google: env.GSC_VERIFY,
    },

    category: "Education",
    classification: "Education Information",
  };
}

export function buildHomepageMetadata(): Metadata {
  return {
    title: "IndianExamInfo — India's #1 Exam Portal | Sarkari Naukri, Entrance & Board Exams",
    description: siteConfig.description,
    keywords: [...siteConfig.keywords],
    alternates: {
      canonical: siteConfig.url,
    },
    openGraph: {
      title: "IndianExamInfo — India's Most Trusted Exam Information Portal",
      description: siteConfig.description,
      url: siteConfig.url,
      siteName: "IndianExamInfo",
      images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: "IndianExamInfo" }],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      site: siteConfig.twitterHandle,
      title: "IndianExamInfo — India's #1 Exam Portal",
      description: siteConfig.description,
      images: [DEFAULT_OG_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: { google: env.GSC_VERIFY },
  };
}
