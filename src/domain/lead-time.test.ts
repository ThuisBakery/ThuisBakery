import { describe, expect, it } from 'vitest'

import { earliestPickupDate, isPickupDateAllowed, type LeadTime } from './lead-time'

/** Three days' notice, by 17:00. */
const threeDaysBy1700: LeadTime = { days: 3, cutoff: { hour: 17, minute: 0 } }

describe('earliestPickupDate', () => {
  it('counts the day of arrival when the Enquiry beats the cutoff', () => {
    const earliest = earliestPickupDate(
      { date: { year: 2026, month: 9, day: 21 }, time: { hour: 16, minute: 59 } },
      threeDaysBy1700,
    )

    expect(earliest).toEqual({ year: 2026, month: 9, day: 24 })
  })

  it('loses the day of arrival once the cutoff has passed', () => {
    const earliest = earliestPickupDate(
      { date: { year: 2026, month: 9, day: 21 }, time: { hour: 17, minute: 0 } },
      threeDaysBy1700,
    )

    expect(earliest).toEqual({ year: 2026, month: 9, day: 25 })
  })

  it('crosses a month boundary', () => {
    const earliest = earliestPickupDate(
      { date: { year: 2026, month: 9, day: 29 }, time: { hour: 9, minute: 0 } },
      threeDaysBy1700,
    )

    expect(earliest).toEqual({ year: 2026, month: 10, day: 2 })
  })

  it('crosses a year boundary', () => {
    const earliest = earliestPickupDate(
      { date: { year: 2026, month: 12, day: 30 }, time: { hour: 18, minute: 30 } },
      threeDaysBy1700,
    )

    expect(earliest).toEqual({ year: 2027, month: 1, day: 3 })
  })

  it('treats a midnight cutoff as making every arrival late', () => {
    const earliest = earliestPickupDate(
      { date: { year: 2026, month: 9, day: 21 }, time: { hour: 0, minute: 0 } },
      { days: 1, cutoff: { hour: 0, minute: 0 } },
    )

    expect(earliest).toEqual({ year: 2026, month: 9, day: 23 })
  })
})

describe('isPickupDateAllowed', () => {
  const arrival = { date: { year: 2026, month: 9, day: 21 }, time: { hour: 9, minute: 0 } }

  it('allows the earliest date itself', () => {
    expect(isPickupDateAllowed({ year: 2026, month: 9, day: 24 }, arrival, threeDaysBy1700)).toBe(
      true,
    )
  })

  it('allows a date beyond the earliest', () => {
    expect(isPickupDateAllowed({ year: 2026, month: 10, day: 1 }, arrival, threeDaysBy1700)).toBe(
      true,
    )
  })

  it('rejects the day before the earliest', () => {
    expect(isPickupDateAllowed({ year: 2026, month: 9, day: 23 }, arrival, threeDaysBy1700)).toBe(
      false,
    )
  })
})
