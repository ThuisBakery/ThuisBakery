import { DICTIONARY } from './dictionary'
import type { Estimate } from './estimate'
import type { CalendarDate } from './lead-time'
import { formatEuros } from './menu'
import { formatDisplayDate, parseCalendarDate } from './pickup-date'
import type { Locale } from './routes'
import type { SubmissionData } from './submit-enquiry'

/**
 * The two emails about a stored Submission (ADR-0006): the Enquiry to Jana, and the
 * acknowledgement to the customer. Both are fixed words and nothing is machine translated —
 * Jana's copy is always English, the acknowledgement follows the customer's locale, and what
 * the customer typed passes through verbatim in both.
 *
 * Each is answerable in one tap: `Reply-To` is the customer on Jana's copy and Jana on the
 * customer's, so the conversation leaves the site from the first reply.
 */

export type EnquiryEmail = {
  to: string
  replyTo: string
  subject: string
  text: string
  html: string
}

export type EmailContext = {
  /** Jana's inbox: where her copy goes, and what the customer's copy replies to. */
  jana: string
  /** The Lead time's days that applied: how long the customer should wait for a reply. */
  leadTimeDays: number | null
  /**
   * Whether the Submission has an Inspiration photo. It is named, never attached: attached,
   * it would live on in Jana's mailbox past the 12 months after which it is deleted (ADR-0006).
   */
  hasPhoto: boolean
  /** Today in Amsterdam, which decides whether a date needs its year. */
  today: CalendarDate
}

const LANGUAGE_NAMES: Record<Locale, string> = { en: 'English', nl: 'Dutch' }

/** One line of text, for a header: whatever was typed, it cannot start another. */
const oneLine = (value: string): string => value.replace(/\s+/g, ' ').trim()

const requestedPickupDate = (submission: SubmissionData, locale: Locale, today: CalendarDate) => {
  const date = submission.requestedPickupDate
    ? parseCalendarDate(submission.requestedPickupDate.slice(0, 10))
    : null

  return date ? formatDisplayDate(date, locale, today) : null
}

/** `Term: value` for each value there is. A value of several lines starts on its own line. */
const fields = (rows: readonly (readonly [string, string | number | null])[]): string[] =>
  rows.flatMap(([term, value]) => {
    if (value === null || value === '') {
      return []
    }

    const text = String(value)

    return [text.includes('\n') ? `${term}:\n${text}` : `${term}: ${text}`]
  })

const estimateLines = (estimate: Estimate, heading: string, locale: Locale): string[] => [
  `${heading}: ${formatEuros(estimate.total, locale)}`,
  ...estimate.lines.map(
    ({ label, quantity, amount }) =>
      `  ${DICTIONARY[locale].enquiry.line(label, quantity)}: ${formatEuros(amount, locale)}`,
  ),
]

const paragraphs = (...blocks: (string | string[] | null)[]): string =>
  blocks
    .flatMap((block) => (block === null ? [] : [Array.isArray(block) ? block.join('\n') : block]))
    .filter((block) => block !== '')
    .join('\n\n')

const janaSubject = (submission: SubmissionData, date: string | null): string => {
  const { reference, name } = submission

  switch (submission.enquiryType) {
    case 'item':
      return `Enquiry ${reference}: ${submission.itemTitle ?? 'an Item'}${date ? ` for ${date}` : ''}, from ${name}`
    case 'custom-order':
      return `Custom order ${reference}${date ? ` for ${date}` : ''}, from ${name}`
    case 'contact':
      return `Message ${reference} from ${name}`
  }
}

const toJana = (submission: SubmissionData, context: EmailContext): EnquiryEmail => {
  const date = requestedPickupDate(submission, 'en', context.today)
  const language = LANGUAGE_NAMES[submission.locale]

  const text = paragraphs(
    `${submission.name} sent this through the website. Written in ${language}: reply in ${language}.`,
    fields([
      ['Reference', submission.reference],
      ['Item', submission.itemTitle],
      ['Size', submission.size],
      ['How many', submission.quantity],
      ['Sponge', submission.sponge],
      ['Filling', submission.filling],
      ['Requested pickup date', date],
    ]),
    fields([
      ['Special requests', submission.specialRequests],
      ['Message', submission.message],
    ]),
    submission.estimate
      ? estimateLines(submission.estimate, 'Estimate (provisional, as the customer saw it)', 'en')
      : null,
    fields([
      ['Email', submission.email],
      ['Phone', submission.phone],
    ]),
    context.hasPhoto
      ? `There is an Inspiration photo: open Submission ${submission.reference} in the admin to see it.`
      : null,
    `Reply to this email to answer ${submission.name} directly.`,
  )

  return {
    to: context.jana,
    replyTo: submission.email,
    subject: oneLine(janaSubject(submission, date)),
    text,
    html: textToHtml(text),
  }
}

const toCustomer = (submission: SubmissionData, context: EmailContext): EnquiryEmail => {
  const { locale } = submission
  const words = DICTIONARY[locale]

  const text = paragraphs(
    words.acknowledgement.greeting(submission.name),
    [words.sent.heading, words.sent.whatNext].join(' '),
    context.leadTimeDays !== null
      ? [words.sent.byWhen(context.leadTimeDays), words.acknowledgement.followUp].join(' ')
      : words.acknowledgement.followUp,
    [
      words.sent.receipt,
      words.sent.reference(submission.reference),
      ...fields([
        [words.sent.item, submission.itemTitle],
        [words.enquiry.size, submission.size],
        [words.enquiry.quantity, submission.quantity],
        [words.item.sponge, submission.sponge],
        [words.item.filling, submission.filling],
        [words.sent.requestedPickupDate, requestedPickupDate(submission, locale, context.today)],
      ]),
    ],
    fields([
      [words.sent.specialRequests, submission.specialRequests],
      [words.acknowledgement.message, submission.message],
    ]),
    submission.estimate
      ? estimateLines(
          submission.estimate,
          `${words.enquiry.estimate} (${words.enquiry.provisional.toLowerCase()})`,
          locale,
        )
      : null,
    words.acknowledgement.signOff,
  )

  return {
    to: submission.email,
    replyTo: context.jana,
    subject: oneLine(words.acknowledgement.subject(submission.reference)),
    text,
    html: textToHtml(text),
  }
}

export const enquiryEmails = (
  submission: SubmissionData,
  context: EmailContext,
): { toJana: EnquiryEmail; toCustomer: EnquiryEmail } => ({
  toJana: toJana(submission, context),
  toCustomer: toCustomer(submission, context),
})

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/**
 * The HTML part of an email: the text part, escaped, with its line breaks kept. Everything
 * in it may be the customer's, so none of it is ever markup.
 */
export const textToHtml = (text: string): string =>
  `<div style="font-family: sans-serif; white-space: pre-wrap">${text.replace(
    /[&<>"']/g,
    (character) => ESCAPES[character] ?? character,
  )}</div>`
