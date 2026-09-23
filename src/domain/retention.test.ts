import { describe, expect, it } from 'vitest'

import { anonymisedFields, isPhotoDue, retentionCutoffs } from './retention'

const at = (iso: string) => new Date(iso)

describe('isPhotoDue', () => {
  const now = at('2027-10-05T03:00:00.000Z')

  it('is due once the photo is 12 months old', () => {
    expect(isPhotoDue(at('2026-10-05T03:00:00.000Z'), now)).toBe(true)
    expect(isPhotoDue(at('2026-03-14T12:00:00.000Z'), now)).toBe(true)
  })

  it('is not due a moment before', () => {
    expect(isPhotoDue(at('2026-10-05T03:00:00.001Z'), now)).toBe(false)
    expect(isPhotoDue(at('2027-10-04T12:00:00.000Z'), now)).toBe(false)
  })
})

describe('retentionCutoffs', () => {
  it('is everything sent 12 months ago for photos, and 24 for anonymising', () => {
    expect(retentionCutoffs(at('2028-10-05T03:00:00.000Z'))).toEqual({
      photo: at('2027-10-05T03:00:00.000Z'),
      anonymise: at('2026-10-05T03:00:00.000Z'),
    })
  })

  it('falls back to the last day of a shorter month rather than running into the next', () => {
    expect(retentionCutoffs(at('2028-02-29T03:00:00.000Z'))).toEqual({
      photo: at('2027-02-28T03:00:00.000Z'),
      anonymise: at('2026-02-28T03:00:00.000Z'),
    })
  })

  it('agrees with isPhotoDue at the boundary', () => {
    const now = at('2028-02-29T03:00:00.000Z')
    const { photo } = retentionCutoffs(now)

    expect(isPhotoDue(photo, now)).toBe(true)
    expect(isPhotoDue(new Date(photo.getTime() + 1), now)).toBe(false)
  })
})

describe('anonymisedFields', () => {
  const submission = {
    reference: 'K7QM-3XRD',
    enquiryType: 'item',
    locale: 'nl',
    name: 'Sanne de Vries',
    email: 'sanne.devries@example.nl',
    phone: '06 1234 5678',
    item: 12,
    itemTitle: 'Bento cake',
    size: '10 cm',
    quantity: 1,
    sponge: 'Funfetti',
    filling: 'Salted Caramel',
    requestedPickupDate: '2026-10-17T00:00:00.000Z',
    specialRequests: 'Happy 5th birthday Noor, in pink',
    message: 'Ring the bell at Dorpsstraat 4',
    inspirationPhoto: 'inspiration/0b6f7c1e-2f7e-4a55-9f8e-5a1c7c0e4d2a.jpg',
    estimate: { lines: [{ label: '10 cm', unitAmount: 25, quantity: 1, amount: 25 }], total: 25 },
    createdAt: '2026-10-01T09:30:00.000Z',
  }

  const after = { ...submission, ...anonymisedFields }

  it('keeps nothing the customer told us about themselves', () => {
    const kept = JSON.stringify(after)

    for (const personal of [
      'Sanne',
      'sanne.devries',
      '1234',
      'inspiration/',
      'Noor',
      'Dorpsstraat',
      // Jana's copy of the email carries it, next to the customer's name and address.
      'K7QM-3XRD',
    ]) {
      expect(kept).not.toContain(personal)
    }
  })

  it('keeps what sold, at what size, and when', () => {
    expect(after).toMatchObject({
      item: 12,
      itemTitle: 'Bento cake',
      size: '10 cm',
      quantity: 1,
      sponge: 'Funfetti',
      filling: 'Salted Caramel',
      requestedPickupDate: '2026-10-17T00:00:00.000Z',
      estimate: submission.estimate,
      createdAt: '2026-10-01T09:30:00.000Z',
    })
  })
})
