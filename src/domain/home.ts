import { parseTimeOfDay } from './lead-time'
import { priced } from './menu'
import type { Locale } from './routes'

/**
 * The homepage's derived values (ADR-0004's fact band). Each fact is read from content Jana
 * already keeps — Category prices, the Lead time global — so the homepage never states a
 * figure that the rest of the site contradicts.
 */

/**
 * The fact band's price: the lowest price any Category carries, as a starting figure —
 * `From €25`. `null` when no Category is priced, and the fact is left out.
 */
export const fromPrice = (
  categories: readonly { price?: number | null }[],
  locale: Locale,
): string | null => {
  const prices = categories.flatMap(({ price }) => (typeof price === 'number' ? [price] : []))

  if (prices.length === 0) {
    return null
  }

  const price = priced(Math.min(...prices), true, locale)

  // It opens a line here, where on the menu it follows a name.
  return `${price.charAt(0).toUpperCase()}${price.slice(1)}`
}

/** How each locale says a Lead time. Code rather than content: the figures are Jana's. */
const LEAD_TIME_WORDS: Record<
  Locale,
  { days: (days: number) => string; sameDay: string; cutoff: (time: string) => string }
> = {
  en: {
    days: (days) => (days === 1 ? '1 day’s notice' : `${days} days’ notice`),
    sameDay: 'Same-day',
    cutoff: (time) => `Ask before ${time} and that day counts.`,
  },
  nl: {
    days: (days) => (days === 1 ? '1 dag van tevoren' : `${days} dagen van tevoren`),
    sameDay: 'Dezelfde dag',
    cutoff: (time) => `Vóór ${time} gevraagd telt die dag mee.`,
  },
}

/**
 * The fact band's Lead time, from the Lead time global: the days as the title and the time
 * of day as the line beneath — the pair, never the days alone (CONTEXT.md). A time of day
 * that does not parse is left out rather than printed as Jana typed it.
 */
export const leadTimeFact = (
  { days, timeOfDay }: { days: number; timeOfDay: string },
  locale: Locale,
): { title: string; detail: string | null } => {
  const words = LEAD_TIME_WORDS[locale]

  return {
    title: days === 0 ? words.sameDay : words.days(days),
    detail: parseTimeOfDay(timeOfDay) ? words.cutoff(timeOfDay.trim()) : null,
  }
}
