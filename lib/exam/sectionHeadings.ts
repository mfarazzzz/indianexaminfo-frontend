/**
 * sectionHeadings.ts — the ONE config behind every section heading on an exam page.
 *
 * Convention (owner decision, reference-pages review 23 Oct): each section heading
 * renders as `English / हिन्दी`, built from this table by `sectionHeading(slug)`.
 * No component may hardcode a heading string again — if a heading is not in this
 * table, the section is not a real section.
 *
 * Keyed by the CANONICAL registry slug (lib/sectionRegistry.ts). Editorial module
 * slugs that differ from the registry slug are listed in MODULE_SLUG_ALIASES, so
 * "vacancy-details" (content_modules) and "vacancy" (registry) resolve to the same
 * heading — the same reason they must share one heading on the page (see
 * lib/exam/sectionOwnership.ts).
 *
 * Hindi is plain, everyday exam-portal Hindi (the language readers use on Google),
 * not a literal translation. `use` is the Devanagari string itself; the English part
 * comes from SECTION_HEADINGS.en, which stays aligned with the registry `label`
 * unless a reader-friendlier wording is intended (then both repos read THIS table).
 */
import { SECTION_BY_SLUG } from "@/lib/sectionRegistry";

export interface HeadingPair {
  en: string;
  hi: string;
}

/** `English / हिन्दी`, the only heading form a reader sees on an exam page. */
export const HEADING_SEPARATOR = " / ";

export const SECTION_HEADINGS: Record<string, HeadingPair> = {
  // ── Main-page decision material ────────────────────────────────────────────
  "key-highlights":      { en: "Key Highlights",               hi: "मुख्य बिंदु" },
  "overview":            { en: "About This Exam",              hi: "परीक्षा के बारे में" },
  "important-dates":     { en: "Important Dates",              hi: "महत्वपूर्ण तारीखें" },
  "eligibility":         { en: "Eligibility",                  hi: "योग्यता" },
  "application-fee":     { en: "Application Fee",              hi: "आवेदन शुल्क" },
  "vacancy":             { en: "Vacancy Details",              hi: "रिक्तियाँ" },
  "application-process": { en: "Application Process",          hi: "आवेदन प्रक्रिया" },
  "selection-process":   { en: "Selection Process",            hi: "चयन प्रक्रिया" },
  "salary":              { en: "Salary & Pay Scale",           hi: "वेतन ढाँचा" },
  "age-limit":           { en: "Age Limit",                    hi: "आयु सीमा" },
  "admit-card":          { en: "Admit Card",                   hi: "प्रवेश पत्र" },
  "result":              { en: "Result",                       hi: "परिणाम" },
  "documents-required":  { en: "Documents Required",           hi: "आवश्यक दस्तावेज़" },
  "reservation":         { en: "Reservation Policy",           hi: "आरक्षण नीति" },
  "faqs":                { en: "Frequently Asked Questions",   hi: "अक्सर पूछे जाने वाले प्रश्न" },
  "academic-info":       { en: "Academic Information",         hi: "शैक्षणिक जानकारी" },

  // ── Selection-outcome sections ─────────────────────────────────────────────
  "merit-list":            { en: "Merit List",            hi: "मेरिट सूची" },
  "document-verification": { en: "Document Verification", hi: "दस्तावेज़ सत्यापन" },
  "interview-schedule":    { en: "Interview Schedule",    hi: "साक्षात्कार अनुसूची" },
  "final-selection":       { en: "Final Selection",       hi: "अंतिम चयन" },
  "seat-allotment":        { en: "Seat Allotment",        hi: "सीट आवंटन" },

  // ── Tab-only reference material ────────────────────────────────────────────
  "syllabus":           { en: "Syllabus",           hi: "पाठ्यक्रम" },
  "syllabus-weightage":  { en: "Syllabus & Weightage", hi: "पाठ्यक्रम और अंक बँटवारा" },
  "cut-off":            { en: "Cut Off Marks",      hi: "कटऑफ अंक" },
  "answer-key":         { en: "Answer Key",         hi: "उत्तर कुंजी" },
  "previous-papers":    { en: "Previous Papers",    hi: "पिछले प्रश्नपत्र" },
  "study-material":     { en: "Study Material",     hi: "अध्ययन सामग्री" },
  "news":               { en: "News & Updates",     hi: "समाचार और अपडेट" },
  "counselling":        { en: "Counselling",        hi: "काउंसलिंग प्रक्रिया" },
  "date-sheet":         { en: "Date Sheet",         hi: "समय-सारणी" },
  "exam-pattern":       { en: "Exam Pattern",       hi: "परीक्षा पैटर्न" },
  "revaluation":        { en: "Revaluation",        hi: "पुनर्मूल्यांकन" },
  "rechecking":         { en: "Rechecking",         hi: "पुनः जाँच" },
  "practical-exams":    { en: "Practical Exams",    hi: "व्यावहारिक परीक्षाएँ" },

  // ── Page furniture with a section heading ──────────────────────────────────
  "updates":         { en: "Updates",            hi: "अपडेट" },
  "latest-updates":  { en: "Latest Updates",     hi: "नए अपडेट" },
  "history":         { en: "History",            hi: "इतिहास" },
  "related-exams":   { en: "Related Exams",      hi: "संबंधित परीक्षाएँ" },
  "resources":       { en: "Resources & Downloads", hi: "संसाधन और डाउनलोड" },
  "quick-info":      { en: "Quick Information",  hi: "त्वरित जानकारी" },
  "important-links": { en: "Important Links",    hi: "महत्वपूर्ण लिंक" },
  "quick-links":     { en: "Quick Links",        hi: "त्वरित लिंक" },
  "tags":            { en: "Tags",               hi: "टैग" },
};

/**
 * content_modules slug → canonical registry slug, only where the two differ.
 * `vacancy-details` is the CMS module key; `vacancy` is the registry section and
 * the exams column concept. Both name ONE section on the page.
 */
export const MODULE_SLUG_ALIASES: Record<string, string> = {
  "vacancy-details": "vacancy",
  "how-to-apply": "application-process",
};

/** The canonical slug a heading/section lookup should use. */
export function canonicalSectionSlug(slug: string): string {
  return MODULE_SLUG_ALIASES[slug] ?? slug;
}

/** True when this slug has a configured heading pair. */
export function hasHeading(slug: string): boolean {
  return Boolean(SECTION_HEADINGS[canonicalSectionSlug(slug)]);
}

/**
 * The heading text for a section: `English / हिन्दी`.
 * Falls back to the registry label (English only) and then to the humanised slug —
 * a missing entry must never crash a reader's page, but the completeness test below
 * fails if a registry section or a known module has no Hindi pair.
 */
export function sectionHeading(slug: string): string {
  const key = canonicalSectionSlug(slug);
  const pair = SECTION_HEADINGS[key];
  if (pair) return `${pair.en}${HEADING_SEPARATOR}${pair.hi}`;
  const label = SECTION_BY_SLUG[key]?.label;
  if (label) return label;
  return key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** English half only — for places that must stay single-language (tab labels, aria). */
export function sectionHeadingEn(slug: string): string {
  return SECTION_HEADINGS[canonicalSectionSlug(slug)]?.en ?? SECTION_BY_SLUG[canonicalSectionSlug(slug)]?.label ?? slug;
}
