import { parseTimeOfDay } from './lead-time'
import { formatEuros } from './menu'
import type { Locale } from './routes'
import { DAYS_OF_WEEK, type DayOfWeek, type OpeningHours } from './structured-data'

/**
 * The Contact page's derived values: its opening hours, its price range and its Instagram
 * link. Each is both printed on the page and marked up in its `Bakery` JSON-LD, so each is
 * computed once, here, and handed to both — the markup can never say what the page does not.
 */

/**
 * Where pickup is, and all the site ever says about where: the town, never the street
 * (ADR-0002). `areaServed` in the markup rather than `address`, permanently — it is also
 * how the Business Profile is registered — so it is code, not a field anyone can fill in.
 */
export const AREA_SERVED = 'Uithoorn'

/** A row of opening hours as the Contact global stores it. */
export type StoredOpeningHours = {
  days?: readonly string[] | null
  opens?: string | null
  closes?: string | null
}

const isDay = (value: string): value is DayOfWeek =>
  (DAYS_OF_WEEK as readonly string[]).includes(value)

const minutes = (time: string): number | null => {
  const parsed = parseTimeOfDay(time)

  return parsed ? parsed.hour * 60 + parsed.minute : null
}

/**
 * The rows of opening hours that mean something: days in week order, two `HH:MM` times,
 * closing after opening. A row that does not is left out of the page and the markup alike,
 * rather than printed as Jana typed it.
 */
export const openingHours = (
  rows: readonly StoredOpeningHours[] | null | undefined,
): OpeningHours[] =>
  (rows ?? []).flatMap(({ days, opens, closes }) => {
    const chosen = DAYS_OF_WEEK.filter((day) => (days ?? []).filter(isDay).includes(day))
    const open = (opens ?? '').trim()
    const close = (closes ?? '').trim()
    const from = minutes(open)
    const to = minutes(close)

    return chosen.length > 0 && from !== null && to !== null && to > from
      ? [{ days: chosen, opens: open, closes: close }]
      : []
  })

const DAY_NAMES: Record<Locale, Record<DayOfWeek, string>> = {
  en: {
    Monday: 'Monday',
    Tuesday: 'Tuesday',
    Wednesday: 'Wednesday',
    Thursday: 'Thursday',
    Friday: 'Friday',
    Saturday: 'Saturday',
    Sunday: 'Sunday',
  },
  nl: {
    Monday: 'maandag',
    Tuesday: 'dinsdag',
    Wednesday: 'woensdag',
    Thursday: 'donderdag',
    Friday: 'vrijdag',
    Saturday: 'zaterdag',
    Sunday: 'zondag',
  },
}

/** Days in week order as runs of consecutive days. */
const runs = (days: readonly DayOfWeek[]): DayOfWeek[][] =>
  days.reduce<DayOfWeek[][]>((all, day) => {
    const last = all.at(-1)
    const previous = last?.at(-1)

    if (last && previous && DAYS_OF_WEEK.indexOf(day) === DAYS_OF_WEEK.indexOf(previous) + 1) {
      last.push(day)
    } else {
      all.push([day])
    }

    return all
  }, [])

/**
 * The opening hours as the page prints them: the days in the page's language — three or
 * more in a row as a range — and the times.
 */
export const hoursLines = (
  hours: readonly OpeningHours[],
  locale: Locale,
): { days: string; hours: string }[] =>
  hours.map(({ days, opens, closes }) => ({
    days: runs(days)
      .flatMap((run) => {
        const names = run.map((day) => DAY_NAMES[locale][day])

        return names.length >= 3 ? [`${names[0]} – ${names.at(-1)}`] : names
      })
      .join(', '),
    hours: `${opens} – ${closes}`,
  }))

/**
 * The `priceRange` the Contact page prints and marks up: the cheapest Size on the menu to the
 * dearest — `€3.50 – €110`. Read from the prices themselves, so it can never contradict the
 * menu. `null` when nothing is priced.
 */
export const priceRange = (prices: readonly number[], locale: Locale): string | null => {
  if (prices.length === 0) {
    return null
  }

  const low = Math.min(...prices)
  const high = Math.max(...prices)

  return low === high
    ? formatEuros(low, locale)
    : `${formatEuros(low, locale)} – ${formatEuros(high, locale)}`
}

// Instagram usernames: letters, digits, full stops and underscores, up to 30.
const HANDLE = /^[A-Za-z0-9._]{1,30}$/

/**
 * The Instagram link, from the handle Jana typed — `thuisbakery`, `@thuisbakery`, or the
 * profile's whole URL. `null` when there is none, or it could not be a handle.
 */
export const instagramLink = (
  value: string | null | undefined,
): { href: string; label: string } | null => {
  const handle = (value ?? '')
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/+$/, '')

  return HANDLE.test(handle)
    ? { href: `https://www.instagram.com/${handle}/`, label: `@${handle}` }
    : null
}

/**
 * The phone number as the Contact page prints it — as Jana wrote it — and as a phone dials
 * it. The printed label is also what the `Bakery` markup's `telephone` carries, so the two
 * match. `null` when there is no number, or nothing in it to dial.
 */
export const phoneLink = (
  value: string | null | undefined,
): { href: string; label: string } | null => {
  const label = (value ?? '').trim()
  const dialled = label.replace(/[^\d+]/g, '')

  return /\d/.test(dialled) ? { href: `tel:${dialled}`, label } : null
}
