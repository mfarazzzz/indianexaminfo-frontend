/**
 * sarkari/categories.ts — display-name map for sarkari_naukri.category slugs.
 *
 * The `sarkari_naukri` table stores a free-text `category` slug (e.g. "asha-nhm",
 * "zila-parishad", "group-d"). Title-casing the slug alone produces wrong labels
 * like "Asha Nhm". This map gives each known category a correct human label and is
 * the ONE source of truth for category display names + the /sarkari-naukri/{category}
 * listing route.
 *
 * Keep in sync with the distinct values of sarkari_naukri.category. Unknown slugs
 * fall back to a title-cased form so a new category still renders sanely.
 */

export const SARKARI_CATEGORY_LABELS: Record<string, string> = {
  "anganwadi": "Anganwadi Recruitment",
  "asha-nhm": "ASHA / NHM (National Health Mission)",
  "panchayat": "Panchayat Jobs",
  "zila-parishad": "Zila Parishad Jobs",
  "block-office": "Block Office Jobs",
  "municipal": "Municipal Corporation Jobs",
  "hospital": "Hospital & Health Jobs",
  "medical": "Medical Jobs",
  "health": "Health Department Jobs",
  "driver": "Driver Recruitment",
  "revenue": "Revenue Department Jobs",
  "court": "Court & Judiciary Jobs",
  "postal": "Postal Department Jobs",
  "banking": "Banking Jobs",
  "insurance": "Insurance Jobs",
  "forest": "Forest Department Jobs",
  "railway": "Railway Jobs",
  "school": "School Jobs",
  "college": "College Jobs",
  "teaching": "Teaching Jobs",
  "group-d": "Group D Jobs",
  "irrigation": "Irrigation Department Jobs",
  "electricity": "Electricity Board Jobs",
  "power-utility": "Power & Utility Jobs",
  "state-psc": "State PSC Jobs",
  "ssc": "SSC Jobs",
  "upsc": "UPSC Jobs",
  "civil-services": "Civil Services",
  "agriculture": "Agriculture Department Jobs",
  "animal-husbandry": "Animal Husbandry Jobs",
  "home-guard": "Home Guard Recruitment",
  "cooperative": "Cooperative Department Jobs",
  "defence": "Defence Jobs",
  "paramilitary": "Paramilitary Jobs",
  "police": "Police Recruitment",
  "jail": "Jail / Prison Department Jobs",
  "psu": "PSU Jobs",
  "engineering": "Engineering Jobs",
  "scientific": "Scientific & Research Jobs",
  "regulatory": "Regulatory Body Jobs",
};

/** Title-case fallback for slugs not in the map (e.g. "new-dept" -> "New Dept"). */
function titleCaseSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** The one place that turns a sarkari category slug into a display label. */
export function sarkariCategoryLabel(slug: string): string {
  return SARKARI_CATEGORY_LABELS[slug] ?? titleCaseSlug(slug);
}
