import {
  earliestRequestedPickupDate,
  type ArrivalMoment,
  type CalendarDate,
  type LeadTime,
} from './lead-time'
import type { Locale } from './routes'

/**
 * Which Requested pickup dates an Enquiry may ask for: far enough ahead for the Lead time,
 * and not before Closed until. See CONTEXT.md.
 *
 * Jana bakes in Uithoorn, so every date and time here is Amsterdam wall-clock. That is the
 * one conversion this module makes; the arithmetic itself stays in `lead-time.ts`. The
 * caller passes the instant — this module never reads a clock.
 */

export const TIME_ZONE = 'Europe/Amsterdam'

const amsterdamParts = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** The Amsterdam date and time at an instant — when an Enquiry counts as having arrived. */
export const amsterdamArrival = (instant: Date): ArrivalMoment => {
  const parts = Object.fromEntries(
    amsterdamParts.formatToParts(instant).map(({ type, value }) => [type, Number(value)]),
  )

  return {
    date: { year: parts['year'] ?? 0, month: parts['month'] ?? 0, day: parts['day'] ?? 0 },
    time: { hour: parts['hour'] ?? 0, minute: parts['minute'] ?? 0 },
  }
}

const toUtc = ({ year, month, day }: CalendarDate): number => Date.UTC(year, month - 1, day)

const compare = (a: CalendarDate, b: CalendarDate): number => toUtc(a) - toUtc(b)

/** A `YYYY-MM-DD` date — what a date input gives — or `null` when it is not a real date. */
export const parseCalendarDate = (value: string): CalendarDate | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return null
  }

  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
  const roundTrip = new Date(toUtc(date))

  // `Date.UTC` rolls 30 February over into March; a real date survives the round trip.
  return roundTrip.getUTCMonth() + 1 === date.month && roundTrip.getUTCDate() === date.day
    ? date
    : null
}

const pad = (value: number, width = 2): string => String(value).padStart(width, '0')

/** `YYYY-MM-DD`, as a date input and a stored Submission read it. */
export const formatCalendarDate = ({ year, month, day }: CalendarDate): string =>
  `${pad(year, 4)}-${pad(month)}-${pad(day)}`

const DISPLAY_LOCALES: Record<Locale, string> = { en: 'en-GB', nl: 'nl-NL' }

/**
 * A date as a customer reads it — `Saturday 26 September` — with the year only when it is
 * not the year of `today`. Leaving `today` out always omits it.
 */
export const formatDisplayDate = (
  date: CalendarDate,
  locale: Locale,
  today?: CalendarDate,
): string =>
  new Intl.DateTimeFormat(DISPLAY_LOCALES[locale], {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(today && today.year !== date.year ? { year: 'numeric' } : {}),
  })
    .format(new Date(toUtc(date)))
    // `en-GB` puts a comma after the weekday; the site's dates are set without one.
    .replace(',', '')

/** A date in full and without its weekday, for a record rather than a plan — `23 September 2026`. */
export const formatFullDate = (date: CalendarDate, locale: Locale): string =>
  new Intl.DateTimeFormat(DISPLAY_LOCALES[locale], {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(toUtc(date)))

/** A month of the calendar a customer picks a Requested pickup date from, `month` 1-12. */
export type CalendarMonth = { year: number; month: number }

/** The month `count` months after `from`; a negative `count` goes back. */
export const shiftMonth = ({ year, month }: CalendarMonth, count: number): CalendarMonth => {
  const index = year * 12 + (month - 1) + count

  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

/**
 * A month as a calendar lays it out: its days in order, and how many blank cells come before
 * the first, in a week that starts on Monday, as it does in the Netherlands.
 */
export const calendarMonth = ({
  year,
  month,
}: CalendarMonth): { leadingBlanks: number; days: CalendarDate[] } => {
  const first = new Date(Date.UTC(year, month - 1, 1))
  const length = new Date(Date.UTC(year, month, 0)).getUTCDate()

  return {
    // `getUTCDay` counts from Sunday; the week here counts from Monday.
    leadingBlanks: (first.getUTCDay() + 6) % 7,
    days: Array.from({ length }, (_, index) => ({ year, month, day: index + 1 })),
  }
}

/** A calendar's heading — `September 2026` — in the customer's language. */
export const formatMonth = ({ year, month }: CalendarMonth, locale: Locale): string =>
  new Intl.DateTimeFormat(DISPLAY_LOCALES[locale], {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, 1)))

/** The week's days, short and Monday first, for a calendar's column heads. */
export const weekdayNames = (locale: Locale): string[] => {
  const format = new Intl.DateTimeFormat(DISPLAY_LOCALES[locale], {
    timeZone: 'UTC',
    weekday: 'short',
  })

  // 5 January 2026 is a Monday.
  return Array.from({ length: 7 }, (_, index) =>
    format.format(new Date(Date.UTC(2026, 0, 5 + index))),
  )
}

/**
 * The Closed until global's date as an Amsterdam day. Payload stores a day-only date as a
 * timestamp — noon UTC from its date picker — so reading it in Amsterdam gives the day Jana
 * picked whichever way it was written.
 */
export const closedUntilDate = (value: string | null | undefined): CalendarDate | null => {
  if (!value) {
    return null
  }

  const instant = new Date(value)

  return Number.isNaN(instant.getTime()) ? null : amsterdamArrival(instant).date
}

/** Whether Jana is closed today: a Closed until date that is still ahead. */
export const isClosed = (closedUntil: CalendarDate | null, today: CalendarDate): boolean =>
  closedUntil !== null && compare(closedUntil, today) > 0

export type PickupRules = {
  arrival: ArrivalMoment
  /** The Item's Lead time, or `null` when none is set anywhere. */
  leadTime: LeadTime | null
  closedUntil: CalendarDate | null
}

const later = (a: CalendarDate, b: CalendarDate): CalendarDate => (compare(a, b) >= 0 ? a : b)

/**
 * The earliest Requested pickup date an Enquiry may ask for right now. Never before today,
 * even with no Lead time set.
 */
export const earliestPickupDate = ({
  arrival,
  leadTime,
  closedUntil,
}: PickupRules): CalendarDate => {
  const byLeadTime = leadTime ? earliestRequestedPickupDate(arrival, leadTime) : arrival.date

  return closedUntil ? later(byLeadTime, closedUntil) : byLeadTime
}

export type PickupDateProblem = 'tooSoon' | 'closed'

/**
 * Why a Requested pickup date cannot be asked for, or `null` when it can. A date that breaks
 * both rules is reported as `closed`: "closed until 5 October" tells the customer what to
 * pick, where "too soon" would send them to the next day, which is still closed.
 */
export const pickupDateProblem = (
  requested: CalendarDate,
  rules: PickupRules,
): PickupDateProblem | null => {
  if (compare(requested, earliestPickupDate(rules)) >= 0) {
    return null
  }

  return rules.closedUntil && compare(requested, rules.closedUntil) < 0 ? 'closed' : 'tooSoon'
}
