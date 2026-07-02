import { siteConfig } from "@/config/site";
import type { ExamEntity, ContentPost } from "@/types/exam";
import type { BlogPost } from "@/types/blog";

const SITE_URL = siteConfig.url;
const LOGO_URL = `${SITE_URL}/icons/logo.png`;

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.organization.name,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: LOGO_URL,
      width: 300,
      height: 60,
    },
    sameAs: [
      `https://twitter.com/IndianExamInfo`,
      siteConfig.telegramChannel,
      siteConfig.youtubeChannel,
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      availableLanguage: ["English", "Hindi"],
    },
  };
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildArticleSchema(
  post: BlogPost | ContentPost,
  url: string,
  authorUrl: string
) {
  const isBlogPost = "author" in post && typeof (post as BlogPost).author === "object";
  const authorName = isBlogPost
    ? ((post as BlogPost).author?.name ?? "IndianExamInfo Team")
    : ((post as ContentPost).author ?? "IndianExamInfo Team");
  const authorDesignation = isBlogPost
    ? ((post as BlogPost).author?.designation ?? "")
    : "";

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: authorName,
      ...(authorDesignation && { jobTitle: authorDesignation }),
      url: authorUrl,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: LOGO_URL },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: "en-IN",
    wordCount: "wordCount" in post ? (post as BlogPost).wordCount : undefined,
  };
}

export function buildJobPostingSchema(exam: ExamEntity) {
  const notificationDate = exam.dates.find((d) => d.label === "Notification")?.date;
  const endDate = exam.dates.find((d) => d.label === "Application End")?.date;

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: exam.name,
    description: exam.seoDescription ?? exam.name,
    hiringOrganization: {
      "@type": "Organization",
      name: exam.conductingBody,
      sameAs: exam.officialWebsite,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "IN",
      },
    },
    employmentType: "FULL_TIME",
    ...(notificationDate && { datePosted: notificationDate }),
    ...(endDate && { validThrough: endDate }),
    ...(exam.vacancy && { totalJobOpenings: exam.vacancy }),
    applicantLocationRequirements: {
      "@type": "Country",
      name: "India",
    },
  };
}

export function buildEventSchema(exam: ExamEntity) {
  const examDate = exam.dates.find(
    (d) =>
      d.label.toLowerCase().includes("exam") ||
      d.label.toLowerCase().includes("date")
  )?.date;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${exam.name} 2025`,
    ...(examDate && { startDate: examDate }),
    location: {
      "@type": "VirtualLocation",
      url: exam.officialWebsite,
    },
    organizer: {
      "@type": "Organization",
      name: exam.conductingBody,
    },
    eventStatus: "EventScheduled",
    eventAttendanceMode: "MixedEventAttendanceMode",
  };
}

export function buildHowToSchema(
  title: string,
  steps: { title: string; description: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: title,
    step: steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.title,
      text: step.description,
    })),
  };
}

export function buildCourseSchema(exam: ExamEntity, contentType: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${exam.name} Complete ${contentType}`,
    description: `Free ${contentType} for ${exam.name} preparation`,
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
    },
  };
}

export function buildDatasetSchema(
  exam: ExamEntity,
  dates: { label: string; date: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${exam.name} Important Dates 2025`,
    description: `Official important dates for ${exam.name} 2025`,
    creator: {
      "@type": "Organization",
      name: siteConfig.name,
    },
    dateModified: exam.lastUpdated,
    variableMeasured: dates.map((d) => d.label),
  };
}
