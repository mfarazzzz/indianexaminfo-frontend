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
