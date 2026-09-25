import type { ReactNode } from 'react'

import { INLINE_LINK } from '@/components/site/pressable'
import { DICTIONARY } from '@/domain/dictionary'
import type { Estimate } from '@/domain/estimate'
import type { Locale } from '@/domain/routes'

import { EstimateSummary } from './EstimateSummary'

/**
 * What a stepped sheet shows once Jana has the Enquiry, in place of its steps (ADR-0007):
 * when to expect her reply and where, a summary of what was asked, and how to follow up
 * directly if nothing arrives. The sheet's title says "Sent to Jana"; its foot holds the
 * way back.
 *
 * The summary is written from what the customer chose, so it is there even when the route
 * handler sends no receipt back. The reference is shown when it does.
 */
export const EnquiryConfirmation = ({
  locale,
  email,
  replyDays,
  reference,
  rows,
  estimate,
  contactPath,
}: {
  locale: Locale
  email: string
  /** The Lead time's days: how long to wait for Jana's reply. */
  replyDays: number | null
  reference: string | null
  /** What was asked, as term and value; a row with no value is left out. */
  rows: { term: string; value: ReactNode }[]
  estimate: Estimate | null
  contactPath: string
}) => {
  const words = DICTIONARY[locale]

  return (
    <div className="mt-5 grid gap-5">
      <div className="grid gap-2 leading-relaxed">
        {replyDays !== null ? <p className="text-lg">{words.sent.byWhen(replyDays)}</p> : null}
        <p className="text-ink-muted">{words.enquiry.replyTo(email)}</p>
      </div>

      <section aria-labelledby="enquiry-summary-heading">
        <div className="flex items-baseline justify-between gap-4">
          <h3
            id="enquiry-summary-heading"
            className="font-sans text-[13px] tracking-wide text-ink-muted"
          >
            {words.sent.receipt}
          </h3>
          {reference ? (
            <p className="text-sm text-ink-muted tabular-nums">{words.sent.reference(reference)}</p>
          ) : null}
        </div>
        <dl className="mt-2 border-t border-rule">
          {rows.map(({ term, value }) =>
            value ? (
              <div key={term} className="flex justify-between gap-4 border-b border-rule py-2.5">
                <dt className="text-ink-muted">{term}</dt>
                <dd className="text-right whitespace-pre-line">{value}</dd>
              </div>
            ) : null,
          )}
        </dl>
      </section>

      {estimate ? (
        <EstimateSummary locale={locale} estimate={estimate} id="enquiry-sent-estimate" />
      ) : null}

      <p className="text-sm leading-relaxed text-ink-muted">
        {words.sent.followUp}{' '}
        <a href={contactPath} className={`text-ink ${INLINE_LINK}`}>
          {words.pageTitles.contact}
        </a>
      </p>
    </div>
  )
}
