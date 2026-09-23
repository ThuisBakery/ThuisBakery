import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { isCronRequest } from '@/lib/cron'
import { runRetention } from '@/lib/retention'

/**
 * `GET /next/retention` — the daily retention run, called by Vercel Cron at 03:00 UTC
 * (`vercel.json`): Inspiration photos deleted at 12 months, Submissions anonymised at 24
 * (ADR-0006). This is the project's one piece of scheduled infrastructure.
 *
 * Nobody but Vercel Cron gets in: it sends `CRON_SECRET` as a bearer token, and anything
 * without it is answered 401 before Payload is even started.
 */
export const GET = async (request: Request): Promise<Response> => {
  if (!isCronRequest(request.headers.get('authorization'), process.env.CRON_SECRET)) {
    return new Response(null, { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })
  const report = await runRetention(payload, new Date())

  payload.logger.info({ msg: 'Retention run finished.', ...report })

  // A failure is already logged per Submission; a 500 also marks the run failed in Vercel's
  // cron log, which is where anyone would look.
  return Response.json(report, { status: report.failures > 0 ? 500 : 200 })
}
