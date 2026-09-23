import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { readPhoto } from '@/lib/inspiration-photo'

/**
 * `GET /next/inspiration/<id>` — a Submission's Inspiration photo, for Jana in the admin. The
 * photo is private (ADR-0006), so this is the only way to see it: Payload's own session,
 * read from the cookies as the preview route does, and the Submission's own `read` access.
 */
export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> => {
  const { id } = await params
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return new Response('You must be logged in.', { status: 401 })
  }

  const submission = await payload
    .findByID({ collection: 'submissions', id, depth: 0, overrideAccess: false, user })
    .catch(() => null)
  const stream = submission?.inspirationPhoto ? await readPhoto(submission.inspirationPhoto) : null

  if (!stream) {
    return new Response('No photo.', { status: 404 })
  }

  return new Response(stream, {
    headers: {
      'content-type': 'image/jpeg',
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
    },
  })
}
