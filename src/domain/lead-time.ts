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
export const earliestPickupDate = (arrival: ArrivalMoment, leadTime: LeadTime): CalendarDate => {
  const missedTodaysCutoff =
    minutesSinceMidnight(arrival.time) >= minutesSinceMidnight(leadTime.cutoff)

  return addDays(arrival.date, leadTime.days + (missedTodaysCutoff ? 1 : 0))
}

/** Whether `requested` is far enough ahead of `arrival` to satisfy `leadTime`. */
export const isPickupDateAllowed = (
  requested: CalendarDate,
  arrival: ArrivalMoment,
  leadTime: LeadTime,
): boolean => {
  const earliest = earliestPickupDate(arrival, leadTime)

  return (
    Date.UTC(requested.year, requested.month - 1, requested.day) >=
    Date.UTC(earliest.year, earliest.month - 1, earliest.day)
  )
}
