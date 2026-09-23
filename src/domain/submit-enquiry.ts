import {
  isEnquiryType,
  validateEnquiry,
  type Enquiry,
  type EnquiryProblem,
  type EnquiryProblems,
  type EnquiryValidation,
  type EnquiryType,
  type ItemOffer,
} from './enquiry'
import { enquiryEmails, type EnquiryEmail } from './enquiry-email'
import { estimate, type Estimate } from './estimate'
import { photoProblem } from './inspiration-photo'
import type { CalendarDate, LeadTime } from './lead-time'
import { amsterdamArrival, formatCalendarDate } from './pickup-date'
import { DEFAULT_LOCALE, isLocale, type Locale } from './routes'

/**
 * The Enquiry pipeline (ADR-0006), as a function over an injected store-and-send pair: bot
 * check and honeypot, validate, store, send, respond. The route handler is the thin shell
 * that supplies BotID, Payload, Blob and Resend; everything it decides is decided here,
 * where every branch can be tested with no database, no storage and no network.
 *
 * Store-then-send: the Submission is the durable artifact, and the emails are notifications
 * about it. A customer who filled the form in correctly is never told it failed because of
 * our own delivery problem — a failed send is recorded as a Delivery status and reported,
 * and the customer still gets their confirmation page.
 */

/**
 * Where every Enquiry is sent. See `src/app/(frontend)/next/enquiry/route.ts`. BotID
 * protects this path by name, so the form and `instrumentation-client.ts` share it.
 */
export const ENQUIRY_ENDPOINT = '/next/enquiry'

/** The form field an Inspiration photo is sent in. */
export const PHOTO_FIELD = 'photo'

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
  /** What the customer quotes when they follow up. See `reference.ts`. */
  reference: string
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
  reference: string
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
  /**
   * BotID judged it a bot. Refused openly rather than faked like the honeypot: a person
   * misjudged as a bot must be told, so they can get in touch another way.
   */
  | { status: 'refused' }
  | { status: 'invalid'; problems: EnquiryProblems }
  /** Something on our side failed before the Submission was stored. */
  | { status: 'failed'; error: unknown }

/** Where an email got to by the time the route answered. The webhook takes it from there. */
export type EmailDelivery =
  { status: 'sent'; emailId: string } | { status: 'not-sent'; emailId: null }

export type Delivery = { toJana: EmailDelivery; toCustomer: EmailDelivery }

export type SubmitDependencies = {
  now: Date
  /** BotID's verdict on the request. */
  isBot: () => Promise<boolean>
  load: (request: { item: number | null; locale: Locale }) => Promise<EnquiryContext>
  /** A fresh random reference for the Submission. */
  reference: () => string
  /** The photo decoded and encoded again, EXIF and all else stripped. Throws if it will not decode. */
  reencode: (photo: Uint8Array) => Promise<Uint8Array>
  /** Stores the Submission, with its re-encoded photo if there is one. */
  store: (submission: SubmissionData, photo: Uint8Array | null) => Promise<void>
  /** Hands one email to the provider, and returns the id it will be known by. */
  send: (email: EnquiryEmail) => Promise<string>
  recordDelivery: (reference: string, delivery: Delivery) => Promise<void>
  /** Jana's inbox. */
  jana: string
  /** Something went wrong that the customer is not told about, and someone should be. */
  report: (message: string, error: unknown) => void
}

/** What arrived: the form's fields, and the Inspiration photo's bytes if one was attached. */
export type EnquiryInput = { body: unknown; photo: Uint8Array | null }

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
export const submission = (enquiry: Enquiry, locale: Locale, reference: string): SubmissionData => {
  const { contact } = enquiry
  const common = {
    ...nothingChosen,
    reference,
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

/**
 * Every problem with an Enquiry and its Inspiration photo together, so both are reported at
 * once — or `null` when there are none. The form and the route judge by the same one.
 */
export const withPhotoProblem = (
  validation: EnquiryValidation,
  photo: EnquiryProblem | null,
): EnquiryProblems | null =>
  validation.ok && !photo
    ? null
    : { ...(validation.ok ? {} : validation.problems), ...(photo ? { photo } : {}) }

/** Hands both emails to the provider. One failing never stops the other. */
const sendBoth = async (
  data: SubmissionData,
  hasPhoto: boolean,
  context: EnquiryContext,
  { now, send, recordDelivery, jana, report }: SubmitDependencies,
): Promise<void> => {
  let emails: ReturnType<typeof enquiryEmails>

  try {
    emails = enquiryEmails(data, {
      jana,
      leadTimeDays: context.leadTime?.days ?? null,
      hasPhoto,
      today: amsterdamArrival(now).date,
    })
  } catch (error) {
    // The Submission is stored: this is our delivery problem, never the customer's.
    report(`The emails for Enquiry ${data.reference} could not be written.`, error)
    return
  }

  const { toJana, toCustomer } = emails

  const deliver = async (email: EnquiryEmail, whose: string): Promise<EmailDelivery> => {
    try {
      return { status: 'sent', emailId: await send(email) }
    } catch (error) {
      report(`The ${whose} email for Enquiry ${data.reference} was not sent.`, error)
      return { status: 'not-sent', emailId: null }
    }
  }

  const [janaDelivery, customerDelivery] = await Promise.all([
    deliver(toJana, 'Jana’s'),
    deliver(toCustomer, 'customer’s'),
  ])

  try {
    await recordDelivery(data.reference, { toJana: janaDelivery, toCustomer: customerDelivery })
  } catch (error) {
    report(`The Delivery status of Enquiry ${data.reference} was not recorded.`, error)
  }
}

/** Whether BotID judged the request a bot. If BotID itself fails, it is let through. */
const judgedABot = async ({ isBot, report }: SubmitDependencies): Promise<boolean> => {
  try {
    return await isBot()
  } catch (error) {
    // Failing closed would turn BotID's outage into the customer's; the WAF still stands.
    report('The bot check failed, so an Enquiry was let through unchecked.', error)
    return false
  }
}

export const submitEnquiry = async (
  { body: raw, photo }: EnquiryInput,
  deps: SubmitDependencies,
): Promise<SubmitOutcome> => {
  const { now, load, reencode, store, reference } = deps

  if (await judgedABot(deps)) {
    return { status: 'refused' }
  }

  if (!isRecord(raw)) {
    return { status: 'invalid', problems: { enquiryType: 'unknownChoice' } }
  }

  const honeypot = raw[HONEYPOT_FIELD]

  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    return { status: 'ignored' }
  }

  const locale = isLocale(raw['locale']) ? raw['locale'] : DEFAULT_LOCALE
  const photoIssue = photo ? photoProblem(photo) : null

  let context: EnquiryContext
  let data: SubmissionData
  let stored: Uint8Array | null = null

  try {
    context = await load({
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

    const problems = withPhotoProblem(validation, photoIssue)

    if (problems || !validation.ok) {
      return { status: 'invalid', problems: problems ?? {} }
    }

    if (photo) {
      try {
        stored = await reencode(photo)
      } catch {
        // It began like an image and would not decode as one: the file, not our side.
        return { status: 'invalid', problems: { photo: 'notAnImage' } }
      }
    }

    data = submission(validation.enquiry, locale, reference())
    await store(data, stored)
  } catch (error) {
    return { status: 'failed', error }
  }

  await sendBoth(data, stored !== null, context, deps)

  return {
    status: 'accepted',
    receipt: {
      reference: data.reference,
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
    case 'refused':
      return { status: 403, body: { status: 'failed' } }
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
    typeof parsed['reference'] !== 'string' ||
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
