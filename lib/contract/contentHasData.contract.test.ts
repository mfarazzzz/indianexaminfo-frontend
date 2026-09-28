// @vitest-environment node
/**
 * contentHasData.contract.test.ts — the FRONTEND side of the three-way
 * content-presence contract (Q1c).
 *
 * The site's rule (lib/sectionRegistry.ts hasData / contentTypeHasData) is the
 * TRUTH. contract/content-has-data.expected.json is generated FROM THIS
 * implementation and vendored, byte-identical, into indianexaminfo-cms; the
 * fixture contract/content-has-data.fixtures.json is vendored byte-identical
 * across both repos. The CMS test asserts SQL mirror == CMS TS == expected;
 * this test asserts FRONTEND TS == expected — so drift in EITHER repo fails CI
 * in both (the CMS SQL mirror and the CMS registry cannot disagree with the
 * site without one of the two suites going red).
 *
 * Content hashes of both contract files are embedded below AND in the CMS
 * mirror of this test. Re-baking expected.json (REGEN) changes its hash, and
 * editing the fixture changes the fixture hash — the constants must then be
 * updated in BOTH repos' test files, which is the cross-repo tripwire.
 *
 * Re-generating expected.json after intentionally changing the frontend rule:
 *   $env:REGEN_CONTENT_HAS_DATA='1'; npx vitest run lib/contract/contentHasData.contract.test.ts
 * then copy the printed sha256 values into the constants HERE and in
 * indianexaminfo-cms/src/lib/contentHasData.parity.test.ts, and vendor the
 * regenerated expected.json into indianexaminfo-cms/contract/ byte-identical.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  hasData,
  contentTypeHasData,
  type HasDataView,
} from '../sectionRegistry';

// ── Pinned content hashes (must equal the same constants in the CMS test) ──
// Baked 2026-09-28 (S0-2) from the frontend rule (REGEN), LF-normalized bytes
// (.gitattributes pins contract/*.json to eol=lf in both repos). Changing
// either contract file changes its hash and goes red in BOTH repos until
// deliberately re-baked.
// The FAQs cases pin the owner decisions of 2026-09-28. S0-2: hasData(view,'faqs')
// counts the exams.faqs COLUMN for the visible main-page section
// (faqs-column-counts = true), a contentModules.faqs store alone lights nothing
// (faqs-module-only-not-counted = false), and the 'faqs' CONTENT TYPE does not
// resolve to a section, so /faqs stays un-routable (ct-faqs-not-routable = false).
// Sprint 0 Part 2: an entry only counts when its answer, trimmed + lowercased
// with any trailing run of . , ? ! : ; and whitespace stripped, is non-empty and
// is NOT one bare placeholder token (not specified / n/a / na / - / tba / tbd /
// none / nil). Sentences that merely CONTAIN a placeholder phrase stay visible
// (faqs-sentence-not-hidden = true) — the rule is deterministic, never heuristic.
const FIXTURES_SHA256 = 'e6b2494c9e2730cd67370e6cf2c53fcb22d472e415d1874e564fbd64b4f1ea9b';
const EXPECTED_SHA256 = '3b94c343629f79dd88b618bc723689ca0a1d19af394200d210572ed11e586e7d';

const CONTRACT_DIR = path.resolve(process.cwd(), 'contract');
const FIXTURES_FILE = path.join(CONTRACT_DIR, 'content-has-data.fixtures.json');
const EXPECTED_FILE = path.join(CONTRACT_DIR, 'content-has-data.expected.json');

function sha256(file: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

interface FixtureCase {
  id: string;
  kind: 'section' | 'contentType';
  key: string;
  view: HasDataView;
}
interface FixtureDoc { cases: FixtureCase[] }
interface ExpectedCase { id: string; expected: boolean }
interface ExpectedDoc { cases: ExpectedCase[] }

const fixtures = JSON.parse(fs.readFileSync(FIXTURES_FILE, 'utf8')) as FixtureDoc;

/** Evaluate the FRONTEND rule for one case — the single place truth is computed. */
function frontendEvaluate(c: FixtureCase): boolean {
  return c.kind === 'section' ? hasData(c.view, c.key) : contentTypeHasData(c.view, c.key);
}

if (process.env.REGEN_CONTENT_HAS_DATA === '1') {
  // REGEN mode: the frontend IS the truth — bake expected.json from it.
  describe('content-presence contract — REGEN', () => {
    it('bakes expected.json from the frontend rule', () => {
      const doc = {
        '$comment':
          'CANONICAL CONTRACT — frozen expected booleans for the content-presence rule, GENERATED from the FRONTEND implementation (indianexaminfo-frontend/lib/sectionRegistry.ts hasData/contentTypeHasData over contract/content-has-data.fixtures.json). The frontend TS is the site rule and the anchor of truth; the CMS TS mirror and the SQL mirror (supabase/proposed/content_has_data_fn.sql) must produce exactly these booleans. VENDORED byte-identical into indianexaminfo-cms/contract/. sha256 of this file and of the fixtures file are embedded in BOTH repos\' test files; re-baking requires updating the hashes in both, so silent drift fails CI everywhere.',
        generatedBy: 'indianexaminfo-frontend/lib/sectionRegistry.ts (REGEN_CONTENT_HAS_DATA=1)',
        cases: fixtures.cases.map((c) => ({ id: c.id, expected: frontendEvaluate(c) })),
      };
      const out = JSON.stringify(doc, null, 2) + '\n';
      fs.writeFileSync(EXPECTED_FILE, out, 'utf8');
      // eslint-disable-next-line no-console
      console.log('REGEN wrote content-has-data.expected.json');
      // eslint-disable-next-line no-console
      console.log('SHA256 fixtures =', sha256(FIXTURES_FILE));
      // eslint-disable-next-line no-console
      console.log('SHA256 expected =', sha256(EXPECTED_FILE));
      expect(fs.existsSync(EXPECTED_FILE)).toBe(true);
    });
  });
} else {
  describe('content-presence contract (frontend TS === frozen expected)', () => {
    it('vendored contract files match their pinned hashes', () => {
      expect(sha256(FIXTURES_FILE), 'fixtures hash drift').toBe(FIXTURES_SHA256);
      expect(fs.existsSync(EXPECTED_FILE), 'contract/content-has-data.expected.json missing').toBe(true);
      expect(sha256(EXPECTED_FILE), 'expected hash drift').toBe(EXPECTED_SHA256);
    });

    it('fixture ids and expected ids are the same set', () => {
      const expected = JSON.parse(fs.readFileSync(EXPECTED_FILE, 'utf8')) as ExpectedDoc;
      expect(fixtures.cases.map((c) => c.id)).toEqual(expected.cases.map((c) => c.id));
    });

    it('the frontend rule returns the frozen boolean for every case', () => {
      const expected = JSON.parse(fs.readFileSync(EXPECTED_FILE, 'utf8')) as ExpectedDoc;
      const byId = new Map(expected.cases.map((c) => [c.id, c.expected]));
      const mismatches: string[] = [];
      for (const c of fixtures.cases) {
        const got = frontendEvaluate(c);
        const want = byId.get(c.id);
        if (got !== want) mismatches.push(`${c.id}: frontend ${got} !== expected ${want}`);
      }
      expect(mismatches, mismatches.join('\n')).toEqual([]);
    });
  });
}
