import { describe, expect, it } from 'vitest'

import {
  earliestRequestedPickupDate,
  isWholeLeadTimeOverride,
  isRequestedPickupDateAllowed,
  leadTimeOf,
  parseTimeOfDay,
  type LeadTime,
} from './lead-time'

/** Three days' notice, by 17:00. */
const threeDaysBy1700: LeadTime = { days: 3, cutoff: { hour: 17, minute: 0 } }

describe('earliestRequestedPickupDate', () => {
  it('counts the day of arrival when the Enquiry beats the cutoff', () => {
    const earliest = earliestRequestedPickupDate(
      { date: { year: 2026, month: 9, day: 21 }, time: { hour: 16, minute: 59 } },
      threeDaysBy1700,
    )

    expect(earliest).toEqual({ year: 2026, month: 9, day: 24 })
  })

  it('loses the day of arrival once the cutoff has passed', () => {
    const earliest = earliestRequestedPickupDate(
      { date: { year: 2026, month: 9, day: 21 }, time: { hour: 17, minute: 0 } },
      threeDaysBy1700,
    )

    expect(earliest).toEqual({ year: 2026, month: 9, day: 25 })
  })

  it('crosses a month boundary', () => {
    const earliest = earliestRequestedPickupDate(
      { date: { year: 2026, month: 9, day: 29 }, time: { hour: 9, minute: 0 } },
      threeDaysBy1700,
    )

    expect(earliest).toEqual({ year: 2026, month: 10, day: 2 })
  })

  it('crosses a year boundary', () => {
    const earliest = earliestRequestedPickupDate(
      { date: { year: 2026, month: 12, day: 30 }, time: { hour: 18, minute: 30 } },
      threeDaysBy1700,
    )

    expect(earliest).toEqual({ year: 2027, month: 1, day: 3 })
  })

  it('treats a midnight cutoff as making every arrival late', () => {
    const earliest = earliestRequestedPickupDate(
      { date: { year: 2026, month: 9, day: 21 }, time: { hour: 0, minute: 0 } },
      { days: 1, cutoff: { hour: 0, minute: 0 } },
    )

    expect(earliest).toEqual({ year: 2026, month: 9, day: 23 })
  })
})

describe('isRequestedPickupDateAllowed', () => {
  const arrival = { date: { year: 2026, month: 9, day: 21 }, time: { hour: 9, minute: 0 } }

  it('allows the earliest date itself', () => {
    expect(
      isRequestedPickupDateAllowed({ year: 2026, month: 9, day: 24 }, arrival, threeDaysBy1700),
    ).toBe(true)
  })

  it('allows a date beyond the earliest', () => {
    expect(
      isRequestedPickupDateAllowed({ year: 2026, month: 10, day: 1 }, arrival, threeDaysBy1700),
    ).toBe(true)
  })

  it('rejects the day before the earliest', () => {
    expect(
      isRequestedPickupDateAllowed({ year: 2026, month: 9, day: 23 }, arrival, threeDaysBy1700),
    ).toBe(false)
  })
})

describe('parseTimeOfDay', () => {
  it('reads a 24-hour HH:MM cutoff', () => {
    expect(parseTimeOfDay('17:00')).toEqual({ hour: 17, minute: 0 })
    expect(parseTimeOfDay('00:00')).toEqual({ hour: 0, minute: 0 })
    expect(parseTimeOfDay('23:59')).toEqual({ hour: 23, minute: 59 })
  })

  it('tolerates surrounding whitespace, which is what a pasted value carries', () => {
    expect(parseTimeOfDay(' 09:30 ')).toEqual({ hour: 9, minute: 30 })
  })

  it.each(['24:00', '17:60', '5:00', '17.00', '17:00:00', '5pm', '', 'half past five'])(
    'rejects %s',
    (value) => {
      expect(parseTimeOfDay(value)).toBeNull()
    },
  )
})

describe('isWholeLeadTimeOverride', () => {
  it('accepts both halves set', () => {
    expect(isWholeLeadTimeOverride({ days: 5, timeOfDay: '12:00' })).toBe(true)
  })

  it('accepts neither half set, which is simply no override', () => {
    expect(isWholeLeadTimeOverride({})).toBe(true)
    expect(isWholeLeadTimeOverride({ days: null, timeOfDay: '' })).toBe(true)
  })

  it('rejects half an override in either direction', () => {
    expect(isWholeLeadTimeOverride({ days: 5 })).toBe(false)
    expect(isWholeLeadTimeOverride({ timeOfDay: '12:00' })).toBe(false)
    expect(isWholeLeadTimeOverride({ days: 0, timeOfDay: '' })).toBe(false)
  })
})

describe('leadTimeOf', () => {
  it('reads a stored Lead time into days and a cutoff', () => {
    expect(leadTimeOf({ days: 3, timeOfDay: '17:00' })).toEqual(threeDaysBy1700)
  })

  it('is null when there is none, or its time of day does not parse', () => {
    expect(leadTimeOf(null)).toBeNull()
    expect(leadTimeOf({ days: 3, timeOfDay: '5pm' })).toBeNull()
  })
})
