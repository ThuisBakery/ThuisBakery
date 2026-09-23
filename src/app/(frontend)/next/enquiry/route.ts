import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { httpReply, submitEnquiry } from '@/domain/submit-enquiry'
import { loadEnquiryContext, storeSubmission } from '@/lib/enquiry'

/**
 * `POST /next/enquiry` — the one route an Enquiry is sent to, from any of the three forms
 * (ADR-0006). A thin shell: `submitEnquiry` decides everything, and this supplies the clock,
 * the body and the Payload calls.
 *
 * It lives under `/next`, beside the preview route, because `proxy.ts` leaves that segment
 * alone and Payload's own REST API owns `/api`.
 *
 * Store-then-send: the Submission is stored here, and nothing else happens yet. The emails
 * to Jana and to the customer follow in the next step of the pipeline.
 */
export const POST = async (request: Request): Promise<Response> => {
  // A body that is not JSON is simply not an Enquiry; `submitEnquiry` says so.
  const body: unknown = await request.json().catch(() => null)
  const payload = await getPayload({ config: configPromise })

  const outcome = await submitEnquiry(body, {
    now: new Date(),
    load: loadEnquiryContext(payload),
    store: storeSubmission(payload),
  })

  if (outcome.status === 'failed') {
    payload.logger.error({ err: outcome.error, msg: 'An Enquiry could not be stored.' })
  }

  const reply = httpReply(outcome)

  return Response.json(reply.body, { status: reply.status })
}
