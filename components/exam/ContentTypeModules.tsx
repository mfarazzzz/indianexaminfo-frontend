/**
 * ContentTypeModules — Renders CMS content modules relevant to a specific content type tab.
 * Shared across all exam pillar content type pages.
 */
import { ContentModulesBlock } from "@/components/exam/EntityDetailPage";
import type { ContentType } from "@/types/exam";

/** Map each content type slug to the CMS module slugs that belong on that tab */
export const CT_TO_MODULES: Partial<Record<ContentType, string[]>> = {
  application:     ["application-process"],
  syllabus:        ["syllabus", "exam-pattern"],
  "admit-card":    ["admit-card"],
  result:          ["result"],
  cutoff:          ["cut-off"],
  "date-sheet":    ["date-sheet"],
  notification:    ["overview"],
};

interface Props {
  contentModules: Record<string, unknown> | undefined;
  contentType: string;
}

/**
 * Renders only the CMS modules relevant to the current content type tab.
 * Returns null if no matching modules are enabled or have content.
 */
export function ContentTypeModules({ contentModules, contentType }: Props) {
  if (!contentModules) return null;
  const relevantSlugs = CT_TO_MODULES[contentType as ContentType];
  if (!relevantSlugs?.length) return null;

  const filtered = Object.fromEntries([
    ["_config", {
      moduleOrder: relevantSlugs,
      enabledModules: relevantSlugs,
    }],
    ...Object.entries(contentModules).filter(([k]) => relevantSlugs.includes(k)),
  ]);

  return (
    <ContentModulesBlock
      contentModules={filtered}
      onlyTabModules={true}
    />
  );
}
