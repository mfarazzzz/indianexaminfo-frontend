/**
 * S3.2 read path — mapRow verification mapping (D6 decision 3).
 *
 * A verified record is EXACTLY one carrying is_verified + verified_at +
 * verified_by. The verified_by uuid folds into the `verified` boolean and is
 * NEVER mapped onto the entity — the public page names the editorial team, not
 * a person. Anything partial (flag without a date, a date without a flag, a
 * blank verifier) stays honest-unverified.
 */
import { describe, it, expect } from 'vitest';
import { mapRow } from '@/services/examService';

const VERIFIER_UUID = '9d2f5c6e-1234-4a5b-8c7d-0e1f2a3b4c5d';

/** A minimal exams row (identity-only, no edition) with optional columns. */
const row = (over: Record<string, unknown> = {}) => ({
  id: 'exam-1', slug: 's', name: 'N', short_name: 'n', pillar: 'entrance-exam',
  region: 'up', category_id: 'c', entity_type: 'exam', conducting_body: 'B',
  official_website: 'https://x.example', current_ed: null, cat: null, subcat: null,
  ...over,
});

describe('mapRow — S3.2 verification mapping', () => {
  it('maps verified ONLY with all three: flag + date + verifier id', () => {
    const exam = mapRow(row({
      is_verified: true,
      verified_at: '2026-10-20T10:00:00Z',
      verified_by: VERIFIER_UUID,
    }) as Record<string, unknown>);
    expect(exam.verified).toBe(true);
    expect(exam.verifiedAt).toBe('2026-10-20T10:00:00Z');
  });

  it('any partial is unverified — flag without verifier, date without flag, blank stamp', () => {
    expect(mapRow(row({ is_verified: true, verified_at: '2026-10-20', verified_by: null }) as Record<string, unknown>).verified).toBe(false);
    expect(mapRow(row({ is_verified: false, verified_at: '2026-10-20', verified_by: VERIFIER_UUID }) as Record<string, unknown>).verified).toBe(false);
    expect(mapRow(row({ is_verified: true, verified_at: '   ', verified_by: VERIFIER_UUID }) as Record<string, unknown>).verified).toBe(false);
    expect(mapRow(row({ is_verified: true, verified_at: null, verified_by: VERIFIER_UUID }) as Record<string, unknown>).verifiedAt).toBeNull();
  });

  it('a row with no verification columns at all (today: 0 of 398) is unverified', () => {
    const exam = mapRow(row() as Record<string, unknown>);
    expect(exam.verified).toBe(false);
    expect(exam.verifiedAt).toBeNull();
  });

  it('NO NAME LEAK: the verifier uuid never appears on the entity, and no verifiedBy field exists', () => {
    const exam = mapRow(row({
      is_verified: true,
      verified_at: '2026-10-20T10:00:00Z',
      verified_by: VERIFIER_UUID,
    }) as Record<string, unknown>);
    expect('verifiedBy' in exam).toBe(false);
    expect(JSON.stringify(exam)).not.toContain(VERIFIER_UUID);
    expect(exam.verified).toBe(true); // the only exposed shape of the uuid
  });
});
