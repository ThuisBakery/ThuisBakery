import { randomInt } from 'node:crypto'
import type { Payload } from 'payload'

import { itemOffer } from '@/domain/enquiry'
import { itemLeadTime } from '@/domain/item'
import { leadTimeOf } from '@/domain/lead-time'
import { closedUntilDate } from '@/domain/pickup-date'
import { enquiryReference } from '@/domain/reference'
import type { SubmitDependencies } from '@/domain/submit-enquiry'

/**
 * The Payload side of the Enquiry pipeline: what `submitEnquiry` is handed as its `load` and
 * `store`. Reads and one write, and no decisions — those are all in `src/domain`.
 *
 * Everything is read fresh, not from the static page: the page was built at deploy time, and
 * a price, Lead time or Closed until changed since must still be what an Enquiry is judged
 * and stored against.
 */

export const loadEnquiryContext =
  (payload: Payload): SubmitDependencies['load'] =>
  async ({ item: id, locale }) => {
    const [items, { docs: sponges }, { docs: fillings }, leadTime, closedUntil] = await Promise.all(
      [
        id === null
          ? { docs: [] }
          : payload.find({
              collection: 'items',
              // Only a Published Item has a page an Enquiry could have been sent from.
              where: { and: [{ id: { equals: id } }, { _status: { equals: 'published' } }] },
              depth: 0,
              locale,
              limit: 1,
              pagination: false,
            }),
        payload.find({ collection: 'sponges', locale, depth: 0, pagination: false }),
        payload.find({ collection: 'fillings', locale, depth: 0, pagination: false }),
        payload.findGlobal({ slug: 'lead-time', depth: 0 }),
        payload.findGlobal({ slug: 'closed-until', depth: 0 }),
      ],
    )

    const item = items.docs[0] ?? null

    return {
      item: item ? itemOffer(item, sponges, fillings) : null,
      leadTime: leadTimeOf(itemLeadTime(leadTime, item?.leadTime)),
      closedUntil: closedUntilDate(closedUntil.date),
    }
  }

export const storeSubmission =
  (payload: Payload): SubmitDependencies['store'] =>
  async ({ estimate, ...data }) => {
    await payload.create({
      collection: 'submissions',
      // Held to the collection's own access rules — public `create` — rather than the local
      // API's default of overriding them: this write is made on a stranger's behalf.
      overrideAccess: false,
      data: { ...data, ...(estimate ? { estimate } : {}) },
    })
  }

/** A reference from a cryptographic source, so one customer's cannot be guessed from another's. */
export const newReference: SubmitDependencies['reference'] = () => enquiryReference(randomInt)
