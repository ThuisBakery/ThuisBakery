import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Whether a request came from Vercel Cron. Vercel sends the project's `CRON_SECRET` as
 * `Authorization: Bearer <secret>` on every scheduled call, and nothing else knows it.
 *
 * An unset or empty secret lets nobody in, rather than letting in `Bearer ` or
 * `Bearer undefined`. Both sides are hashed before the constant-time comparison, which
 * wants equal lengths, so that the comparison says nothing about the secret's length.
 */
export const isCronRequest = (
  authorization: string | null,
  secret: string | undefined,
): boolean => {
  if (!secret || authorization === null) {
    return false
  }

  const digest = (value: string) => createHash('sha256').update(value).digest()

  return timingSafeEqual(digest(authorization), digest(`Bearer ${secret}`))
}
