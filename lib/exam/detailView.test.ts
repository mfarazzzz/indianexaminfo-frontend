/**
 * detailView.test.ts — reader-facing display rules (Sprint-1 T1, S3.2/D6 update).
 *
 * Pins three things the detail page must never get wrong:
 *  (a) A record advertises an editor verification ONLY when it carries real
 *      verification data — the `verified` flag AND a date (the read path already
 *      requires the verifier id to set the flag; the uuid is never mapped). The
 *      claim names the TEAM, never a person (D6 decision 3). Without both, the
 *      honest "not yet verified" line stands — as it does for every record the
 *      S3.2 verify control has not stamped (live today: 0 of 398).
 * (b) No personal name can leak: the component reads v.label, never a name,
 *      and the old unconditional claim stays source-blocked.
 *  (c) A sidebar list widget renders only when it has items (empty → hidden).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  getExamVerification,
  shouldShowListWidget,
  UNVERIFIED_EXAM_NOTICE,
  VERIFIED_BY_LABEL,
} from './detailView';

describe('getExamVerification — the verified line needs real data', () => {
  it('is unverified when the record carries nothing (the reality for every unstamped exam)', () => {
    expect(getExamVerification({})).toEqual({ kind: 'unverified' });
    expect(getExamVerification({ verified: false, verifiedAt: null })).toEqual({ kind: 'unverified' });
  });

  it('is unverified with a date but no verified flag, or a flag with no date', () => {
    expect(getExamVerification({ verifiedAt: '2026-09-28T00:00:00Z' }).kind).toBe('unverified');
    expect(getExamVerification({ verified: true }).kind).toBe('unverified');
    expect(getExamVerification({ verified: true, verifiedAt: '   ' }).kind).toBe('unverified');
  });

  it('is verified ONLY with the flag AND a real date — and names the TEAM, never a person (D6 #3)', () => {
    expect(getExamVerification({ verified: true, verifiedAt: ' 2026-10-21 ' })).toEqual({
      kind: 'verified',
      label: VERIFIED_BY_LABEL,
      date: '2026-10-21',
    });
  });

  it('the team label is exactly the approved public line', () => {
    expect(VERIFIED_BY_LABEL).toBe('IndianExamInfo editorial team');
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

  it('reads the team LABEL only — a personal name (v.name) can never return', () => {
    expect(src).not.toMatch(/v\.name/);
    expect(src).toContain('v.label');
    // the team name lives in detailView (one source), not as a component literal
    expect(src).not.toContain('IndianExamInfo editorial team');
  });

  it('renders the badge label from the shared statusLabel, not the raw enum', () => {
    expect(src).toContain('statusLabel(exam.status)');
    expect(src).not.toContain('exam.status.replace(/-/g, " ")');
  });
});
