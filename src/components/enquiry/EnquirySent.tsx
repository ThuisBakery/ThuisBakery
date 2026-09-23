'use client'

import { useSyncExternalStore, type ReactNode } from 'react'

import { DICTIONARY } from '@/domain/dictionary'
import { formatDisplayDate, parseCalendarDate } from '@/domain/pickup-date'
import type { Locale } from '@/domain/routes'
import { parseReceipt } from '@/domain/submit-enquiry'

import { EstimateSummary } from './EstimateSummary'
import { RECEIPT_KEY } from './EnquiryForm'

const readStoredReceipt = (): string | null => {
  try {
    return sessionStorage.getItem(RECEIPT_KEY)
  } catch {
    return null
  }
}

// The receipt is written once, before this page loads; there is nothing to subscribe to.
const subscribeToNothing = () => () => {}
const nothingOnServer = () => null

/**
 * The confirmation page: the customer's receipt (ADR-0006). It says what happens next, by
 * when, and how to follow up directly if nothing arrives within that time — which is what
 * turns a lost email into a customer who gets in touch.
 *
 * The page is static, so what was sent is not in it: the form keeps the receipt for this tab,
 * and it is read here in the browser. Without one — a refresh in another tab, blocked
 * storage — the page still says everything but what was sent.
 */
export const EnquirySent = ({
  locale,
  siteLeadTimeDays,
  contactPath,
  readReceipt = readStoredReceipt,
}: {
  locale: Locale
  /** The site-wide Lead time's days: how long to wait, when there is no receipt to say. */
  siteLeadTimeDays: number | null
  contactPath: string
  readReceipt?: () => string | null
}) => {
  const words = DICTIONARY[locale]
  const receipt = parseReceipt(
    useSyncExternalStore(subscribeToNothing, readReceipt, nothingOnServer),
  )
  const days = receipt?.leadTimeDays ?? siteLeadTimeDays
  const pickup = receipt?.requestedPickupDate
    ? parseCalendarDate(receipt.requestedPickupDate)
    : null

  return (
    <div className="mx-auto max-w-2xl px-4 pt-12 pb-24 md:px-10 md:pt-20">
      <h1 className="font-display text-[40px] leading-[1.1] font-medium md:text-6xl">
        {words.sent.heading}
      </h1>
      <p className="mt-6 text-lg leading-relaxed">{words.sent.whatNext}</p>
      {days !== null ? <p className="mt-4 text-lg">{words.sent.byWhen(days)}</p> : null}
      <p className="mt-4 leading-relaxed text-ink-muted">
        {words.sent.followUp}{' '}
        <a href={contactPath} className="text-ink underline underline-offset-4 hover:text-accent">
          {words.pageTitles.contact}
        </a>
      </p>

      {receipt ? (
        <section aria-labelledby="receipt-heading" className="mt-12 border-t border-rule pt-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="receipt-heading" className="font-display text-[28px] font-semibold">
              {words.sent.receipt}
            </h2>
            <p className="text-sm text-ink-muted tabular-nums">
              {words.sent.reference(receipt.reference)}
            </p>
          </div>
          <dl className="mt-4 border-t border-rule">
            <Row term={words.sent.item} value={receipt.itemTitle} />
            <Row
              term={words.enquiry.size}
              value={receipt.size ? words.enquiry.line(receipt.size, receipt.quantity ?? 1) : null}
            />
            <Row term={words.item.sponge} value={receipt.sponge} />
            <Row term={words.item.filling} value={receipt.filling} />
            <Row
              term={words.sent.requestedPickupDate}
              value={pickup ? formatDisplayDate(pickup, locale) : null}
            />
            <Row term={words.sent.specialRequests} value={receipt.specialRequests} />
          </dl>
          {receipt.estimate ? (
            <div className="mt-6">
              <EstimateSummary locale={locale} estimate={receipt.estimate} id="receipt-estimate" />
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}

const Row = ({ term, value }: { term: string; value: ReactNode }) =>
  value ? (
    <div className="grid gap-1 border-b border-rule py-3 md:grid-cols-3 md:gap-4">
      <dt className="text-[13px] tracking-wide text-ink-muted">{term}</dt>
      <dd className="whitespace-pre-line md:col-span-2">{value}</dd>
    </div>
  ) : null
