/** Freshness helpers — auto-update year signals, last-modified dates */

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function buildLastModifiedSignal(updatedAt: string): string {
  return new Date(updatedAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export function buildInformationAsOf(): string {
  return new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}
