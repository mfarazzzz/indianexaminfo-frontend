import { describe, it, expect } from "vitest";
import {
  analyze,
  extractRendererReads,
  isValidReason,
  newBlockingFindings,
  sliceFunction,
  sliceBranch,
  type Contract,
  type RegistrySnapshot,
} from "@/lib/contract/contractAudit";

/**
 * SELF-TESTS for the audit classification LOGIC. These use SYNTHETIC fixtures (not the real
 * repo) and DO assert — they verify the analyzer classifies each of the 20 scenarios correctly.
 * This is how Phase 1 proves the mechanism works without making the real repo's baseline
 * findings fail the build. See CANONICAL_CONTRACT_CI_SPEC.md §14.
 */

const noReads = () => ({ fields: new Set<string>(), dynamic: false });
const reads = (...f: string[]) => ({ fields: new Set(f), dynamic: false });

function run(
  modules: Contract["modules"],
  registryModules: Record<string, string[]>,
  readsByModule: Record<string, { fields: Set<string>; dynamic: boolean }>,
  canonicalFacts: Contract["canonicalFacts"] = {},
  baseline: Contract["baseline"] = [],
) {
  const contract: Contract = { version: 1, phase: 3, canonicalFacts, systemKeys: ["_meta", "_config"], modules, baseline };
  const registry: RegistrySnapshot = { modules: registryModules };
  return analyze(contract, registry, readsByModule);
}

const has = (r: ReturnType<typeof analyze>, cls: string, field?: string) =>
  r.findings.some((f) => f.cls === cls && (field === undefined || f.field === field));

describe("extractRendererReads", () => {
  it("captures d.foo and data.bar property reads", () => {
    const { fields } = extractRendererReads("const x = safeHtml(d.body) || data.summary;");
    expect(fields.has("body")).toBe(true);
    expect(fields.has("summary")).toBe(true);
  });
  it("flags dynamic d[...] access and does not invent a field", () => {
    const { fields, dynamic } = extractRendererReads("const v = d[key];");
    expect(dynamic).toBe(true);
    expect(fields.size).toBe(0);
  });
  it("resolves optional chaining data?.foo to `foo` and does NOT count it as dynamic", () => {
    const { fields, dynamic } = extractRendererReads("const v = data?.releaseDate; const w = d?.checkLink;");
    expect(fields.has("releaseDate")).toBe(true);
    expect(fields.has("checkLink")).toBe(true);
    expect(dynamic).toBe(false); // ?. is NOT a bracket → not dynamic
  });
  it("flags optional-bracket data?.[...] as dynamic", () => {
    const { dynamic } = extractRendererReads("const v = data?.[key];");
    expect(dynamic).toBe(true);
  });
  it("detects destructuring `const { foo } = data` and flags it (fields NOT extracted)", () => {
    const r = extractRendererReads("const { qualification, ageLimit } = data;");
    expect(r.destructuring).toBe(true);
    // conservative: destructured field names are NOT claimed as covered reads
    expect(r.fields.has("qualification")).toBe(false);
  });
  it("helper indirection getField(data,'foo') does not resolve a field (documented limit)", () => {
    const r = extractRendererReads("const v = getField(data, 'foo');");
    // `data` appears with neither `.` nor `[`, so nothing is resolved and nothing is falsely claimed
    expect(r.fields.has("foo")).toBe(false);
    expect(r.dynamic).toBe(false);
    expect(r.destructuring).toBe(false);
  });
});

describe("module boundary isolation (the Phase 1 bug class)", () => {
  // A synthetic sectionRenderers-like source: a const renderer followed by a `function` helper.
  const SECTION_SRC = [
    "const AppProc: SectionSummary = (exam) => {",
    "  const data = moduleData(exam, 'application-process');",
    "  const steps = data.steps; const description = safeHtml(data.description); const fee = safeHtml(data.fee);",
    "  return null;",
    "};",
    "",
    "function makeGenericEditorial(slug, label) {",
    "  return (exam) => {",
    "    const data = moduleData(exam, slug);",
    "    const body = safeHtml(data.body) || safeHtml(data.content); const summary = data.summary;",
    "    return null;",
    "  };",
    "}",
    "",
    "const NextRenderer: SectionSummary = (exam) => {",
    "  const data = moduleData(exam, 'other'); const x = data.otherField; return null;",
    "};",
  ].join("\n");

  it("1. renderer const followed by a `function` helper does not bleed helper reads", () => {
    const slice = sliceFunction(SECTION_SRC, "AppProc");
    const { fields } = extractRendererReads(slice);
    expect(fields.has("steps")).toBe(true);
    expect(fields.has("description")).toBe(true);
    expect(fields.has("fee")).toBe(true);
    // must NOT inherit makeGenericEditorial's reads (the Phase 1 false positive)
    expect(fields.has("body")).toBe(false);
    expect(fields.has("content")).toBe(false);
    expect(fields.has("summary")).toBe(false);
  });

  it("5. shared helper is not attributed to the preceding renderer (bounded by `function`)", () => {
    const slice = sliceFunction(SECTION_SRC, "AppProc");
    expect(slice.includes("makeGenericEditorial")).toBe(false);
    expect(slice.includes("otherField")).toBe(false);
  });

  // A synthetic ContentModulesBlock-like source with adjacent slug branches.
  const BLOCK_SRC = [
    'if (slug === "eligibility") {',
    "  const qualification = data.qualification; const ageLimit = data.ageLimit;",
    "  const nationality = data.nationality; const additionalCriteria = safeHtml(data.additionalCriteria);",
    "  return null;",
    "}",
    'if (slug === "overview") {',
    "  const body = safeHtml(data.body) || safeHtml(data.content) || safeHtml(data.description);",
    "  const summary = data.summary; return null;",
    "}",
    "// Generic fallback",
    "const body = safeHtml(data.body); const summary = data.summary;",
  ].join("\n");

  it("2. eligibility branch reads its own fields, not the following overview branch's", () => {
    const slice = sliceBranch(BLOCK_SRC, "eligibility");
    const { fields } = extractRendererReads(slice);
    expect(fields.has("qualification")).toBe(true);
    expect(fields.has("ageLimit")).toBe(true);
    expect(fields.has("additionalCriteria")).toBe(true);
    // must NOT bleed the overview branch or the generic fallback
    expect(fields.has("summary")).toBe(false);
    expect(fields.has("body")).toBe(false);
  });

  it("3. overview branch is isolated from the generic fallback below it", () => {
    const slice = sliceBranch(BLOCK_SRC, "overview");
    expect(slice.includes("Generic fallback")).toBe(false);
    const { fields } = extractRendererReads(slice);
    expect(fields.has("body")).toBe(true);
    expect(fields.has("summary")).toBe(true);
  });

  it("4. a missing branch/function yields an empty slice (no contamination, no throw)", () => {
    expect(sliceBranch(BLOCK_SRC, "does-not-exist")).toBe("");
    expect(sliceFunction(SECTION_SRC, "DoesNotExist")).toBe("");
  });
});

describe("isValidReason", () => {
  it("rejects unused/later/todo and accepts substantive reasons", () => {
    expect(isValidReason("unused")).toBe(false);
    expect(isValidReason("not used yet")).toBe(false);
    expect(isValidReason("rendered by the SEO metadata builder")).toBe(true);
  });
});

describe("classification logic — 20 scenarios", () => {
  it("1. valid module: editor==renderer, no findings", () => {
    const r = run(
      { result: { status: "ACTIVE", class: "editorial", editorFields: ["a", "b"], rendererFields: ["a", "b"] } },
      { result: ["a", "b"] }, { result: reads("a", "b") });
    expect(r.findings.length).toBe(0);
  });

  it("2. editor-only field → WARNING (Class 1)", () => {
    const r = run(
      { m: { status: "ACTIVE", class: "editorial", editorFields: ["a", "orphanEditor"], rendererFields: ["a"] } },
      { m: ["a", "orphanEditor"] }, { m: reads("a") });
    expect(has(r, "EDITOR_ONLY", "orphanEditor")).toBe(true);
  });

  it("3. renderer-only field → ERROR (Class 2)", () => {
    const r = run(
      { m: { status: "ACTIVE", class: "editorial", editorFields: ["a"], rendererFields: [] } },
      { m: ["a"] }, { m: reads("a", "ghost") });
    expect(has(r, "RENDERER_ONLY", "ghost")).toBe(true);
  });

  it("4. legacy field: excused, no editor-only finding", () => {
    const r = run(
      { m: { status: "ACTIVE", class: "editorial", editorFields: ["a"], rendererFields: ["a"], legacyFields: ["oldKey"] } },
      { m: ["a"] }, { m: reads("a") });
    expect(has(r, "EDITOR_ONLY")).toBe(false);
  });

  it("5. derived/fallback field read is producible, no renderer-only", () => {
    const r = run(
      { m: { status: "ACTIVE", class: "editorial", editorFields: ["body"], rendererFallback: { prose: ["body", "content", "description"] } } },
      { m: ["body"] }, { m: reads("body", "content", "description") });
    expect(has(r, "RENDERER_ONLY")).toBe(false);
  });

  it("6. system-generated key read (_meta) is producible", () => {
    const r = run(
      { m: { status: "ACTIVE", class: "editorial", editorFields: ["a"], rendererFields: ["a"] } },
      { m: ["a"] }, { m: reads("a", "_meta") });
    expect(has(r, "RENDERER_ONLY", "_meta")).toBe(false);
  });

  it("7. deprecated field (not re-added) produces no rename error", () => {
    const r = run(
      { m: { status: "ACTIVE", class: "editorial", editorFields: ["summary"], rendererFields: ["summary"],
             deprecatedFields: [{ key: "description", renamedTo: "summary", reason: "legacy" }] } },
      { m: ["summary"] }, { m: reads("summary") });
    expect(has(r, "UNDECLARED_RENAME")).toBe(false);
  });

  it("8. unknown persisted field → not computed in Phase 1 (no PERSISTED_ORPHAN emitted)", () => {
    const r = run(
      { m: { status: "ACTIVE", class: "editorial", editorFields: ["a"], rendererFields: ["a"] } },
      { m: ["a"] }, { m: reads("a") });
    expect(has(r, "PERSISTED_ORPHAN")).toBe(false); // Class 3 deferred to Phase 4 (data audit)
  });

  it("9. canonical owner declared, module editorial-for → editor fields excused", () => {
    const r = run(
      { eligibility: { status: "ACTIVE", class: "editorial-for", canonicalFact: "eligibility",
                       editorFields: ["qualification", "ageLimit"], rendererFields: [], syncsTo: "exam_editions.eligibility" } },
      { eligibility: ["qualification", "ageLimit"] }, { eligibility: noReads() },
      { eligibility: { home: "exam_editions.eligibility", migration: { phase: "none" } } });
    expect(has(r, "EDITOR_ONLY")).toBe(false);
  });

  it("10. mirror module → editor fields excused, no findings", () => {
    const r = run(
      { "important-dates": { status: "ACTIVE", class: "mirror-of", canonicalFact: "important_dates",
                             editorFields: ["dates"], rendererFields: [], mirrorOf: "exam_editions.important_dates", generated: true } },
      { "important-dates": ["dates"] }, { "important-dates": noReads() },
      { important_dates: { home: "exam_editions.important_dates", migration: { phase: "none" } } });
    expect(r.findings.length).toBe(0);
  });

  it("11. intentional exception with valid reason → editor field excused", () => {
    const r = run(
      { m: { status: "ACTIVE", class: "editorial", editorFields: ["a", "applyLink"], rendererFields: ["a"],
             intentionallyUnrendered: [{ key: "applyLink", reason: "editorial action link, render-or-deprecate pending" }] } },
      { m: ["a", "applyLink"] }, { m: reads("a") });
    expect(has(r, "EDITOR_ONLY", "applyLink")).toBe(false);
  });

  it("12. dynamic renderer access → UNRESOLVED_DYNAMIC_ACCESS (INFO)", () => {
    const r = run(
      { m: { status: "ACTIVE", class: "editorial", editorFields: ["a"], rendererFields: ["a"] } },
      { m: ["a"] }, { m: { fields: new Set(["a"]), dynamic: true } });
    expect(has(r, "UNRESOLVED_DYNAMIC_ACCESS")).toBe(true);
  });

  it("13. relational source (rendered elsewhere) → module has no reads, no findings", () => {
    const r = run(
      { syllabus: { status: "DEPRECATED", class: "deprecated", canonicalFact: "syllabus",
                    editorFields: ["subjects", "notes"], rendererFields: [] } },
      { syllabus: ["subjects", "notes"] }, { syllabus: noReads() },
      { syllabus: { home: "exam_syllabus_subjects", migration: { phase: "none" } } });
    expect(has(r, "EDITOR_ONLY")).toBe(false); // DEPRECATED status excuses editor-only
  });

  it("14. renamed field WITH declaration (not re-added) → no error", () => {
    const r = run(
      { m: { status: "ACTIVE", class: "editorial", editorFields: ["downloadLink"], rendererFields: ["downloadLink"],
             deprecatedFields: [{ key: "downloadUrl", renamedTo: "downloadLink", reason: "renamed 2026-07" }] } },
      { m: ["downloadLink"] }, { m: reads("downloadLink") });
    expect(has(r, "UNDECLARED_RENAME")).toBe(false);
  });

  it("15. renamed field WITHOUT migration (re-added to editorFields) → ERROR (Class 5)", () => {
    const r = run(
      { m: { status: "ACTIVE", class: "editorial", editorFields: ["downloadLink", "downloadUrl"], rendererFields: ["downloadLink"],
             deprecatedFields: [{ key: "downloadUrl", renamedTo: "downloadLink", reason: "renamed 2026-07" }] } },
      { m: ["downloadLink", "downloadUrl"] }, { m: reads("downloadLink") });
    expect(has(r, "UNDECLARED_RENAME", "downloadUrl")).toBe(true);
  });

  it("16. unknown module (in contract, not in registry) → REGISTRY_MISMATCH warning", () => {
    const r = run(
      { ghostModule: { status: "ACTIVE", class: "editorial", editorFields: ["a"], rendererFields: ["a"] } },
      {}, { ghostModule: reads("a") });
    expect(has(r, "REGISTRY_MISMATCH")).toBe(true);
  });

  it("17. new module: editor==registry==renderer → clean", () => {
    const r = run(
      { newMod: { status: "ACTIVE", class: "editorial", editorFields: ["x"], rendererFields: ["x"] } },
      { newMod: ["x"] }, { newMod: reads("x") });
    expect(r.findings.length).toBe(0);
  });

  it("18. module with no renderer but editorial-for (column render) → no editor-only", () => {
    const r = run(
      { m: { status: "ACTIVE", class: "editorial-for", canonicalFact: "f", editorFields: ["a"], rendererFields: [] } },
      { m: ["a"] }, { m: noReads() }, { f: { home: "exam_editions.f", migration: { phase: "none" } } });
    expect(has(r, "EDITOR_ONLY")).toBe(false);
  });

  it("19. module with no editor fields but renderer reads → RENDERER_ONLY errors", () => {
    const r = run(
      { m: { status: "ACTIVE", class: "editorial", editorFields: [], rendererFields: [] } },
      { m: [] }, { m: reads("x") });
    expect(has(r, "RENDERER_ONLY", "x")).toBe(true);
  });

  it("20. competing canonical source: forbidden field present as editor field → ERROR (Class 6)", () => {
    const r = run(
      { "vacancy-details": { status: "LEGACY", class: "forbidden-canonical", canonicalFact: "vacancy_total",
                             editorFields: ["totalPosts"], rendererFields: [],
                             forbiddenFields: [{ key: "totalPosts", reason: "canonical total is exam_editions.vacancy" }] } },
      { "vacancy-details": ["totalPosts"] }, { "vacancy-details": noReads() },
      { vacancy_total: { home: "exam_editions.vacancy", migration: { phase: "none" } } });
    expect(has(r, "COMPETING_SOURCE", "totalPosts")).toBe(true);
  });

  it("registry mismatch: contract field not in registry → ERROR", () => {
    const r = run(
      { m: { status: "ACTIVE", class: "editorial", editorFields: ["a", "extra"], rendererFields: ["a", "extra"] } },
      { m: ["a"] }, { m: reads("a", "extra") });
    expect(has(r, "REGISTRY_MISMATCH", "extra")).toBe(true);
  });
});

describe("Phase 3 baseline + blocking gate", () => {
  const vacancyModule = {
    "vacancy-details": {
      status: "LEGACY" as const, class: "forbidden-canonical", canonicalFact: "vacancy_total",
      editorFields: ["totalPosts"], rendererFields: [],
      forbiddenFields: [{ key: "totalPosts", reason: "canonical total is exam_editions.vacancy" }],
    },
  };
  const vacancyReg = { "vacancy-details": ["totalPosts"] };
  const vacancyReads = { "vacancy-details": noReads() };
  const vacancyFacts = { vacancy_total: { home: "exam_editions.vacancy", migration: { phase: "none" } } };

  it("a competing-source finding WITHOUT a baseline entry → blocks (newBlockingFindings non-empty)", () => {
    const r = run(vacancyModule, vacancyReg, vacancyReads, vacancyFacts, []);
    const blocking = newBlockingFindings(r);
    expect(blocking.some((f) => f.cls === "COMPETING_SOURCE" && f.field === "totalPosts")).toBe(true);
  });

  it("the SAME finding WITH a matching baseline entry → does NOT block (isBaseline, filtered out)", () => {
    const r = run(vacancyModule, vacancyReg, vacancyReads, vacancyFacts, [
      { module: "vacancy-details", field: "totalPosts", cls: "COMPETING_SOURCE", reason: "known GDS conflict", owner: "user", since: "2026-09-12" },
    ]);
    expect(r.findings.find((f) => f.cls === "COMPETING_SOURCE")?.isBaseline).toBe(true);
    expect(newBlockingFindings(r)).toEqual([]);
  });

  it("a baseline entry that does NOT match a real finding does NOT suppress a different new finding", () => {
    // Baseline covers a DIFFERENT field; the real totalPosts finding still blocks.
    const r = run(vacancyModule, vacancyReg, vacancyReads, vacancyFacts, [
      { module: "vacancy-details", field: "somethingElse", cls: "COMPETING_SOURCE", reason: "x", owner: "y", since: "2026-09-12" },
    ]);
    expect(newBlockingFindings(r).some((f) => f.field === "totalPosts")).toBe(true);
  });

  it("EDITOR_ONLY / REGISTRY_MISMATCH / UNRESOLVED are NOT in the blocking set", () => {
    const r = run(
      { m: { status: "ACTIVE", class: "editorial", editorFields: ["a", "orphanEditor", "extra"], rendererFields: ["a"] } },
      { m: ["a", "orphanEditor"] }, { m: { fields: new Set(["a"]), dynamic: true } });
    // has EDITOR_ONLY (orphanEditor), REGISTRY_MISMATCH (extra), UNRESOLVED_DYNAMIC_ACCESS — none block
    expect(newBlockingFindings(r)).toEqual([]);
  });
});
