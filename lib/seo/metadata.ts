import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { env } from "@/config/env";
import type { BuildMetadataProps } from "@/types/seo";

const DEFAULT_OG_IMAGE = `${siteConfig.url}/api/og?title=${encodeURIComponent("IndianExamInfo — India's Most Trusted Exam Portal")}&type=default`;

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
}: BuildMetadataProps): Metadata {
  const metaTitle = title ?? siteConfig.name;
  const metaDesc = description ?? siteConfig.description;
  const isArticle = pageType === "blog-post" || pageType === "content-type";

  const robots = noIndex
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
    title: {
      default: siteConfig.name,
      template: `%s | IndianExamInfo`,
    },
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
        modifiedTime: updatedAt,
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
