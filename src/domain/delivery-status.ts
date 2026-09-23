/**
 * Delivery status: whether an email about a Submission reached anyone — a property of the
 * notification, never of the Enquiry (CONTEXT.md). Set to `sent` or `not-sent` by the route
 * that sends it, then moved on by Resend's webhook (ADR-0006).
 *
 * Resend does not promise its events arrive in order, so a status only ever moves forward:
 * a late `sent` never undoes a `delivered`. Retrying is deliberately absent — the status is
 * how a failure is noticed, not how it is fixed.
 */

export const DELIVERY_STATUSES = [
  'pending',
  'sent',
  'delayed',
  'delivered',
  'not-sent',
  'bounced',
  'failed',
  'complained',
] as const

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number]

/** How far an email has got. A problem outranks everything, because nothing follows one. */
const PROGRESS: Record<DeliveryStatus, number> = {
  pending: 0,
  sent: 1,
  delayed: 2,
  delivered: 3,
  'not-sent': 4,
  bounced: 4,
  failed: 4,
  complained: 4,
}

/** Resend's event types that say where an email is. Opens and clicks do not. */
const EVENT_STATUS: Partial<Record<string, DeliveryStatus>> = {
  'email.sent': 'sent',
  'email.delivery_delayed': 'delayed',
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.failed': 'failed',
  // Resend refused to try: the address bounced or complained before.
  'email.suppressed': 'failed',
}

export type DeliveryEvent = { emailId: string; status: DeliveryStatus }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** A verified Resend webhook body as the email it is about and where that email now is. */
export const deliveryEvent = (body: unknown): DeliveryEvent | null => {
  if (!isRecord(body) || typeof body['type'] !== 'string' || !isRecord(body['data'])) {
    return null
  }

  const status = EVENT_STATUS[body['type']]
  const emailId = body['data']['email_id']

  return status && typeof emailId === 'string' && emailId !== '' ? { emailId, status } : null
}

/** The status after `incoming`: it replaces `current` only by moving the email forward. */
export const nextDeliveryStatus = (
  current: DeliveryStatus | null,
  incoming: DeliveryStatus,
): DeliveryStatus =>
  current === null || PROGRESS[incoming] > PROGRESS[current] ? incoming : current
