import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Webhook } from 'svix'

import { deliveryEvent } from '@/domain/delivery-status'
import { applyDeliveryEvent } from '@/lib/enquiry'

/**
 * `POST /next/resend-webhook` — Resend telling us where an email got to, which becomes the
 * Submission's Delivery status (ADR-0006). Resend signs with Svix; the signature is checked
 * against the raw body before anything in it is believed.
 *
 * Answering anything but 2xx makes Resend try again, on a schedule from five seconds to ten
 * hours. That is used once, on purpose: an event about an email no Submission names yet is
 * one that outran the Enquiry route's own write, and is answered 404 so it comes back.
 */
export const POST = async (request: Request): Promise<Response> => {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  const payload = await getPayload({ config: configPromise })

  if (!secret) {
    payload.logger.error({ msg: 'RESEND_WEBHOOK_SECRET is not set; a delivery event was dropped.' })
    return new Response(null, { status: 500 })
  }

  const raw = await request.text()
  let verified: unknown

  try {
    verified = new Webhook(secret).verify(raw, {
      'svix-id': request.headers.get('svix-id') ?? '',
      'svix-timestamp': request.headers.get('svix-timestamp') ?? '',
      'svix-signature': request.headers.get('svix-signature') ?? '',
    })
  } catch {
    return new Response(null, { status: 401 })
  }

  const event = deliveryEvent(verified)

  // Opens, clicks and anything else that says nothing about arrival.
  if (!event) {
    return new Response(null, { status: 204 })
  }

  return (await applyDeliveryEvent(payload, event))
    ? new Response(null, { status: 204 })
    : new Response(null, { status: 404 })
}
