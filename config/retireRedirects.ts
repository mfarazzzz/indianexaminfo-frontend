/**
 * retireRedirects.ts — permanent 308s that retire a duplicate exam page in
 * favour of ONE canonical page per exam (owner decision, Oct 2026).
 *
 * Kept as data (not inline in next.config.ts) so a unit test can prove the
 * invariants without importing next.config (which runs git at load). next.config
 * spreads these with `permanent: true`.
 *
 * The loser PAGES keep their old (indexed) URLs pointing here; the loser RECORDS
 * are unpublished separately (Phase 2, owner-gated). Winners stay published.
 *
 * NOTE: NDA / CDS / UGC NET run twice a year (I/II, June/December) — the two
 * records were different CYCLES of one exam, so we consolidate to the winner's
 * canonical URL and the winner carries both cycles' dates. UPSC CMS / RPF are
 * single-cycle duplicates.
 */
export interface RetireRedirect { source: string; destination: string }

export const RETIRE_REDIRECTS: RetireRedirect[] = [
  // UPSC CMS — year-suffixed seed → the evergreen slug.
  { source: "/sarkari-naukri/central-government-jobs/upsc-cms-examination-2026", destination: "/sarkari-naukri/upsc/upsc-cms" },
  // CDS — entrance twin → the government/defence page.
  { source: "/admission/defence-entrance/cds", destination: "/sarkari-naukri/defence/cds-exam" },
  // NDA — entrance twin → the government/defence page.
  { source: "/admission/defence-entrance/nda", destination: "/sarkari-naukri/defence/nda-exam" },
  // UGC NET — government/teaching twin → the entrance/research-fellowships page (consistent with CSIR NET).
  { source: "/sarkari-naukri/teaching/nta-ugc-net", destination: "/admission/research-fellowships/ugc-net" },
  // RPF Constable & SI — empty (SI) stub → the populated combined record.
  { source: "/sarkari-naukri/railways/rpf-constable-si-recruitment", destination: "/sarkari-naukri/railways/rpf-constable" },
];

/** The winner slugs — used by the test to assert every destination is a real,
 *  intended canonical page (never a loser / never a chain). */
export const RETIRE_WINNER_SLUGS: string[] = ["upsc-cms", "cds-exam", "nda-exam", "ugc-net", "rpf-constable"];
