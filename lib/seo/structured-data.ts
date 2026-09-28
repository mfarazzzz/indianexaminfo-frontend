import { siteConfig } from "@/config/site";
import { findDateByType } from "@/lib/exam/actionLinks";
import type { ExamEntity, ExamStatus, ContentPost } from "@/types/exam";
import type { BlogPost } from "@/types/blog";
import type { SarkariNaukriItem } from "@/services/sarkariNaukriService";
import { deriveVacancyStatus } from "@/lib/sarkari/deriveStatus";
import { meaningfulFaqs } from "@/lib/sectionRegistry";

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
  // Same rule as the visible section and hasData (lib/sectionRegistry.meaningfulFaqs):
  // an entry whose answer is empty or a lone placeholder token is not emitted into
  // the FAQPage JSON-LD, so markup never advertises a non-answer to Google.
  const real = meaningfulFaqs(faqs);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: real.map((faq) => ({
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

/**
 * Statuses where a recruitment is genuinely OPEN for applications — read from the
 * SAME derived status the lead block and action links use (never a new check).
 *   registration-open: the confirmed application window contains today.
 *   active: editorial "open now" override.
 * Deliberately EXCLUDED and why (Google's stale-job manual action targets jobs
 * shown as open that are not):
 *   notified  — the notification is out but the application window has not opened
 *               (app_open is null or future), so it is not open for applications.
 *   upcoming / dates-awaited / ongoing / admit-card-out / result-* / completed /
 *   registration-closed / postponed / cancelled — the window is not accepting.
 */
const OPEN_FOR_APPLICATION: ReadonlySet<ExamStatus> = new Set<ExamStatus>([
  "registration-open",
  "active",
]);

/**
 * JobPosting for a government-exam entity page. Returns null (emit NO markup) unless
 * BOTH hold — because for Google Jobs an incomplete or stale JobPosting is worse
 * than none:
 *   (a) the recruitment is open for applications (derived status), and
 *   (b) datePosted (REQUIRED by Google) resolves to a real notification date.
 * validThrough (the application close date) is added whenever one exists — it is how
 * an open posting later expires, so omitting it leaves the job looking open forever.
 * Both dates resolve through the shared by-type resolver (findDateByType) — the same
 * rule pickDisplayDate uses — never a second resolver and never a raw label string
 * (the old bug: `label === "Notification"` matched only 34/101 and "Application End"
 * matched 0/101, so validThrough was empty on every page).
 */
export function buildJobPostingSchema(exam: ExamEntity) {
  if (!OPEN_FOR_APPLICATION.has(exam.status)) return null;

  const datePosted = findDateByType(exam.dates, ["notification"])?.date;
  if (!datePosted) return null; // REQUIRED field unresolvable → no markup.
  const validThrough = findDateByType(exam.dates, ["application_end"])?.date;

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: exam.name,
    description: exam.seoDescription ?? exam.name,
    hiringOrganization: {
      "@type": "Organization",
      name: exam.conductingBody,
      ...(exam.officialWebsite && { sameAs: exam.officialWebsite }),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "IN",
      },
    },
    employmentType: "FULL_TIME",
    datePosted,
    ...(validThrough && { validThrough }),
    ...(exam.vacancy && { totalJobOpenings: exam.vacancy }),
    applicantLocationRequirements: {
      "@type": "Country",
      name: "India",
    },
  };
}

/**
 * JobPosting schema for rows from the `sarkari_naukri` table.
 *
 * DISTINCT from buildJobPostingSchema(), which maps an ExamEntity. These are
 * the actual job-detail pages (/sarkari-naukri/{slug}).
 *
 * Gate (all conditions must hold):
 *   1. Status derived from dates = "registration-open" (shared deriveVacancyStatus).
 *   2. datePosted (REQUIRED) = notificationDate; no markup if absent.
 *   3. validThrough = applicationEndDate so the posting expires naturally.
 *   4. verifiedAt is non-null (editor confirmed against official notification).
 *   5. officialNotificationUrl is non-null (source of truth linked).
 *
 * Deliberately does NOT read item.status (the stored column is 98.6% wrong).
 * Uses the shared date-derived status from deriveVacancyStatus.
 */
export function buildSarkariJobPostingSchema(
  item: SarkariNaukriItem,
  url: string,
  todayISO: string
) {
  // Gate: must be in registration-open state (derived from dates).
  const status = deriveVacancyStatus(item, todayISO);
  if (status !== "registration-open") return null;

  const datePosted = item.notificationDate?.slice(0, 10);
  const validThrough = item.applicationEndDate?.slice(0, 10);

  // Required fields must exist.
  if (!datePosted || !validThrough) return null;

  // Verification gate: editor must have verified + provided official link.
  if (!item.verifiedAt) return null;
  if (!item.officialNotificationUrl) return null;

  const isAllIndia = !item.state || item.state === "all-india";
  const stateName = item.state
    ? item.state.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: item.title,
    description: item.description || item.seoDescription || item.title,
    identifier: {
      "@type": "PropertyValue",
      name: item.organization,
      value: item.slug,
    },
    hiringOrganization: {
      "@type": "Organization",
      name: item.organization,
      ...(item.department && { department: { "@type": "Organization", name: item.department } }),
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "IN",
        ...(!isAllIndia && stateName && { addressRegion: stateName }),
      },
    },
    employmentType: "FULL_TIME",
    datePosted,
    validThrough,
    ...(item.vacancyCount && { totalJobOpenings: item.vacancyCount }),
    ...(item.payScale && {
      baseSalary: {
        "@type": "MonetaryAmount",
        currency: "INR",
        value: { "@type": "QuantitativeValue", value: item.payScale },
      },
    }),
    ...(item.eligibility && { educationRequirements: item.eligibility }),
    ...(item.applicationUrl && { directApply: false, url: item.applicationUrl }),
    applicantLocationRequirements: {
      "@type": "Country",
      name: "India",
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: "en-IN",
  };
}
