import { DICTIONARY } from '@/domain/dictionary'
import type { Estimate } from '@/domain/estimate'
import { formatEuros } from '@/domain/menu'
import type { Locale } from '@/domain/routes'

/**
 * An Estimate as a customer reads it: one line per Size and surcharging Filling, then the
 * figure — headed "Estimate" and marked provisional, never called a price, a total or a
 * quote (CONTEXT.md). The same panel on the form, where it runs, and on the receipt, where it
 * is the snapshot that was stored.
 */
export const EstimateSummary = ({
  locale,
  estimate,
  id,
  live = false,
}: {
  locale: Locale
  estimate: Estimate
  /** Prefixes the heading's id, which names the region. */
  id: string
  /** Announce changes: true on the form, where the figure follows the customer's choices. */
  live?: boolean
}) => {
  const words = DICTIONARY[locale].enquiry

  return (
    <section
      aria-labelledby={`${id}-heading`}
      aria-live={live ? 'polite' : undefined}
      className="border border-rule bg-raised px-4 py-4"
    >
      <h3
        id={`${id}-heading`}
        className="flex items-center justify-between gap-4 font-sans text-[13px] tracking-wide text-ink-muted"
      >
        {words.estimate}
        <span className="border border-rule px-2 py-0.5 text-[12px] uppercase">
          {words.provisional}
        </span>
      </h3>
      <ul className="mt-3 grid gap-1.5 text-sm">
        {estimate.lines.map((line) => (
          <li key={line.label} className="flex items-baseline justify-between gap-4">
            <span>{words.line(line.label, line.quantity)}</span>
            <span className="tabular-nums">{formatEuros(line.amount, locale)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-baseline justify-between gap-4 border-t border-rule pt-3">
        <span className="font-display text-xl">{words.estimate}</span>
        <span className="font-display text-2xl tabular-nums">
          {formatEuros(estimate.total, locale)}
        </span>
      </p>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{words.estimateNote}</p>
    </section>
  )
}
