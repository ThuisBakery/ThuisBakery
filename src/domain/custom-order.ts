import { DICTIONARY } from './dictionary'
import type { Locale } from './routes'

/**
 * A Custom order's own questions (ADR-0007): what it is for, and roughly how many people.
 *
 * Neither is a field of the Enquiry or the Submission. Both are written into the message,
 * above the customer's own words, which for this form are its Special requests. So the route
 * handler, the Submission and both emails take a Custom order exactly as they always have,
 * and Jana reads the Occasion and the head count where she reads the rest of the idea.
 */

/** The Occasion chips on the Idea step, in the order they are offered. */
export const CUSTOM_ORDER_OCCASIONS = [
  'birthday',
  'wedding',
  'babyShower',
  'justBecause',
  'somethingElse',
] as const

export type CustomOrderOccasion = (typeof CUSTOM_ORDER_OCCASIONS)[number]

export const isCustomOrderOccasion = (value: string): value is CustomOrderOccasion =>
  (CUSTOM_ORDER_OCCASIONS as readonly string[]).includes(value)

/** Roughly how many people: from a small party to a wedding, two at a time. */
export const HEAD_COUNT = { min: 2, max: 150, step: 2, start: 12 } as const

/**
 * The message a Custom order sends: the Occasion, if one was chosen, and the head count, each
 * on a line of its own in the customer's language, then the customer's own words.
 *
 * Empty when the customer wrote nothing: an Occasion and a head count describe no cake, so
 * the idea itself is what the message requires, and the form's validation says so.
 */
export const customOrderMessage = (
  locale: Locale,
  { occasion, people, idea }: { occasion: CustomOrderOccasion | ''; people: number; idea: string },
): string => {
  const words = DICTIONARY[locale].customOrder
  const own = idea.trim()

  if (own === '') {
    return ''
  }

  return [
    [
      ...(occasion ? [words.occasionLine(words.occasions[occasion])] : []),
      words.peopleLine(people),
    ].join('\n'),
    own,
  ].join('\n\n')
}
