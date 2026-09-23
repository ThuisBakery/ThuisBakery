import { offeredChoices } from './item'
import type { CalendarDate } from './lead-time'
import { parseCalendarDate, pickupDateProblem, type PickupRules } from './pickup-date'

/**
 * Enquiry validation: what each of the three forms must carry before it becomes a
 * Submission. One function for the browser and the route handler, so the customer is told
 * what is wrong by the same rules that would otherwise reject them. See CONTEXT.md.
 *
 * Plain values in — what a form or a JSON body holds — and either a resolved Enquiry or a
 * problem per field out. Problems are codes, not sentences: the page words them in the
 * customer's language.
 */

export const ENQUIRY_TYPES = ['item', 'custom-order', 'contact'] as const

export type EnquiryType = (typeof ENQUIRY_TYPES)[number]

/** A generous ceiling for a home bakery, which also keeps a typo from reading as 100 cakes. */
export const MAX_QUANTITY = 50

/** Whether a count is one an Enquiry may ask for: a whole number from 1 to `MAX_QUANTITY`. */
export const isQuantity = (count: number): boolean =>
  Number.isInteger(count) && count >= 1 && count <= MAX_QUANTITY

export const isEnquiryType = (value: unknown): value is EnquiryType =>
  typeof value === 'string' && (ENQUIRY_TYPES as readonly string[]).includes(value)

export /** What an Item offers an Enquiry: its Sizes, and its Sponges and Fillings if configurable. */
type ItemOffer = {
  id: number
  title: string
  sizes: { id: string; label: string; price: number }[]
  configurable: boolean
  sponges: { id: number; name: string }[]
  fillings: { id: number; name: string; surcharge?: number | null }[]
}

/** What `itemOffer` needs of an Item: the Payload document, structurally. */
export type OfferedItem = {
  id: number
  title: string
  sizes: readonly { id?: string | null; label: string; price: number }[]
  configurable?: boolean | null
  sponges?: readonly (number | { id: number; name: string })[] | null
  fillings?: readonly (number | { id: number; name: string; surcharge?: number | null })[] | null
}

/**
 * What an Item offers an Enquiry, trimmed to names and figures. The Item page hands this to
 * the form and the route handler validates against it, so the browser and the server judge
 * an Enquiry against the same offer.
 */
export const itemOffer = (
  item: OfferedItem,
  everySponge: readonly { id: number; name: string }[],
  everyFilling: readonly { id: number; name: string; surcharge?: number | null }[],
): ItemOffer => {
  const configurable = Boolean(item.configurable)

  return {
    id: item.id,
    title: item.title,
    // Payload gives every saved array row an id; the position is the fallback for one that
    // somehow has none, and is unique within the Item all the same.
    sizes: item.sizes.map(({ id, label, price }, index) => ({
      id: id ?? String(index),
      label,
      price,
    })),
    configurable,
    sponges: configurable
      ? offeredChoices(populate(item.sponges, everySponge), everySponge).map(({ id, name }) => ({
          id,
          name,
        }))
      : [],
    fillings: configurable
      ? offeredChoices(populate(item.fillings, everyFilling), everyFilling).map(
          ({ id, name, surcharge }) => ({
            id,
            name,
            surcharge: surcharge ?? null,
          }),
        )
      : [],
  }
}

/**
 * An Item's own Sponges or Fillings as documents, whether Payload returned them populated
 * or as bare ids — which depends only on the depth the Item was read at.
 */
const populate = <T extends { id: number }>(
  own: readonly (number | T)[] | null | undefined,
  every: readonly T[],
): T[] =>
  (own ?? []).flatMap((each) => {
    const found = typeof each === 'object' ? each : every.find(({ id }) => id === each)

    return found ? [found] : []
  })

export type EnquiryRules = {
  pickup: PickupRules
  /** The Item an Enquiry from an Item page is about; `null` when it names none that exists. */
  item?: ItemOffer | null
}

export type Contact = { name: string; email: string; phone: string | null }

export type ItemEnquiry = {
  enquiryType: 'item'
  contact: Contact
  item: ItemOffer
  size: ItemOffer['sizes'][number]
  quantity: number
  sponge: ItemOffer['sponges'][number] | null
  filling: ItemOffer['fillings'][number] | null
  requestedPickupDate: CalendarDate
  specialRequests: string | null
}

export type CustomOrderEnquiry = {
  enquiryType: 'custom-order'
  contact: Contact
  requestedPickupDate: CalendarDate
  message: string
}

export type ContactEnquiry = {
  enquiryType: 'contact'
  contact: Contact
  message: string
}

export type Enquiry = ItemEnquiry | CustomOrderEnquiry | ContactEnquiry

export type EnquiryField =
  | 'enquiryType'
  | 'item'
  | 'name'
  | 'email'
  | 'phone'
  | 'size'
  | 'quantity'
  | 'sponge'
  | 'filling'
  | 'requestedPickupDate'
  | 'specialRequests'
  | 'message'

export type EnquiryProblem =
  | 'required'
  | 'tooLong'
  | 'invalidEmail'
  | 'invalidQuantity'
  | 'unknownChoice'
  | 'invalidDate'
  | 'tooSoon'
  | 'closed'

export type EnquiryProblems = Partial<Record<EnquiryField, EnquiryProblem>>

export type EnquiryValidation =
  { ok: true; enquiry: Enquiry } | { ok: false; problems: EnquiryProblems }

const MAX_LENGTH = {
  name: 200,
  email: 254,
  phone: 40,
  specialRequests: 2000,
  message: 5000,
} as const

// Deliberately loose: whether an address exists is for the mail server to say. This only
// catches the address that cannot be one, which is almost always a typo.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Collects values and problems field by field, so every problem is reported at once. */
const reader = (raw: Record<string, unknown>) => {
  const problems: EnquiryProblems = {}

  const text = (field: keyof typeof MAX_LENGTH, required: boolean): string | null => {
    const value = raw[field]
    const trimmed = typeof value === 'string' ? value.trim() : ''

    if (trimmed === '') {
      if (required) {
        problems[field] = 'required'
      }

      return null
    }

    if (trimmed.length > MAX_LENGTH[field]) {
      problems[field] = 'tooLong'
      return null
    }

    return trimmed
  }

  /** A choice, by id, from what is offered — a Size, Sponge or Filling. */
  const choice = <T extends { id: number | string }>(
    field: 'size' | 'sponge' | 'filling',
    offered: readonly T[],
  ): T | null => {
    const value = raw[field]
    const id = typeof value === 'number' ? String(value) : typeof value === 'string' ? value : ''

    if (id.trim() === '') {
      problems[field] = 'required'
      return null
    }

    const found = offered.find((each) => String(each.id) === id.trim())

    if (!found) {
      problems[field] = 'unknownChoice'
    }

    return found ?? null
  }

  const quantity = (): number | null => {
    const value = raw['quantity']
    const figure = typeof value === 'number' ? value : typeof value === 'string' ? value.trim() : ''

    if (figure === '') {
      problems.quantity = 'required'
      return null
    }

    const count = Number(figure)

    if (!isQuantity(count)) {
      problems.quantity = 'invalidQuantity'
      return null
    }

    return count
  }

  const pickupDate = (rules: PickupRules): CalendarDate | null => {
    const value = raw['requestedPickupDate']

    if (typeof value !== 'string' || value.trim() === '') {
      problems.requestedPickupDate = 'required'
      return null
    }

    const date = parseCalendarDate(value.trim())

    if (!date) {
      problems.requestedPickupDate = 'invalidDate'
      return null
    }

    const problem = pickupDateProblem(date, rules)

    if (problem) {
      problems.requestedPickupDate = problem
      return null
    }

    return date
  }

  const contact = (): Contact | null => {
    const name = text('name', true)
    const email = text('email', true)
    const phone = text('phone', false)

    if (email !== null && !EMAIL.test(email)) {
      problems.email = 'invalidEmail'
    }

    return name !== null && email !== null ? { name, email, phone } : null
  }

  return { problems, text, choice, quantity, pickupDate, contact }
}

const itemEnquiry = (
  read: ReturnType<typeof reader>,
  item: ItemOffer | null | undefined,
  rules: EnquiryRules,
): ItemEnquiry | null => {
  if (!item) {
    read.problems.item = 'unknownChoice'
    return null
  }

  const contact = read.contact()
  const size = read.choice('size', item.sizes)
  const quantity = read.quantity()
  // A choice is only asked for when the Item offers one to make.
  const sponge =
    item.configurable && item.sponges.length > 0 ? read.choice('sponge', item.sponges) : null
  const filling =
    item.configurable && item.fillings.length > 0 ? read.choice('filling', item.fillings) : null
  const requestedPickupDate = read.pickupDate(rules.pickup)
  const specialRequests = read.text('specialRequests', false)

  if (!contact || !size || quantity === null || !requestedPickupDate) {
    return null
  }

  return {
    enquiryType: 'item',
    contact,
    item,
    size,
    quantity,
    sponge,
    filling,
    requestedPickupDate,
    specialRequests,
  }
}

export const validateEnquiry = (
  raw: Record<string, unknown>,
  rules: EnquiryRules,
): EnquiryValidation => {
  const read = reader(raw)
  const type = raw['enquiryType']
  let enquiry: Enquiry | null = null

  if (!isEnquiryType(type)) {
    read.problems.enquiryType = 'unknownChoice'
  } else if (type === 'item') {
    enquiry = itemEnquiry(read, rules.item, rules)
  } else if (type === 'custom-order') {
    const contact = read.contact()
    const requestedPickupDate = read.pickupDate(rules.pickup)
    const message = read.text('message', true)

    enquiry =
      contact && requestedPickupDate && message
        ? { enquiryType: type, contact, requestedPickupDate, message }
        : null
  } else {
    const contact = read.contact()
    const message = read.text('message', true)

    enquiry = contact && message ? { enquiryType: type, contact, message } : null
  }

  // A problem can be recorded without emptying its value — an email that is present but
  // malformed — so the problems decide, not the absence of an Enquiry.
  return enquiry && Object.keys(read.problems).length === 0
    ? { ok: true, enquiry }
    : { ok: false, problems: read.problems }
}
