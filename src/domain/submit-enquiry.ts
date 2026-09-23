import {
  isEnquiryType,
  validateEnquiry,
  type Enquiry,
  type EnquiryProblems,
  type EnquiryType,
  type ItemOffer,
} from './enquiry'
import { estimate, type Estimate } from './estimate'
import type { CalendarDate, LeadTime } from './lead-time'
import { amsterdamArrival, formatCalendarDate } from './pickup-date'
import { DEFAULT_LOCALE, isLocale, type Locale } from './routes'

/**
 * The Enquiry pipeline (ADR-0006), as a function over an injected store: honeypot, validate,
 * store, respond. The route handler is the thin shell that supplies the real Payload calls;
 * everything it decides is decided here, where every branch can be tested without a
 * database.
 *
 * Store-then-send: the Submission is the durable artifact. The emails that follow it are a
 * later step, and are notifications about what was stored here.
 */

/** A form field no person fills in. Anything in it is a bot. */
export const HONEYPOT_FIELD = 'website'

/** What the pipeline needs read from the CMS before it can judge an Enquiry. */
export type EnquiryContext = {
  /** The Item named, as offered in the customer's locale; `null` when none is named or found. */
  item: ItemOffer | null
  /** The Lead time that applies: the Item's override, else the site's; `null` when unset. */
  leadTime: LeadTime | null
  closedUntil: CalendarDate | null
}

/**
 * A Submission as stored. Names are copied rather than related wherever the customer chose
 * something, and the Estimate is a snapshot: Jana renames a Filling or changes a price, and
 * the Submission still says what the customer asked for and was shown.
 */
export type SubmissionData = {
  enquiryType: EnquiryType
  /** The locale the customer submitted in — the language Jana replies in. */
  locale: Locale
  name: string
  email: string
  phone: string | null
  item: number | null
  itemTitle: string | null
  size: string | null
  quantity: number | null
  sponge: string | null
  filling: string | null
  /** A day-only date as Payload's date picker writes one: noon UTC on that day. */
  requestedPickupDate: string | null
  specialRequests: string | null
  message: string | null
  estimate: Estimate | null
}

/** What the confirmation page shows back to the customer: what they sent, and its number. */
export type Receipt = {
  reference: number
  enquiryType: EnquiryType
  itemTitle: string | null
  size: string | null
  quantity: number | null
  sponge: string | null
  filling: string | null
  /** `YYYY-MM-DD`. */
  requestedPickupDate: string | null
  specialRequests: string | null
  estimate: Estimate | null
  /** The Lead time's days that applied, which is how long to wait before following up. */
  leadTimeDays: number | null
}

export type SubmitOutcome =
  | { status: 'accepted'; receipt: Receipt }
  /** The honeypot was filled: answered like success, so a bot learns nothing. */
  | { status: 'ignored' }
  | { status: 'invalid'; problems: EnquiryProblems }
  /** Something on our side failed before the Submission was stored. */
  | { status: 'failed'; error: unknown }

export type SubmitDependencies = {
  now: Date
  load: (request: { item: number | null; locale: Locale }) => Promise<EnquiryContext>
  store: (submission: SubmissionData) => Promise<{ id: number }>
}

const dayOnlyTimestamp = (date: CalendarDate): string => `${formatCalendarDate(date)}T12:00:00.000Z`

const nothingChosen = {
  item: null,
  itemTitle: null,
  size: null,
  quantity: null,
  sponge: null,
  filling: null,
  requestedPickupDate: null,
  specialRequests: null,
  message: null,
  estimate: null,
} as const

/** The Submission an Enquiry is stored as. The Estimate is worked out here, once. */
export const submission = (enquiry: Enquiry, locale: Locale): SubmissionData => {
  const { contact } = enquiry
  const common = {
    ...nothingChosen,
    enquiryType: enquiry.enquiryType,
    locale,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
  }

  switch (enquiry.enquiryType) {
    case 'item':
      return {
        ...common,
        item: enquiry.item.id,
        itemTitle: enquiry.item.title,
        size: enquiry.size.label,
        quantity: enquiry.quantity,
        sponge: enquiry.sponge?.name ?? null,
        filling: enquiry.filling?.name ?? null,
        requestedPickupDate: dayOnlyTimestamp(enquiry.requestedPickupDate),
        specialRequests: enquiry.specialRequests,
        estimate: estimate({
          size: enquiry.size,
          quantity: enquiry.quantity,
          filling: enquiry.filling,
        }),
      }
    case 'custom-order':
      return {
        ...common,
        requestedPickupDate: dayOnlyTimestamp(enquiry.requestedPickupDate),
        message: enquiry.message,
      }
    case 'contact':
      return { ...common, message: enquiry.message }
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const itemId = (value: unknown): number | null => {
  const id = typeof value === 'string' ? Number(value) : value

  return typeof id === 'number' && Number.isInteger(id) && id > 0 ? id : null
}

export const submitEnquiry = async (
  raw: unknown,
  { now, load, store }: SubmitDependencies,
): Promise<SubmitOutcome> => {
  if (!isRecord(raw)) {
    return { status: 'invalid', problems: { enquiryType: 'unknownChoice' } }
  }

  const honeypot = raw[HONEYPOT_FIELD]

  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    return { status: 'ignored' }
  }

  const locale = isLocale(raw['locale']) ? raw['locale'] : DEFAULT_LOCALE

  try {
    const context = await load({
      item: raw['enquiryType'] === 'item' ? itemId(raw['item']) : null,
      locale,
    })

    const validation = validateEnquiry(raw, {
      item: context.item,
      pickup: {
        arrival: amsterdamArrival(now),
        leadTime: context.leadTime,
        closedUntil: context.closedUntil,
      },
    })

    if (!validation.ok) {
      return { status: 'invalid', problems: validation.problems }
    }

    const data = submission(validation.enquiry, locale)
    const { id } = await store(data)

    return {
      status: 'accepted',
      receipt: {
        reference: id,
        enquiryType: data.enquiryType,
        itemTitle: data.itemTitle,
        size: data.size,
        quantity: data.quantity,
        sponge: data.sponge,
        filling: data.filling,
        requestedPickupDate: data.requestedPickupDate?.slice(0, 10) ?? null,
        specialRequests: data.specialRequests,
        estimate: data.estimate,
        leadTimeDays: context.leadTime?.days ?? null,
      },
    }
  } catch (error) {
    return { status: 'failed', error }
  }
}

/** What the route answers with, and what the form reads back. */
export type EnquiryReply =
  | { status: 'accepted'; receipt: Receipt | null }
  | { status: 'invalid'; problems: EnquiryProblems }
  | { status: 'failed' }

/** An outcome as an HTTP status and a JSON body. A bot is answered like anyone else. */
export const httpReply = (outcome: SubmitOutcome): { status: number; body: EnquiryReply } => {
  switch (outcome.status) {
    case 'accepted':
      return { status: 201, body: { status: 'accepted', receipt: outcome.receipt } }
    case 'ignored':
      return { status: 201, body: { status: 'accepted', receipt: null } }
    case 'invalid':
      return { status: 422, body: { status: 'invalid', problems: outcome.problems } }
    case 'failed':
      return { status: 500, body: { status: 'failed' } }
  }
}

/**
 * A receipt read back from where the form kept it for the confirmation page, or `null` when
 * there is none or it is not one. Checked rather than trusted: storage is the browser's, and
 * an Estimate is never shown unless it says it is provisional.
 */
export const parseReceipt = (value: string | null): Receipt | null => {
  let parsed: unknown

  try {
    parsed = value === null ? null : JSON.parse(value)
  } catch {
    return null
  }

  if (
    !isRecord(parsed) ||
    typeof parsed['reference'] !== 'number' ||
    !isEnquiryType(parsed['enquiryType'])
  ) {
    return null
  }

  const estimate = parsed['estimate']

  if (
    estimate !== null &&
    !(
      isRecord(estimate) &&
      Array.isArray(estimate['lines']) &&
      typeof estimate['total'] === 'number' &&
      estimate['provisional'] === true
    )
  ) {
    return null
  }

  return parsed as Receipt
}
