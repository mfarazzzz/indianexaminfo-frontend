/**
 * FX1.7 — a published exam with NO current edition maps to an honest
 * identity-only entity: every cycle field empty/undefined, no fabricated
 * content, and no throw. This is the read-side guarantee behind the frontend
 * rendering a zero-edition exam without crashing or showing fake data.
 *
 * The DETAIL_SELECT embeds the edition via `current_ed:exam_editions!current_edition_id(*)`.
 * When current_edition_id is null (zero editions), PostgREST returns the exam
 * row with current_ed = null (an embedded resource over a null FK is null, not
 * a dropped row). mapRow must therefore tolerate a null current_ed.
 */
import { describe, it, expect } from 'vitest'
import { mapRow } from '@/services/examService'

/** A minimal exams row with NO current edition (current_ed: null). */
function rowWithoutEdition() {
  return {
    id: 'c238f548-0d04-49cf-94f2-4e5fa33fe59f',
    slug: 'up-deled-entrance',
    name: 'UP D.El.Ed Entrance',
    short_name: 'UP DELED',
    pillar: 'entrance-exam',
    region: 'up',
    category_id: 'cat-1',
    entity_type: 'exam',
    conducting_body: 'MEERUT UNIVERSITY',
    official_website: 'https://updeled.gov.in',
    selection_process: ['Academic merit', 'Counselling'],
    faqs: [{ question: 'Is there an entrance test?', answer: 'No, state merit.' }],
    seo_title: 'UP D.El.Ed Admission 2026',
    seo_description: 'UP D.El.Ed admission',
    tags: ['deled'],
    // The edition embed is null — the FX1 state.
    current_ed: null,
    cat: { slug: 'teaching-and-education', name: 'Teaching and Education' },
    subcat: null,
  }
}

describe('mapRow with no current edition (FX1.7)', () => {
  it('does not throw on a null current_ed', () => {
    expect(() => mapRow(rowWithoutEdition() as Record<string, unknown>)).not.toThrow()
  })

  it('preserves the exam-level (identity) fields', () => {
    const exam = mapRow(rowWithoutEdition() as Record<string, unknown>)
    expect(exam.slug).toBe('up-deled-entrance')
    expect(exam.name).toBe('UP D.El.Ed Entrance')
    expect(exam.conductingBody).toBe('MEERUT UNIVERSITY')
    expect(exam.officialWebsite).toContain('updeled.gov.in')
    // selection_process and faqs live on the exams row — they survive with no edition.
    expect(exam.selectionProcess).toEqual(['Academic merit', 'Counselling'])
    expect(exam.faqs).toHaveLength(1)
  })

  it('leaves every cycle-specific field empty/undefined (no fabricated content)', () => {
    const exam = mapRow(rowWithoutEdition() as Record<string, unknown>)
    expect(exam.dates ?? []).toHaveLength(0)
    expect(exam.eligibility).toBeUndefined()
    expect(exam.vacancy).toBeUndefined()
    expect(exam.applicationFee).toBeUndefined()
    expect(exam.contentModules).toBeUndefined()
    expect(exam.currentEditionYear).toBeUndefined()
  })
})
