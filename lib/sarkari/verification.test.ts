/**
 * verification.test.ts — S0-3 reader protection on unverified vacancies.
 *
 * Two things are pinned here:
 *  1. The rule itself: verified_at set → seeded numbers may show; unset → they
 *     may not. (Owner decision 2026-09-28: unverified vacancies are never
 *     unpublished; the protection is the notice, the hidden statistics and
 *     result links, and no JobPosting.)
 *  2. That the rule is the ONLY gate in the reader UI — a source scan, in the
 *     spirit of lib/contract/contract.coverage.test.ts. If someone adds a new
 *     `item.totalCandidates` / pass_percentage / cutoff_marks / vacancy_count
 *     render without the gate, this goes red.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { showsSeededStatistics } from './verification';

const SEEDED_NUMBER_FIELDS = [
  'totalCandidates',
  'passPercentage',
  'cutoffMarks',
  'vacancyCount',
] as const;

/** Files that render a sarkari_naukri row to a reader. */
const UI_FILES = [
  '../../app/(public)/sarkari-naukri/[...segments]/SarkariNaukriDetailView.tsx',
  '../../components/sarkari-naukri/SarkariNaukriList.tsx',
  '../../app/(public)/search/page.tsx',
];

describe('showsSeededStatistics — verified_at is the one switch', () => {
  it('is false when the row has never been verified', () => {
    expect(showsSeededStatistics({ verifiedAt: null })).toBe(false);
    expect(showsSeededStatistics({ verifiedAt: '' })).toBe(false);
  });

  it('is true once an editor has verified the row', () => {
    expect(showsSeededStatistics({ verifiedAt: '2026-09-28T00:00:00Z' })).toBe(true);
  });
});

describe('the gate is the only way a seeded number reaches the reader', () => {
  for (const rel of UI_FILES) {
    it(`${rel}: every seeded-number render is behind the gate`, () => {
      const source = readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
      const lines = source.split('\n');
      const GATE = /showSeededStats\b|showsSeededStatistics\s*\(/;
      const offenders = lines
        .map((line, i) => {
          if (!SEEDED_NUMBER_FIELDS.some((f) => new RegExp(`item\\.${f}\\b`).test(line))) {
            return null;
          }
          // The gate may sit on this line or on the expression that opens this
          // render (a line or two above), so look back a short window. A field
          // painted with no gate anywhere near it is exactly what fails here.
          const lookback = lines.slice(Math.max(0, i - 3), i + 1).join('\n');
          return GATE.test(lookback) ? null : `${i + 1}: ${line.trim()}`;
        })
        .filter((x): x is string => x !== null);

      expect(
        offenders,
        `These lines paint a seeded number with no verification gate. Wrap them in ` +
          `showsSeededStatistics(item) (lib/sarkari/verification.ts) — one gate, one rule:\n` +
          offenders.join('\n')
      ).toEqual([]);
    });
  }
});
