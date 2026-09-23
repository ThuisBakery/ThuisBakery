import configPromise from '@payload-config'
import { checkBotId } from 'botid/server'
import { getPayload } from 'payload'

import { MAX_PHOTO_BYTES } from '@/domain/inspiration-photo'
import { PHOTO_FIELD, httpReply, submitEnquiry } from '@/domain/submit-enquiry'
import {
  loadEnquiryContext,
  newReference,
  recordDelivery,
  sendEnquiryEmail,
  storeSubmission,
} from '@/lib/enquiry'
import { reencodePhoto } from '@/lib/inspiration-photo'

/**
 * `POST /next/enquiry` — the one route an Enquiry is sent to, from any of the three forms
 * (ADR-0006). A thin shell: `submitEnquiry` decides everything, and this supplies the clock,
 * the body, BotID, Payload, Blob and Resend.
 *
 * It lives under `/next`, beside the preview route, because `proxy.ts` leaves that segment
 * alone and Payload's own REST API owns `/api`. The body is `multipart/form-data`: the
 * form's fields, and the Inspiration photo if one is attached — already downscaled in the
 * browser, so there is no public upload endpoint anywhere. Rate limiting is a Vercel WAF
 * rule on this path, not code.
 */

/** A body this large holds a photo over the limit, and is refused before it is read. */
const MAX_BODY_BYTES = MAX_PHOTO_BYTES + 256 * 1024

export const POST = async (request: Request): Promise<Response> => {
  const payload = await getPayload({ config: configPromise })

  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) {
    const reply = httpReply({ status: 'invalid', problems: { [PHOTO_FIELD]: 'tooLarge' } })

    return Response.json(reply.body, { status: reply.status })
  }

  // A body that is not a form is simply not an Enquiry; `submitEnquiry` says so.
  const form = await request.formData().catch(() => null)
  const file = form?.get(PHOTO_FIELD)
  const photo =
    file instanceof File && file.size > 0 ? new Uint8Array(await file.arrayBuffer()) : null
  const body = form
    ? Object.fromEntries(
        [...form.entries()].flatMap(([key, value]) =>
          typeof value === 'string' ? [[key, value]] : [],
        ),
      )
    : null

  const outcome = await submitEnquiry(
    { body, photo },
    {
      now: new Date(),
      isBot: async () => (await checkBotId()).isBot,
      load: loadEnquiryContext(payload),
      reference: newReference,
      reencode: reencodePhoto,
      store: storeSubmission(payload),
      send: sendEnquiryEmail(payload),
      recordDelivery: recordDelivery(payload),
      jana: process.env.ENQUIRY_INBOX || '',
      report: (msg, err) => payload.logger.error({ err, msg }),
    },
  )

  if (outcome.status === 'failed') {
    payload.logger.error({ err: outcome.error, msg: 'An Enquiry could not be stored.' })
  }

  if (outcome.status === 'refused') {
    payload.logger.warn({ msg: 'BotID refused an Enquiry.' })
  }

  const reply = httpReply(outcome)

  return Response.json(reply.body, { status: reply.status })
}
