/**
 * The Estimate: the running figure shown as a customer fills in an Enquiry, covering Size,
 * quantity and Surcharges **and nothing else**. Everything personalised is priced by Jana in
 * her reply, not by the page. See CONTEXT.md.
 *
 * The shape is the snapshot a Submission stores (ADR-0006) — the figure and its line items,
 * never recomputed — so it is the contract, not an implementation detail.
 */

export type EstimateLine = {
  label: string
  unitAmount: number
  quantity: number
  amount: number
}

export type Estimate = {
  /** One per Size, then one per surcharging Filling. */
  lines: EstimateLine[]
  /** The sum of the line amounts. */
  total: number
  currency: 'EUR'
  /** Never absent, never false: an Estimate is not a price. */
  provisional: true
}

/** What an Estimate is worked out from: one Size, how many, and the Filling if any. */
export type EstimateChoice = {
  size: { label: string; price: number }
  quantity: number
  filling?: { name: string; surcharge?: number | null | undefined } | null
}

// Euros are stored with cents; adding them as floats leaves `30.299999…`.
const toCents = (euros: number): number => Math.round(euros * 100)
const toEuros = (cents: number): number => cents / 100

const line = (label: string, unitAmount: number, quantity: number): EstimateLine => ({
  label,
  unitAmount,
  quantity,
  amount: toEuros(toCents(unitAmount) * quantity),
})

export const estimate = ({ size, quantity, filling }: EstimateChoice): Estimate => {
  const lines = [line(size.label, size.price, quantity)]

  if (filling && typeof filling.surcharge === 'number' && filling.surcharge > 0) {
    lines.push(line(filling.name, filling.surcharge, quantity))
  }

  return {
    lines,
    total: toEuros(lines.reduce((sum, each) => sum + toCents(each.amount), 0)),
    currency: 'EUR',
    provisional: true,
  }
}
