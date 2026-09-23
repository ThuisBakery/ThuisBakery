import type { Receipt } from '@/domain/submit-enquiry'

/**
 * Where the form keeps an Enquiry's receipt for the confirmation page, for this tab only.
 * The confirmation page is static, so this hand-over is the only way it learns what was sent.
 *
 * Storage can be blocked or full. Either side failing costs the customer the receipt, never
 * the Enquiry: the page still says what happens next.
 */
const RECEIPT_KEY = 'thuisbakery:receipt'

export const keepReceipt = (receipt: Receipt): void => {
  try {
    sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(receipt))
  } catch {
    // See above: the confirmation page copes without it.
  }
}

/** The kept receipt as stored text, or `null`; `parseReceipt` decides whether it is one. */
export const readKeptReceipt = (): string | null => {
  try {
    return sessionStorage.getItem(RECEIPT_KEY)
  } catch {
    return null
  }
}
