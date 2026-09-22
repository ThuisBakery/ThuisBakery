/**
 * Lead time: how far ahead of a Requested pickup date an Enquiry must arrive, expressed
 * as a number of days *and* a time of day — the pair, not the days alone. See CONTEXT.md.
 *
 * Everything here works on wall-clock civil dates and times. Resolving "now" in
 * Europe/Amsterdam is the caller's job; this module never reads a clock.
 */

/** A civil date, with `month` 1-12 — not the 0-11 that `Date` uses. */
export type CalendarDate = {
  year: number
  month: number
  day: number
}

export type TimeOfDay = {
  hour: number
  minute: number
}

export type LeadTime = {
  /** Whole days of notice required. */
  days: number
  /** The hour by which an Enquiry must arrive to count as arriving that day. */
  cutoff: TimeOfDay
}

export type ArrivalMoment = {
  date: CalendarDate
  time: TimeOfDay
}

const minutesSinceMidnight = (time: TimeOfDay): number => time.hour * 60 + time.minute

/**
 * The time of day is stored in Payload as `HH:MM` on a 24-hour clock rather than as a
 * date, because a date field would carry a day and a timezone that it does not have.
 * This is the one reader of that text, and it is what the field's validation uses.
 *
 * Returns `null` rather than throwing: a validator wants a message, not a stack.
 */
export const parseTimeOfDay = (value: string): TimeOfDay | null => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim())

  if (!match?.[1] || !match[2]) {
    return null
  }

  return { hour: Number(match[1]), minute: Number(match[2]) }
}

const addDays = (date: CalendarDate, days: number): CalendarDate => {
  const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + days))

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  }
}

/**
 * The earliest Requested pickup date an Enquiry arriving at `arrival` may ask for.
 *
 * An Enquiry that arrives at or after the cutoff has missed the day it arrived on, so it
 * counts as having arrived the next day — that is the half of Lead time the day count
 * alone does not express.
 */
export const earliestRequestedPickupDate = (
  arrival: ArrivalMoment,
  leadTime: LeadTime,
): CalendarDate => {
  const missedTodaysCutoff =
    minutesSinceMidnight(arrival.time) >= minutesSinceMidnight(leadTime.cutoff)

  return addDays(arrival.date, leadTime.days + (missedTodaysCutoff ? 1 : 0))
}

/** Whether `requestedPickupDate` is far enough ahead of `arrival` to satisfy `leadTime`. */
export const isRequestedPickupDateAllowed = (
  requestedPickupDate: CalendarDate,
  arrival: ArrivalMoment,
  leadTime: LeadTime,
): boolean => {
  const earliest = earliestRequestedPickupDate(arrival, leadTime)

  return (
    Date.UTC(requestedPickupDate.year, requestedPickupDate.month - 1, requestedPickupDate.day) >=
    Date.UTC(earliest.year, earliest.month - 1, earliest.day)
  )
}

/**
 * Whether an optional per-Item Lead time override is whole. Half an override — three days
 * with no time of day, or a time with no days — does not say what it means, so it is
 * rejected rather than half-applied. Lead time is the pair; see CONTEXT.md.
 */
export const isWholeLeadTimeOverride = (override: {
  days?: unknown
  timeOfDay?: unknown
}): boolean => {
  const hasDays = typeof override.days === 'number'
  const hasTimeOfDay = typeof override.timeOfDay === 'string' && override.timeOfDay !== ''

  return hasDays === hasTimeOfDay
}
