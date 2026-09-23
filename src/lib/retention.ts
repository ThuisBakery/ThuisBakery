import type { Payload } from 'payload'

import { ANONYMISED_EMAIL, anonymised, isPhotoDue, retentionCutoffs } from '@/domain/retention'

import { deletePhoto, listPhotos } from './inspiration-photo'

/**
 * The daily retention run (ADR-0006): the Payload and Blob side of the rules in
 * `src/domain/retention.ts`. I/O and no decisions.
 *
 * Each step leaves the next run able to finish it. A photo is deleted from the store before
 * its Submission stops naming it, so a failure in between leaves a pathname to try again
 * rather than a file nothing points at. One Submission failing is logged and skipped, so it
 * cannot hold up the rest.
 *
 * At most `BATCH` Submissions per step per run: whatever is left over is still due tomorrow.
 */

const BATCH = 200

export type RetentionReport = {
  photosDeleted: number
  submissionsAnonymised: number
  strayPhotosDeleted: number
  failures: number
}

export const runRetention = async (payload: Payload, now: Date): Promise<RetentionReport> => {
  const cutoffs = retentionCutoffs(now)
  const report: RetentionReport = {
    photosDeleted: 0,
    submissionsAnonymised: 0,
    strayPhotosDeleted: 0,
    failures: 0,
  }

  const attempt = async (what: string, step: () => Promise<void>): Promise<boolean> => {
    try {
      await step()
      return true
    } catch (error) {
      report.failures += 1
      payload.logger.error({ err: error, msg: `Retention: could not ${what}.` })
      return false
    }
  }

  // Inspiration photos at 12 months.
  const { docs: withPhoto } = await payload.find({
    collection: 'submissions',
    where: {
      and: [
        { createdAt: { less_than_equal: cutoffs.photo.toISOString() } },
        { inspirationPhoto: { exists: true } },
      ],
    },
    depth: 0,
    limit: BATCH,
    pagination: false,
  })

  for (const { id, inspirationPhoto } of withPhoto) {
    const done = await attempt(`delete the photo of Submission ${id}`, async () => {
      if (inspirationPhoto) {
        await deletePhoto(inspirationPhoto)
      }

      await payload.update({ collection: 'submissions', id, data: { inspirationPhoto: null } })
    })

    report.photosDeleted += done ? 1 : 0
  }

  // Submissions at 24 months.
  const { docs: toAnonymise } = await payload.find({
    collection: 'submissions',
    where: {
      and: [
        { createdAt: { less_than_equal: cutoffs.anonymise.toISOString() } },
        { email: { not_equals: ANONYMISED_EMAIL } },
      ],
    },
    depth: 0,
    limit: BATCH,
    pagination: false,
  })

  for (const { id, inspirationPhoto } of toAnonymise) {
    const done = await attempt(`anonymise Submission ${id}`, async () => {
      // Only there if deleting it at 12 months kept failing.
      if (inspirationPhoto) {
        await deletePhoto(inspirationPhoto)
      }

      await payload.update({ collection: 'submissions', id, data: anonymised })
    })

    report.submissionsAnonymised += done ? 1 : 0
  }

  // Any photo in the store past 12 months, whatever does or does not name it: one whose
  // Submission Jana deleted in the admin, or one a failed Enquiry could not clean up after.
  for await (const { pathname, uploadedAt } of listPhotos()) {
    if (isPhotoDue(uploadedAt, now)) {
      const done = await attempt(`delete stray photo ${pathname}`, () => deletePhoto(pathname))

      report.strayPhotosDeleted += done ? 1 : 0
    }
  }

  return report
}
