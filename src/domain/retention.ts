/**
 * How long a Submission's personal data is kept (ADR-0006), as rules the daily retention
 * run applies: the Inspiration photo is hard-deleted at 12 months, and the Submission is
 * anonymised at 24. The clock is always an argument, so the rules are tested against fixed
 * dates rather than by waiting a year.
 */

const PHOTO_RETENTION_MONTHS = 12

const SUBMISSION_RETENTION_MONTHS = 24

/** The same instant `months` calendar months earlier, in UTC, clamped to the month's end. */
const monthsBefore = (now: Date, months: number): Date => {
  const target = new Date(now)
  const day = now.getUTCDate()

  target.setUTCDate(1)
  target.setUTCMonth(target.getUTCMonth() - months)

  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate()

  target.setUTCDate(Math.min(day, lastDay))

  return target
}

export type RetentionCutoffs = {
  /** A photo sent at or before this is deleted. */
  photo: Date
  /** A Submission created at or before this is anonymised. */
  anonymise: Date
}

export const retentionCutoffs = (now: Date): RetentionCutoffs => ({
  photo: monthsBefore(now, PHOTO_RETENTION_MONTHS),
  anonymise: monthsBefore(now, SUBMISSION_RETENTION_MONTHS),
})

/** Whether a photo sent at `sentAt` has been kept as long as it may be by `now`. */
export const isPhotoDue = (sentAt: Date, now: Date): boolean =>
  sentAt.getTime() <= retentionCutoffs(now).photo.getTime()

/**
 * Name and email are required on a Submission, so they are overwritten rather than emptied.
 * The address is on the `.invalid` top-level domain, which RFC 2606 reserves so that nothing
 * can ever be delivered to it.
 */
const ANONYMISED_NAME = 'Anonymised'

/** Also what a query matches on to leave already-anonymised Submissions out. */
export const ANONYMISED_EMAIL = 'anonymised@example.invalid'

/**
 * What anonymising a Submission writes over it: everything the customer told us about
 * themselves, including their own words, which are as likely as anything to name someone —
 * and the reference, which Jana's copy of the email carries next to the customer's name, and
 * which would otherwise link the row straight back to them. The Item, Size, Sponge, Filling,
 * quantity, dates and Estimate stay — what sold, at what size, in which month — and once the
 * rest is gone, none of that is personal data.
 */
export const anonymisedFields = {
  reference: null,
  name: ANONYMISED_NAME,
  email: ANONYMISED_EMAIL,
  phone: null,
  inspirationPhoto: null,
  specialRequests: null,
  message: null,
} as const
