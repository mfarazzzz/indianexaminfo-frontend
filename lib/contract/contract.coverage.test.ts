import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  analyze,
  extractRendererReads,
  formatReport,
  newBlockingFindings,
  sliceFunction,
  sliceBranch,
  type Contract,
  type RegistrySnapshot,
  type RendererReads,
} from "@/lib/contract/contractAudit";
import contractJson from "@/lib/contract/canonical-data-contract.json";
import registryJson from "@/lib/contract/module-registry.snapshot.json";

/**
 * PHASE 3 — BLOCKING (narrow). This test computes the canonical-contract audit against the real
 * contract, the module_registry snapshot, and a conservative static extraction of renderer field
 * reads. It PRINTS the full report (visibility) and BLOCKS on exactly two things:
 *   1. a NEW (non-baseline) COMPETING_SOURCE or RENDERER_ONLY finding;
 *   2. a contract module with a ContentModulesBlock branch not covered by the audit;
 *   3. a structurally-inconsistent or >90-day-stale registry snapshot.
 * Everything else (EDITOR_ONLY, REGISTRY_MISMATCH, UNDECLARED_RENAME, UNRESOLVED dynamic/
 * destructuring, all INFO) remains report-only/non-blocking. See CANONICAL_CONTRACT_CI_SPEC.md.
 *
 * See CANONICAL_CONTRACT_CI_SPEC.md. No DB access, no network, no production data.
 */

const contract = contractJson as unknown as Contract;
const registry = registryJson as unknown as RegistrySnapshot;

// ── SURFACE 1: sectionRenderers.tsx named renderer functions ────────────────────────────────
// Map each contract module → the renderer function(s) that read its content in
// components/exam/sectionRenderers.tsx. Conservative: we slice the source for each named function
// and extract reads from that slice only, so one renderer's reads aren't mis-attributed.
const RENDERER_FUNCTIONS: Record<string, string[]> = {
  overview: ["OverviewSummary"],
  eligibility: [], // sectionRenderers has no eligibility module renderer (see SURFACE 2)
  "important-dates": [], // rendered from exam_editions.important_dates column (mirror)
  result: ["ResultModule"],
  "admit-card": ["AdmitCardModule"],
  "exam-pattern": ["ExamPatternModule"],
  "vacancy-details": [], // not enabled/rendered for exam pages
  syllabus: [], // rendered from exam_syllabus_subjects relational table
  "application-process": ["ApplicationProcessSummary"],
};

// ── SURFACE 2: EntityDetailPage.tsx ContentModulesBlock per-slug branches (Phase 2 blind-spot fix)
// ContentModulesBlock has module-specific `if (slug === "X") { ... }` branches that read module
// fields on the bespoke CT tab pages — a SECOND render surface Phase 1 missed. We scan each branch
// in isolation (slice `if (slug === "X")` up to the next `if (slug === ` or the generic fallback),
// so reads stay module-specific and don't contaminate other modules.
const CONTENT_BLOCK_BRANCHES: string[] = ["eligibility", "application-process", "overview", "faqs", "news"];

function readFile(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
}

function mergeInto(dst: RendererReads, src: RendererReads): void {
  src.fields.forEach((f) => dst.fields.add(f));
  dst.dynamic = dst.dynamic || src.dynamic;
  dst.destructuring = dst.destructuring || !!src.destructuring;
}

function rendererReadsByModule(): Record<string, RendererReads> {
  const sectionSrc = readFile("../../components/exam/sectionRenderers.tsx");
  const entitySrc = readFile("../../components/exam/EntityDetailPage.tsx");
  const out: Record<string, RendererReads> = {};
  for (const mod of Object.keys(contract.modules)) {
    const merged: RendererReads = { fields: new Set<string>(), dynamic: false, destructuring: false };
    // Surface 1: named functions in sectionRenderers.tsx
    for (const fn of RENDERER_FUNCTIONS[mod] ?? []) {
      mergeInto(merged, extractRendererReads(sliceFunction(sectionSrc, fn)));
    }
    // Surface 2: ContentModulesBlock branch in EntityDetailPage.tsx (if this module has one)
    if (CONTENT_BLOCK_BRANCHES.includes(mod)) {
      mergeInto(merged, extractRendererReads(sliceBranch(entitySrc, mod)));
    }
    out[mod] = merged;
  }
  return out;
}

/** Deterministically discover every `if (slug === "X")` branch in ContentModulesBlock. No AST —
 *  a simple global regex over the source. Used to PROVE the manual CONTENT_BLOCK_BRANCHES map is
 *  complete for contract modules (a new branch cannot silently escape auditing). */
function discoverBranchSlugs(): string[] {
  const src = readFile("../../components/exam/EntityDetailPage.tsx");
  const re = /if \(slug === "([a-z0-9-]+)"\)/g;
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) found.add(m[1]);
  return [...found];
}

describe("Canonical contract audit — Phase 3 (BLOCKING, narrow)", () => {
  it("snapshot: internally consistent AND not older than 90 days (staleness must be visible, not silent)", () => {
    const snap = registryJson as unknown as { moduleCount?: number; capturedAt?: string; modules: Record<string, string[]> };
    const keyCount = Object.keys(snap.modules).length;
    const ageDays = snap.capturedAt ? (Date.now() - new Date(snap.capturedAt).getTime()) / 86_400_000 : Infinity;
    // eslint-disable-next-line no-console
    console.log(`\nSNAPSHOT: capturedAt=${snap.capturedAt ?? "?"} ageDays=${Math.round(ageDays)} moduleCount=${snap.moduleCount ?? "?"} keys=${keyCount}`);
    // Internal consistency (catches a partial/corrupt edit).
    expect(snap.moduleCount).toBe(keyCount);
    // Staleness (does NOT prove freshness vs the live DB — a manual read-only refresh does that —
    // but makes an old snapshot a VISIBLE failure rather than silent drift).
    expect(ageDays, `module-registry.snapshot.json is >90 days old (capturedAt=${snap.capturedAt}). Refresh it read-only from the live registry (see CANONICAL_CONTRACT_CI_SPEC.md) and update capturedAt.`).toBeLessThan(90);
  });

  it("branch coverage: every contract module with a ContentModulesBlock branch is audited", () => {
    const discovered = discoverBranchSlugs();
    const contractModules = new Set(Object.keys(contract.modules));
    // A discovered branch for a CONTRACT module must be in CONTENT_BLOCK_BRANCHES (i.e. scanned).
    const missed = discovered.filter((slug) => contractModules.has(slug) && !CONTENT_BLOCK_BRANCHES.includes(slug));
    expect(
      missed,
      `ContentModulesBlock has if(slug===...) branch(es) for contract module(s) [${missed.join(", ")}] ` +
        `that are NOT in CONTENT_BLOCK_BRANCHES — the audit would silently miss that render surface. ` +
        `Add them to CONTENT_BLOCK_BRANCHES in contract.coverage.test.ts.`,
    ).toEqual([]);
  });

  it("runs the audit, prints the report, and BLOCKS on NEW competing-source / renderer-only findings only", () => {
    const reads = rendererReadsByModule();
    const report = analyze(contract, registry, reads);

    // eslint-disable-next-line no-console
    console.log("\n" + formatReport(report) + "\n");

    // Sanity: audit ran and covered the declared modules.
    expect(report.modulesChecked.length).toBe(Object.keys(contract.modules).length);

    // THE Phase 3 gate: NEW (non-baseline) COMPETING_SOURCE or RENDERER_ONLY findings block.
    // Baseline findings (the known GDS vacancy conflict), UNRESOLVED dynamic/destructuring,
    // EDITOR_ONLY, REGISTRY_MISMATCH, UNDECLARED_RENAME, and all INFO do NOT block.
    const blocking = newBlockingFindings(report);
    const describe = (fs: typeof blocking) =>
      fs.map((f) => `${f.cls} ${f.module}.${f.field ?? ""} — ${f.detail}`).join("\n  ");
    expect(
      blocking,
      blocking.length
        ? `NEW blocking contract violation(s) introduced (not in the approved baseline):\n  ${describe(blocking)}\n` +
          `Either fix the code/contract, or (if intentional and reviewed) add a dated baseline entry ` +
          `to canonical-data-contract.json with a reason + owner.`
        : "no new blocking findings",
    ).toEqual([]);
  });
});
