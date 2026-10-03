/**
 * utils.test.ts — the shared status display label (Sprint-1 T1b / E2).
 *
 * The hero/status badge used to print the raw lifecycle enum. Every badge now
 * reads from STATUS_LABELS via statusLabel(), so:
 *  - every known ExamStatus has a human label (no internal value can leak),
 *  - kebab-case enums never appear with a hyphen on screen,
 *  - an unknown value degrades to a title-cased label rather than raw snake/kebab.
 */
import { describe, it, expect } from 'vitest';
import { statusLabel, STATUS_LABELS } from './utils';

const ALL_STATUS = [
  'upcoming',
  'active',
  'registration-open',
  'registration-closed',
  'result-declared',
  'result-awaited',
  'completed',
  'ongoing',
  'notified',
  'admit-card-out',
  'dates-awaited',
  'postponed',
  'cancelled',
] as const;

describe('statusLabel — one shared label per status (E2)', () => {
  it('covers every lifecycle status', () => {
    for (const s of ALL_STATUS) {
      expect(STATUS_LABELS[s], `missing label for ${s}`).toBeTruthy();
    }
  });

  it('maps the previously-raw badges to readable text', () => {
    expect(statusLabel('notified')).toBe('Notified');
    expect(statusLabel('admit-card-out')).toBe('Admit Card Out');
    expect(statusLabel('registration-open')).toBe('Applications Open');
    expect(statusLabel('result-declared')).toBe('Result Declared');
  });

  it('never returns a raw kebab-case enum', () => {
    for (const s of ALL_STATUS) {
      expect(statusLabel(s)).not.toContain('-');
    }
  });
});

describe('statusLabel — defensive fallback for an unknown value', () => {
  it('title-cases instead of exposing the raw token', () => {
    expect(statusLabel('some-new-state')).toBe('Some New State');
  });
});
