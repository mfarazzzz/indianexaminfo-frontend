/**
 * unverifiedMarker.ts — the ONE copy of the "not yet verified by our editors" nudge
 * a reader may trust, used by the homepage deadline bands (strip + sidebar).
 *
 * Bilingual per the reference-page heading convention (lib/exam/sectionHeadings):
 * `English / हिन्दी`, joined by the shared separator so a future wording change edits
 * one place. It is a MUTED, non-alarming marker shown on every row whose exam does NOT
 * carry the all-three verification — never on a verified row.
 */
import { HEADING_SEPARATOR } from "@/lib/exam/sectionHeadings";

export const UNVERIFIED_MARKER_EN = "Check official notice";
export const UNVERIFIED_MARKER_HI = "आधिकारिक सूचना देखें";

/** `Check official notice / आधिकारिक सूचना देखें` — the marker text. */
export const UNVERIFIED_MARKER = `${UNVERIFIED_MARKER_EN}${HEADING_SEPARATOR}${UNVERIFIED_MARKER_HI}`;

/**
 * The BAND-level caption (owner polish, 24 Oct). When EVERY row of a band is unverified,
 * the band shows this ONE caption under its title instead of a marker on every row — the
 * same fact stated once, not repeated per line. Mixed bands keep the per-row marker.
 */
export const BAND_UNVERIFIED_CAPTION_EN = "Verify with the official notice";
export const BAND_UNVERIFIED_CAPTION_HI = "आधिकारिक सूचना से मिलाएँ";
export const BAND_UNVERIFIED_CAPTION = `${BAND_UNVERIFIED_CAPTION_EN}${HEADING_SEPARATOR}${BAND_UNVERIFIED_CAPTION_HI}`;
