/**
 * detailView.test.ts — Sprint-1 T1 trust hotfix, reader-facing display rules.
 *
 * Pins two things the detail page must never get wrong again:
 *  (a) A record advertises an editor verification ONLY when it carries real
 *      verification data. Because the exam/admission/board/university tables have
 *      no verified_at / verified_by column, an exam record always resolves to the
 *      honest unverified line. A source scan also guards that the old false claim
 *      ("IndianExamInfo Editorial Team" / "verified by our editorial team") is not
 *      reintroduced into the component — in the spirit of
 *      lib/sarkari/verification.test.ts.
 *  (c) A sidebar list widget renders only when it has items (empty → hidden).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  getExamVerification,
  shouldShowListWidget,
  UNVERIFIED_EXAM_NOTICE,
} from './detailView';

describe('getExamVerification — the verified-by line needs real data', () => {
  it('is unverified when the record carries nothing (the exam-tables reality)', () => {
    expect(getExamVerification({})).toEqual({ kind: 'unverified' });
    expect(getExamVerification({ verifiedAt: null, verifiedBy: null })).toEqual({ kind: 'unverified' });
  });

  it('is unverified when only a name OR only a date is present', () => {
    expect(getExamVerification({ verifiedBy: 'Asha Rao' }).kind).toBe('unverified');
    expect(getExamVerification({ verifiedAt: '2026-09-28T00:00:00Z' }).kind).toBe('unverified');
  });

  it('is unverified when the values are blank/whitespace', () => {
    expect(getExamVerification({ verifiedBy: '   ', verifiedAt: '' }).kind).toBe('unverified');
  });

  it('is verified only when BOTH a name and a date are present, and trims them', () => {
    expect(getExamVerification({ verifiedBy: ' Asha Rao ', verifiedAt: ' 2026-09-28 ' })).toEqual({
      kind: 'verified',
      name: 'Asha Rao',
      date: '2026-09-28',
    });
  });
});

describe('UNVERIFIED_EXAM_NOTICE — the approved honest line', () => {
  it('admits it is not yet verified and points to the official website', () => {
    expect(UNVERIFIED_EXAM_NOTICE).toContain('Not yet verified by our editors');
    expect(UNVERIFIED_EXAM_NOTICE).toContain('official website');
    expect(UNVERIFIED_EXAM_NOTICE).toContain('before you apply or pay');
  });

  it('never claims our editorial team verified the page', () => {
    expect(UNVERIFIED_EXAM_NOTICE.toLowerCase()).not.toContain('verified by our editorial');
  });
});

describe('shouldShowListWidget — empty widgets are hidden (H2)', () => {
  it('is false for empty, null and undefined', () => {
    expect(shouldShowListWidget([])).toBe(false);
    expect(shouldShowListWidget(null)).toBe(false);
    expect(shouldShowListWidget(undefined)).toBe(false);
  });

  it('is true when there is at least one item', () => {
    expect(shouldShowListWidget(['Sarkari Naukri'])).toBe(true);
  });
});

describe('source scan — the false verification claim cannot return to the detail page', () => {
  const rel = '../../components/exam/EntityDetailPage.tsx';
  const src = readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

  it('does not print "IndianExamInfo Editorial Team"', () => {
    expect(src).not.toContain('IndianExamInfo Editorial Team');
  });

  it('does not print "verified by our editorial team"', () => {
    expect(src.toLowerCase()).not.toContain('verified by our editorial team');
  });

  it('renders the badge label from the shared statusLabel, not the raw enum', () => {
    expect(src).toContain('statusLabel(exam.status)');
    expect(src).not.toContain('exam.status.replace(/-/g, " ")');
  });
});
