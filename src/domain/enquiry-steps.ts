import type { EnquiryField, EnquiryProblems, ItemOffer } from './enquiry'

/**
 * Which steps a stepped Enquiry sheet takes, and which fields each step owns (ADR-0007).
 * A step is one decision per screen; Next checks only the fields of the step it is on, and
 * a problem the route handler names opens the step that owns its field.
 *
 * The rules are written for any stepped sheet: a sheet is an ordered list of steps and a
 * record of the fields each one owns. The Item's Enquiry and Custom order are the two.
 */

/** The fields each step owns, in the order they appear on it. */
export type StepFields<S extends string> = Record<S, readonly EnquiryField[]>

/** The steps of an Item's Enquiry, in the order they can come. */
export type ItemEnquiryStep = 'size' | 'flavour' | 'date' | 'you'

/** What each step of an Item's Enquiry asks for. */
export const ITEM_STEP_FIELDS: StepFields<ItemEnquiryStep> = {
  size: ['size', 'quantity'],
  flavour: ['sponge', 'filling'],
  date: ['requestedPickupDate'],
  you: ['specialRequests', 'photo', 'name', 'email', 'phone'],
}

/**
 * The steps an Item's Enquiry takes: Size, then Flavour when there is a Sponge or Filling to
 * choose, then the Requested pickup date, then the customer. An Item sold as described has
 * no Flavour step.
 */
export const itemEnquirySteps = (
  offer: Pick<ItemOffer, 'configurable' | 'sponges' | 'fillings'>,
): [ItemEnquiryStep, ...ItemEnquiryStep[]] => [
  'size',
  ...(offer.configurable && (offer.sponges.length > 0 || offer.fillings.length > 0)
    ? (['flavour'] as const)
    : []),
  'date',
  'you',
]

/** The steps of a Custom order, which are always the same four. */
export type CustomOrderStep = 'idea' | 'when' | 'photo' | 'you'

/**
 * A Custom order: the Idea in the customer's own words, When (the Requested pickup date, and
 * roughly how many people), an optional Inspiration photo, then the customer. The Occasion
 * and the head count are written into the message (`custom-order.ts`), so a problem with any
 * of the Idea is the message's.
 */
export const CUSTOM_ORDER_STEPS: [CustomOrderStep, ...CustomOrderStep[]] = [
  'idea',
  'when',
  'photo',
  'you',
]

/** What each step of a Custom order asks for. */
export const CUSTOM_ORDER_STEP_FIELDS: StepFields<CustomOrderStep> = {
  idea: ['message'],
  when: ['requestedPickupDate'],
  photo: ['photo'],
  you: ['name', 'email', 'phone'],
}

/** The problems among `fields`, or `null` when they have none. */
export const problemsOn = (
  fields: readonly EnquiryField[],
  problems: EnquiryProblems | null,
): EnquiryProblems | null => {
  const found: EnquiryProblems = {}

  for (const field of fields) {
    const problem = problems?.[field]

    if (problem) {
      found[field] = problem
    }
  }

  return Object.keys(found).length > 0 ? found : null
}

/** The first step, in order, that owns one of `problems`; `null` when no step owns any. */
export const stepOwning = <S extends string>(
  steps: readonly S[],
  fields: StepFields<S>,
  problems: EnquiryProblems,
): S | null => steps.find((step) => problemsOn(fields[step], problems) !== null) ?? null
