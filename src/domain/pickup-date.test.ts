import { describe, expect, it } from 'vitest'

import type { LeadTime } from './lead-time'
import {
  amsterdamArrival,
  calendarMonth,
  closedUntilDate,
  earliestPickupDate,
  formatCalendarDate,
  formatDisplayDate,
  formatMonth,
  isClosed,
  parseCalendarDate,
  pickupDateProblem,
  shiftMonth,
  weekdayNames,
} from './pickup-date'

/** Three days' notice, by 17:00. */
const threeDaysBy1700: LeadTime = { days: 3, cutoff: { hour: 17, minute: 0 } }

const date = (value: string) => {
  const parsed = parseCalendarDate(value)

  if (!parsed) {
    throw new Error(`Not a date: ${value}`)
  }

  return parsed
}

describe('amsterdamArrival', () => {
  // Summer: Amsterdam is UTC+2.
  it('reads the last minute of a summer day in Amsterdam, not in UTC', () => {
    expect(amsterdamArrival(new Date('2026-09-21T21:59:00Z'))).toEqual({
      date: { year: 2026, month: 9, day: 21 },
      time: { hour: 23, minute: 59 },
    })
  })

  it('crosses midnight two hours before UTC does in summer', () => {
    expect(amsterdamArrival(new Date('2026-09-21T22:00:00Z'))).toEqual({
      date: { year: 2026, month: 9, day: 22 },
      time: { hour: 0, minute: 0 },
    })
  })

  // Winter: Amsterdam is UTC+1.
  it('crosses midnight one hour before UTC does in winter', () => {
    expect(amsterdamArrival(new Date('2026-12-01T22:59:00Z')).date).toEqual({
      year: 2026,
      month: 12,
      day: 1,
    })
    expect(amsterdamArrival(new Date('2026-12-01T23:00:00Z'))).toEqual({
      date: { year: 2026, month: 12, day: 2 },
      time: { hour: 0, minute: 0 },
    })
  })

  it('reads the night the clocks go back', () => {
    // 25 October 2026, 03:00 CEST becomes 02:00 CET. 00:30 local is still UTC+2.
    expect(amsterdamArrival(new Date('2026-10-24T22:30:00Z'))).toEqual({
      date: { year: 2026, month: 10, day: 25 },
      time: { hour: 0, minute: 30 },
    })
  })
})

describe('parseCalendarDate', () => {
  it('reads the YYYY-MM-DD a date input gives', () => {
    expect(parseCalendarDate('2026-09-24')).toEqual({ year: 2026, month: 9, day: 24 })
  })

  it.each(['2026-02-30', '2026-13-01', '2026-9-24', '24-09-2026', '', 'tomorrow'])(
    'rejects %s',
    (value) => {
      expect(parseCalendarDate(value)).toBeNull()
    },
  )

  it('writes a date back the same way', () => {
    expect(formatCalendarDate({ year: 2026, month: 1, day: 5 })).toBe('2026-01-05')
  })
})

describe('closedUntilDate', () => {
  it('reads the noon-UTC timestamp Payload stores for a day-only date', () => {
    expect(closedUntilDate('2026-10-01T12:00:00.000Z')).toEqual({ year: 2026, month: 10, day: 1 })
  })

  it('reads an Amsterdam midnight as that Amsterdam day, not the UTC day before', () => {
    expect(closedUntilDate('2026-09-30T22:00:00.000Z')).toEqual({ year: 2026, month: 10, day: 1 })
  })

  it.each([null, undefined, '', 'not a date'])('is null for %s', (value) => {
    expect(closedUntilDate(value)).toBeNull()
  })
})

describe('isClosed', () => {
  const today = date('2026-09-21')

  it('is closed while the date is still ahead', () => {
    expect(isClosed(date('2026-09-22'), today)).toBe(true)
  })

  it('is open on the Closed until date itself, and after it', () => {
    expect(isClosed(date('2026-09-21'), today)).toBe(false)
    expect(isClosed(date('2026-09-01'), today)).toBe(false)
  })

  it('is open when no date is set', () => {
    expect(isClosed(null, today)).toBe(false)
  })
})

describe('pickupDateProblem', () => {
  // 21 September, 09:00 in Amsterdam: the earliest by Lead time is the 24th.
  const morning = amsterdamArrival(new Date('2026-09-21T07:00:00Z'))

  it('allows the earliest date the Lead time permits', () => {
    expect(
      pickupDateProblem(date('2026-09-24'), {
        arrival: morning,
        leadTime: threeDaysBy1700,
        closedUntil: null,
      }),
    ).toBeNull()
  })

  it('rejects the day before it as too soon', () => {
    expect(
      pickupDateProblem(date('2026-09-23'), {
        arrival: morning,
        leadTime: threeDaysBy1700,
        closedUntil: null,
      }),
    ).toBe('tooSoon')
  })

  it('loses a day to an Enquiry sent at the cutoff, in Amsterdam time', () => {
    // 15:00 UTC is 17:00 in Amsterdam: the cutoff itself, so the 21st no longer counts.
    const atCutoff = amsterdamArrival(new Date('2026-09-21T15:00:00Z'))
    const justBefore = amsterdamArrival(new Date('2026-09-21T14:59:00Z'))
    const rules = { leadTime: threeDaysBy1700, closedUntil: null }

    expect(pickupDateProblem(date('2026-09-24'), { ...rules, arrival: justBefore })).toBeNull()
    expect(pickupDateProblem(date('2026-09-24'), { ...rules, arrival: atCutoff })).toBe('tooSoon')
    expect(pickupDateProblem(date('2026-09-25'), { ...rules, arrival: atCutoff })).toBeNull()
  })

  it('counts from the Amsterdam day when UTC is still on the day before', () => {
    // 22:30 UTC on the 21st is 00:30 on the 22nd in Amsterdam: before the cutoff of the
    // 22nd, so the earliest is the 25th — not the 24th a UTC reading would allow.
    const afterMidnight = amsterdamArrival(new Date('2026-09-21T22:30:00Z'))
    const rules = { leadTime: threeDaysBy1700, closedUntil: null }

    expect(pickupDateProblem(date('2026-09-24'), { ...rules, arrival: afterMidnight })).toBe(
      'tooSoon',
    )
    expect(pickupDateProblem(date('2026-09-25'), { ...rules, arrival: afterMidnight })).toBeNull()
  })

  it('rejects a date before Closed until, and allows Closed until itself', () => {
    const rules = { arrival: morning, leadTime: threeDaysBy1700, closedUntil: date('2026-10-05') }

    expect(pickupDateProblem(date('2026-10-04'), rules)).toBe('closed')
    expect(pickupDateProblem(date('2026-10-05'), rules)).toBeNull()
  })

  it('names Closed until when a date breaks both rules, since that is the one to act on', () => {
    expect(
      pickupDateProblem(date('2026-09-22'), {
        arrival: morning,
        leadTime: threeDaysBy1700,
        closedUntil: date('2026-10-05'),
      }),
    ).toBe('closed')
  })

  it('applies Closed until alone when no Lead time is set', () => {
    const rules = { arrival: morning, leadTime: null, closedUntil: date('2026-10-05') }

    expect(pickupDateProblem(date('2026-10-04'), rules)).toBe('closed')
    expect(pickupDateProblem(date('2026-10-05'), rules)).toBeNull()
  })

  it('never allows a date already past, even with no rules set', () => {
    const rules = { arrival: morning, leadTime: null, closedUntil: null }

    expect(pickupDateProblem(date('2026-09-20'), rules)).toBe('tooSoon')
    expect(pickupDateProblem(date('2026-09-21'), rules)).toBeNull()
  })
})

describe('earliestPickupDate', () => {
  const morning = amsterdamArrival(new Date('2026-09-21T07:00:00Z'))

  it('is the Lead time’s earliest while open', () => {
    expect(
      earliestPickupDate({ arrival: morning, leadTime: threeDaysBy1700, closedUntil: null }),
    ).toEqual(date('2026-09-24'))
  })

  it('is Closed until when that comes later', () => {
    expect(
      earliestPickupDate({
        arrival: morning,
        leadTime: threeDaysBy1700,
        closedUntil: date('2026-10-05'),
      }),
    ).toEqual(date('2026-10-05'))
  })

  it('is the Lead time’s earliest when Closed until has already passed', () => {
    expect(
      earliestPickupDate({
        arrival: morning,
        leadTime: threeDaysBy1700,
        closedUntil: date('2026-09-01'),
      }),
    ).toEqual(date('2026-09-24'))
  })
})

describe('formatDisplayDate', () => {
  it('names the weekday, so a customer sees at once whether it is the Saturday they meant', () => {
    expect(formatDisplayDate(date('2026-09-26'), 'en')).toBe('Saturday 26 September')
    expect(formatDisplayDate(date('2026-09-26'), 'nl')).toBe('zaterdag 26 september')
  })

  it('adds the year only when it is not this year', () => {
    expect(formatDisplayDate(date('2027-01-02'), 'en', date('2026-12-30'))).toBe(
      'Saturday 2 January 2027',
    )
    expect(formatDisplayDate(date('2026-12-31'), 'en', date('2026-12-30'))).toBe(
      'Thursday 31 December',
    )
  })
})

describe('calendarMonth', () => {
  it('lays a month out from Monday, with the blanks before its first day', () => {
    // 1 September 2026 is a Tuesday.
    const month = calendarMonth({ year: 2026, month: 9 })

    expect(month.leadingBlanks).toBe(1)
    expect(month.days).toHaveLength(30)
    expect(month.days[0]).toEqual({ year: 2026, month: 9, day: 1 })
    expect(month.days[29]).toEqual({ year: 2026, month: 9, day: 30 })
  })

  it('needs no blanks for a month that starts on a Monday, and knows a leap February', () => {
    // 1 February 2027 is a Monday; 2028 is a leap year.
    expect(calendarMonth({ year: 2027, month: 2 }).leadingBlanks).toBe(0)
    expect(calendarMonth({ year: 2028, month: 2 }).days).toHaveLength(29)
  })
})

describe('shiftMonth', () => {
  it('moves across the turn of a year both ways', () => {
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 })
    expect(shiftMonth({ year: 2027, month: 1 }, -1)).toEqual({ year: 2026, month: 12 })
  })
})

describe('formatMonth and weekdayNames', () => {
  it('names a month and the week’s days in each locale, Monday first', () => {
    expect(formatMonth({ year: 2026, month: 9 }, 'en')).toBe('September 2026')
    expect(formatMonth({ year: 2026, month: 9 }, 'nl')).toBe('september 2026')
    expect(weekdayNames('en')[0]).toBe('Mon')
    expect(weekdayNames('nl')).toHaveLength(7)
  })
})
