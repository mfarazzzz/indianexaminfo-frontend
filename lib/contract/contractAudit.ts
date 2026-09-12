/**
 * Canonical-contract audit — PURE analysis logic (Phase 1, report-only).
 *
 * This module contains NO assertions and NO side effects. It takes the declared contract, the
 * module_registry snapshot (editor vocabulary), and a statically-extracted set of renderer field
 * reads, and returns a structured report of the six failure classes plus unresolved cases.
 *
 * The test (contract.coverage.test.ts) wires the REAL inputs and PRINTS the report without
 * asserting. The same functions are exercised by self-test fixtures to prove the classification
 * logic works. See CANONICAL_CONTRACT_CI_SPEC.md.
 *
 * IMPORTANT: this file does not change any runtime behaviour — nothing in the app imports it.
 */

export type Severity = "ERROR" | "WARNING" | "INFO";

export interface ContractModule {
  status?: "ACTIVE" | "DEPRECATED" | "LEGACY";
  class?: string;
  canonicalFact?: string;
  editorFields?: string[];
  rendererFields?: string[];
  rendererFallback?: Record<string, string[]>;
  deprecatedFields?: { key: string; renamedTo?: string; since?: string; reason?: string }[];
  legacyFields?: string[];
  forbiddenFields?: { key: string; reason: string }[];
  intentionallyUnrendered?: { key: string; reason: string }[];
  syncsTo?: string;
  mirrorOf?: string;
  generated?: boolean;
  note?: string;
}

export interface CanonicalFact {
  home: string;
  migration?: { phase: string; newHome?: string; compatibilityUntil?: string | null; removalCondition?: string };
}

/** A single, reviewable, dated known-baseline exception. NOT an ignore-all — every entry names
 *  the exact module+field+class it excuses, with a reason and an owner. A NEW violation not
 *  matched here is "new" and (in Phase 3) blocks. Removing/adding entries is a deliberate,
 *  reviewable diff. */
export interface BaselineEntry {
  module: string;
  field: string;
  cls: Finding["cls"];
  reason: string;
  owner: string;
  since: string;
}

export interface Contract {
  version: number;
  phase: number;
  canonicalFacts: Record<string, CanonicalFact>;
  systemKeys: string[];
  modules: Record<string, ContractModule>;
  /** Known, approved baseline findings (Phase 3). Narrow per-finding exceptions only. */
  baseline?: BaselineEntry[];
}

export interface RegistrySnapshot {
  modules: Record<string, string[]>;
}

/** A finding in one of the six classes (or an unresolved-analysis note). */
export interface Finding {
  cls:
    | "EDITOR_ONLY" // Class 1
    | "RENDERER_ONLY" // Class 2
    | "PERSISTED_ORPHAN" // Class 3 (data — not computed here in Phase 1)
    | "REGISTRY_MISMATCH" // Class 4
    | "UNDECLARED_RENAME" // Class 5
    | "COMPETING_SOURCE" // Class 6
    | "UNRESOLVED_DYNAMIC_ACCESS"
    | "UNRESOLVED_DESTRUCTURING";
  module: string;
  field?: string;
  severity: Severity;
  detail: string;
  /** True when this finding matches an approved baseline entry (known, non-blocking). */
  isBaseline?: boolean;
}

export interface AuditReport {
  modulesChecked: string[];
  findings: Finding[];
  summary: { errors: number; warnings: number; info: number };
}

const EMPTY_REASON = /\b(unused|not used yet|later|todo|tbd|empty|no data)\b/i;
export const isValidReason = (r: string | undefined): boolean =>
  !!r && r.trim().length >= 8 && !EMPTY_REASON.test(r);

/**
 * Static renderer-read extraction over a renderer source string. CONSERVATIVE by design — it
 * never claims complete coverage it cannot prove.
 *
 * COVERED (resolved to field names):
 *   - `d.foo` / `data.foo`            (property access)
 *   - `d?.foo` / `data?.foo`          (optional chaining — resolved to `foo`, NOT counted dynamic)
 *   - wrapped forms `safeHtml(data.foo)`, `str(d.foo)` (substring match still resolves `foo`)
 *
 * EXPLICITLY UNRESOLVED (reported via flags, never silently treated as covered):
 *   - `d[...]` / `data[...]`          → dynamic  (bracket access, literal or variable)
 *   - `const { foo } = data`          → destructuring  (fields NOT extracted; flagged)
 *   - helper indirection `getField(data, "foo")` → not resolvable; the `data` arg with no `.`
 *                                        or `[` is invisible to this extractor (documented limit)
 *
 * The critical invariant: if static analysis cannot prove what a renderer reads, that fact is
 * surfaced as `dynamic` or `destructuring`, so a module is never reported as fully covered when
 * it isn't.
 */
export function extractRendererReads(source: string): {
  fields: Set<string>;
  dynamic: boolean;
  destructuring: boolean;
} {
  const fields = new Set<string>();
  // property + optional-chaining access: d.foo / data.foo / d?.foo / data?.foo
  // The optional `\?` before the dot means `data?.foo` resolves to `foo` and is NOT double-counted
  // as dynamic (there is no bracket).
  const propRe = /\b(?:d|data)\??\.([A-Za-z_$][\w$]*)/g;
  let m: RegExpExecArray | null;
  while ((m = propRe.exec(source)) !== null) fields.add(m[1]);
  // dynamic bracket access: d[...] / data[...] / d?.[...] / data?.[...]
  // (matches an optional `?.` or bare `?` before the bracket)
  const dynamic = /\b(?:d|data)(?:\?\.|\?)?\[/.test(source);
  // destructuring from the module object: const { ... } = data|d  (also handles `= data;`/`= d;`)
  const destructuring = /(?:const|let|var)\s*\{[^}]*\}\s*=\s*(?:data|d)\b/.test(source);
  return { fields, dynamic, destructuring };
}

/**
 * Core analyzer. Pure. Given the contract, the registry snapshot, and a map of
 * module → renderer-read set (already extracted), produce the six-class report.
 *
 * Phase 1 semantics: PERSISTED_ORPHAN (Class 3) needs production data → NOT computed here
 * (reported as INFO "deferred to Phase 4"). UNDECLARED_RENAME (Class 5) is code-only and
 * conservative — only fires when a deprecated/renamed key is RE-ADDED to editorFields.
 */
export interface RendererReads {
  fields: Set<string>;
  dynamic: boolean;
  destructuring?: boolean;
}

export function analyze(
  contract: Contract,
  registry: RegistrySnapshot,
  rendererReadsByModule: Record<string, RendererReads>,
): AuditReport {
  const findings: Finding[] = [];
  const modulesChecked = Object.keys(contract.modules);

  for (const mod of modulesChecked) {
    const c = contract.modules[mod];
    const editor = new Set(c.editorFields ?? []);
    const declaredRenderer = new Set(c.rendererFields ?? []);
    const fallback = new Set(Object.values(c.rendererFallback ?? {}).flat());
    const deprecated = new Set((c.deprecatedFields ?? []).map((d) => d.key));
    const legacy = new Set(c.legacyFields ?? []);
    const unrendered = new Set((c.intentionallyUnrendered ?? []).map((u) => u.key));
    const system = new Set(contract.systemKeys);
    const reads = rendererReadsByModule[mod];

    // ── Class 4: registry (editor vocabulary) vs the contract's declared editorFields ──
    const regFields = registry.modules[mod];
    if (regFields === undefined) {
      findings.push({
        cls: "REGISTRY_MISMATCH", module: mod, severity: "WARNING",
        detail: `module in contract but not in module_registry snapshot`,
      });
    } else {
      const reg = new Set(regFields);
      const inContractNotReg = [...editor].filter((f) => !reg.has(f));
      const inRegNotContract = [...reg].filter((f) => !editor.has(f));
      for (const f of inContractNotReg)
        findings.push({ cls: "REGISTRY_MISMATCH", module: mod, field: f, severity: "ERROR",
          detail: `contract editorField not in module_registry snapshot` });
      for (const f of inRegNotContract)
        findings.push({ cls: "REGISTRY_MISMATCH", module: mod, field: f, severity: "ERROR",
          detail: `module_registry field not declared in contract editorFields` });
    }

    // ── Class 1: editor-only — declared editor field no renderer reads, not classified ──
    for (const f of editor) {
      const readByRenderer = declaredRenderer.has(f) || (reads?.fields.has(f) ?? false) || fallback.has(f);
      const excused = unrendered.has(f) || legacy.has(f) || deprecated.has(f) ||
        c.class === "editorial-for" || c.class === "mirror-of" || c.status === "DEPRECATED" || c.status === "LEGACY";
      if (!readByRenderer && !excused) {
        findings.push({ cls: "EDITOR_ONLY", module: mod, field: f, severity: "WARNING",
          detail: `editor can write it, no renderer reads it, no classification` });
      }
    }

    // ── Class 2: renderer-only — renderer reads a field nothing can produce ──
    // "producible" = editor field OR declared fallback OR declared derived/relational/system.
    if (reads) {
      for (const f of reads.fields) {
        const producible = editor.has(f) || fallback.has(f) || declaredRenderer.has(f) || system.has(f);
        if (!producible) {
          findings.push({ cls: "RENDERER_ONLY", module: mod, field: f, severity: "ERROR",
            detail: `renderer reads a field not in editorFields/fallback/derived — dead read or typo` });
        }
      }
      if (reads.dynamic) {
        findings.push({ cls: "UNRESOLVED_DYNAMIC_ACCESS", module: mod, severity: "INFO",
          detail: `renderer uses d[...]/data[...] dynamic access — field cannot be resolved statically` });
      }
      if (reads.destructuring) {
        findings.push({ cls: "UNRESOLVED_DESTRUCTURING", module: mod, severity: "INFO",
          detail: `renderer destructures the module object (const {..} = data) — fields cannot be resolved statically; coverage is NOT proven for this module` });
      }
    }

    // ── Class 5 (conservative): a deprecated/renamed key RE-ADDED to editorFields ──
    for (const dep of c.deprecatedFields ?? []) {
      if (editor.has(dep.key)) {
        findings.push({ cls: "UNDECLARED_RENAME", module: mod, field: dep.key, severity: "ERROR",
          detail: `field is marked deprecated (renamedTo ${dep.renamedTo ?? "?"}) but re-appears in editorFields` });
      }
    }

    // ── Class 6: competing source — a forbidden canonical field is present as an editor field ──
    for (const fb of c.forbiddenFields ?? []) {
      if (editor.has(fb.key)) {
        findings.push({ cls: "COMPETING_SOURCE", module: mod, field: fb.key, severity: "ERROR",
          detail: `forbidden: canonical for "${c.canonicalFact}" lives elsewhere. ${fb.reason}` });
      }
    }
  }

  // Mark findings that match an approved baseline entry (module+field+class). Baseline entries
  // are known/accepted and do NOT block; anything else is "new".
  const baseline = contract.baseline ?? [];
  for (const f of findings) {
    f.isBaseline = baseline.some(
      (b) => b.cls === f.cls && b.module === f.module && b.field === (f.field ?? ""),
    );
  }

  const summary = {
    errors: findings.filter((f) => f.severity === "ERROR").length,
    warnings: findings.filter((f) => f.severity === "WARNING").length,
    info: findings.filter((f) => f.severity === "INFO").length,
  };
  return { modulesChecked, findings, summary };
}

/** BLOCKING classes for Phase 3: a NEW (non-baseline) finding in one of these fails CI. */
export const BLOCKING_CLASSES: ReadonlySet<Finding["cls"]> = new Set([
  "COMPETING_SOURCE",
  "RENDERER_ONLY",
]);

/**
 * The Phase 3 gate. Returns the NEW blocking findings — a COMPETING_SOURCE or RENDERER_ONLY that
 * is NOT in the approved baseline. Baseline findings, UNRESOLVED (dynamic/destructuring),
 * EDITOR_ONLY, REGISTRY_MISMATCH, UNDECLARED_RENAME and all INFO are NOT returned here (they do
 * not block in this phase). An empty array means "safe to pass".
 */
export function newBlockingFindings(report: AuditReport): Finding[] {
  return report.findings.filter((f) => BLOCKING_CLASSES.has(f.cls) && !f.isBaseline);
}

/**
 * Slice a `const <name>: ... = ...` renderer body up to the NEXT top-level declaration
 * (`const`, `function`, or the leading `/** ` doc-comment). Prevents adjacent-function bleed —
 * the Phase 1 boundary bug (makeGenericEditorial is a `function`, not a `const`, so a `const`-only
 * boundary bled ApplicationProcessSummary into it). Pure + exported so it is unit-testable.
 */
export function sliceFunction(source: string, name: string): string {
  const start = source.indexOf(`const ${name}`);
  if (start === -1) return "";
  const rest = source.slice(start + name.length + 6);
  const nextDecl = rest.search(/\n(?:const [A-Za-z]|function [A-Za-z]|\/\*\*)/);
  return nextDecl === -1 ? rest : rest.slice(0, nextDecl);
}

/**
 * Slice a single `if (slug === "X") { ... }` branch (ContentModulesBlock) up to the next branch
 * (`if (slug === `) or the `// Generic fallback` marker. Keeps per-slug branch reads isolated so
 * one module's branch cannot contaminate another's field set.
 */
export function sliceBranch(source: string, slug: string): string {
  const marker = `if (slug === "${slug}")`;
  const start = source.indexOf(marker);
  if (start === -1) return "";
  const rest = source.slice(start + marker.length);
  const nextBranch = rest.search(/if \(slug === "|\/\/ Generic fallback/);
  return nextBranch === -1 ? rest : rest.slice(0, nextBranch);
}

/** Render the report as a human-readable string (used by the test's console output). */
export function formatReport(r: AuditReport): string {
  const byClass = (cls: Finding["cls"]) => r.findings.filter((f) => f.cls === cls);
  const lines: string[] = [];
  lines.push("CANONICAL CONTRACT AUDIT (Phase 3 — BLOCKING on NEW competing-source/renderer-only; baseline + others report-only)");
  lines.push(`Modules checked: ${r.modulesChecked.length} (${r.modulesChecked.join(", ")})`);
  const sections: [string, Finding["cls"]][] = [
    ["EDITOR_ONLY (Class 1, WARNING)", "EDITOR_ONLY"],
    ["RENDERER_ONLY (Class 2, ERROR)", "RENDERER_ONLY"],
    ["PERSISTED_ORPHAN (Class 3, deferred to Phase 4)", "PERSISTED_ORPHAN"],
    ["REGISTRY_MISMATCH (Class 4, ERROR)", "REGISTRY_MISMATCH"],
    ["UNDECLARED_RENAME (Class 5, ERROR)", "UNDECLARED_RENAME"],
    ["COMPETING_SOURCE (Class 6, ERROR)", "COMPETING_SOURCE"],
    ["UNRESOLVED_DYNAMIC_ACCESS (INFO)", "UNRESOLVED_DYNAMIC_ACCESS"],
    ["UNRESOLVED_DESTRUCTURING (INFO)", "UNRESOLVED_DESTRUCTURING"],
  ];
  for (const [label, cls] of sections) {
    const fs = byClass(cls);
    lines.push(`\n${label}: ${fs.length}`);
    for (const f of fs) lines.push(`  ${f.module}${f.field ? "." + f.field : ""} — ${f.detail}`);
  }
  lines.push(`\nSUMMARY  errors: ${r.summary.errors}  warnings: ${r.summary.warnings}  info: ${r.summary.info}`);
  const baselineCount = r.findings.filter((f) => f.isBaseline).length;
  lines.push(`PHASE 3: NEW ${[...BLOCKING_CLASSES].join("/")} findings block; ${baselineCount} baseline finding(s) allow-listed (non-blocking); other classes report-only`);
  return lines.join("\n");
}
