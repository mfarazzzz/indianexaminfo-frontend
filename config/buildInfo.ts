/**
 * buildInfo.ts — the deployed commit SHA + build time, baked in at build via
 * next.config.ts `env`. Surfaced as a <meta name="build"> tag in the root
 * layout so "which commit is deployed?" is answerable from view-source, with no
 * route to remember and nothing visible to readers.
 */
export const BUILD_INFO = {
  /** Short commit SHA at build time, e.g. "0838df3". "unknown" if git was unavailable. */
  sha: process.env.NEXT_PUBLIC_BUILD_SHA ?? "unknown",
  /** ISO build timestamp. */
  time: process.env.NEXT_PUBLIC_BUILD_TIME ?? "",
  /** Relationship to origin/main at build: clean | ahead | behind | dirty | unknown. */
  sync: process.env.NEXT_PUBLIC_BUILD_SYNC ?? "unknown",
} as const;

/** One-line stamp for the <meta> content, e.g. "0838df3 clean 2026-09-13T14:32:00Z". */
export function buildStampString(): string {
  return `${BUILD_INFO.sha} ${BUILD_INFO.sync} ${BUILD_INFO.time}`.trim();
}
