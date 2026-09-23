import type { Payload, Where } from 'payload'

import {
  ANONYMISED_EMAIL,
  anonymisedFields,
  isPhotoDue,
  retentionCutoffs,
} from '@/domain/retention'
import type { Submission } from '@/payload-types'

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
 * At most `MAX_PER_RUN` Submissions per step: whatever is left over is still due tomorrow.
 */

const MAX_PER_RUN = 200

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

  /** Runs one step, counting it under `counter` if it worked and as a failure if not. */
  const attempt = async (
    counter: Exclude<keyof RetentionReport, 'failures'>,
    what: string,
    step: () => Promise<void>,
  ): Promise<void> => {
    try {
      await step()
      report[counter] += 1
    } catch (error) {
      report.failures += 1
      payload.logger.error({ err: error, msg: `Retention: could not ${what}.` })
    }
  }

  const createdBy = async (cutoff: Date, where: Where) =>
    (
      await payload.find({
        collection: 'submissions',
        where: { and: [{ createdAt: { less_than_equal: cutoff.toISOString() } }, where] },
        sort: 'createdAt',
        depth: 0,
        limit: MAX_PER_RUN,
        pagination: false,
      })
    ).docs

  // A photo whose Submission is due for either step goes first, then the Submission is
  // written. Anonymising only finds one if deleting it on time kept failing.
  const withoutPhoto = async (
    id: number,
    photo: Submission['inspirationPhoto'],
    data: Partial<Submission>,
  ) => {
    if (photo) {
      await deletePhoto(photo)
    }

    await payload.update({ collection: 'submissions', id, data })
  }

  for (const { id, inspirationPhoto } of await createdBy(cutoffs.photo, {
    inspirationPhoto: { exists: true },
  })) {
    await attempt('photosDeleted', `delete the photo of Submission ${id}`, () =>
      withoutPhoto(id, inspirationPhoto, { inspirationPhoto: null }),
    )
  }

  for (const { id, inspirationPhoto } of await createdBy(cutoffs.anonymise, {
    email: { not_equals: ANONYMISED_EMAIL },
  })) {
    await attempt('submissionsAnonymised', `anonymise Submission ${id}`, () =>
      withoutPhoto(id, inspirationPhoto, anonymisedFields),
    )
  }

  // Any photo in the store past its time, whatever does or does not name it: one whose
  // Submission Jana deleted in the admin, or one a failed Enquiry could not clean up after.
  for await (const { pathname, uploadedAt } of listPhotos()) {
    if (isPhotoDue(uploadedAt, now)) {
      await attempt('strayPhotosDeleted', `delete stray photo ${pathname}`, () =>
        deletePhoto(pathname),
      )
    }
  }

  return report
}
