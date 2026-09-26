// pillarUrl.ts — THE single source of truth mapping a DB `pillar` value to the
// public URL segment it lives under. The DB pillar value never changes; only the
// public path does. Every URL emitter (getExamEntityHref, EntityDetailPage's
// content-type links, sitemap, the search API) MUST route through here so the
// mapping exists exactly once and can never drift.
//
// Mappings:
//   entrance-exam              → "admission"       (the pillar's public home is /admission)
//   government-exam|govt-vacancy → "sarkari-naukri" (dead roots collapse to one live root)
//   everything else            → the pillar value unchanged (board-exam, university-exam, …)
//
// This is the frontend's authority. The CMS does NOT mirror it: CMS "View on site"
// links go to /go/{slug}, a frontend route handler that looks the record up and
// 308s to its canonical URL built with this same function — so the fact lives in
// one repo only.

export function pillarToUrlSegment(pillar: string): string {
  switch (pillar) {
    case "entrance-exam":
      return "admission";
    case "government-exam":
    case "govt-vacancy":
    case "sarkari-naukri":  // legacy alias — already the target
    case "sarkari-bharti":  // legacy alias for a recruitment pillar
      return "sarkari-naukri";
    case "board-exam":
    case "board-university": // legacy alias for the board pillar
      return "board-exam";
    default:
      return pillar;
  }
}
