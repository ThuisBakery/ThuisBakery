import { randomInt } from 'node:crypto'
import type { Payload } from 'payload'

import {
  nextDeliveryStatus,
  type DeliveryEvent,
  type DeliveryStatus,
} from '@/domain/delivery-status'
import { FROM_ENQUIRY_ROUTE } from '@/collections/Submissions'
import { itemOffer } from '@/domain/enquiry'
import { itemLeadTime } from '@/domain/item'
import { leadTimeOf } from '@/domain/lead-time'
import { closedUntilDate } from '@/domain/pickup-date'
import { enquiryReference } from '@/domain/reference'
import type { SubmitDependencies } from '@/domain/submit-enquiry'

import { deletePhoto, putPhoto } from './inspiration-photo'

/**
 * The Payload and Resend side of the Enquiry pipeline: what `submitEnquiry` is handed as its
 * `load`, `store`, `send` and `recordDelivery`. I/O and no decisions — those are all in
 * `src/domain`.
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
  async ({ estimate, ...data }, photo) => {
    const inspirationPhoto = photo ? await putPhoto(photo) : null

    try {
      await payload.create({
        collection: 'submissions',
        // Held to the collection's own access rules rather than the local API's default of
        // overriding them: this write is made on a stranger's behalf, and the flag below is
        // the one thing that lets it through.
        overrideAccess: false,
        context: { [FROM_ENQUIRY_ROUTE]: true },
        data: { ...data, ...(estimate ? { estimate } : {}), inspirationPhoto },
      })
    } catch (error) {
      // No Submission, so nothing will ever point at the photo or delete it at 12 months.
      if (inspirationPhoto) {
        await deletePhoto(inspirationPhoto).catch(() => {})
      }

      throw error
    }
  }

/**
 * One email through Payload's email adapter — Resend (`payload.config.ts`). Resend answers
 * with the id its webhook will use; without an adapter, Payload only logs the email and
 * answers nothing, which counts as not sent.
 */
export const sendEnquiryEmail =
  (payload: Payload): SubmitDependencies['send'] =>
  async ({ to, replyTo, subject, text, html }) => {
    const sent: unknown = await payload.sendEmail({ to, replyTo, subject, text, html })

    const id =
      typeof sent === 'object' && sent !== null && 'id' in sent && typeof sent.id === 'string'
        ? sent.id
        : null

    if (!id) {
      throw new Error('No email adapter answered with an id; the email was not sent.')
    }

    return id
  }

export const recordDelivery =
  (payload: Payload): SubmitDependencies['recordDelivery'] =>
  async (reference, { toJana, toCustomer }) => {
    const { docs } = await payload.find({
      collection: 'submissions',
      where: { reference: { equals: reference } },
      depth: 0,
      limit: 1,
      pagination: false,
    })
    const current = docs[0]

    if (!current) {
      throw new Error(`No Submission ${reference} to record delivery on.`)
    }

    // A webhook may already have moved a status on in the moments since sending.
    await payload.update({
      collection: 'submissions',
      id: current.id,
      data: {
        delivery: {
          toJana: nextDeliveryStatus(current.delivery?.toJana ?? null, toJana.status),
          toJanaEmailId: toJana.emailId,
          toCustomer: nextDeliveryStatus(current.delivery?.toCustomer ?? null, toCustomer.status),
          toCustomerEmailId: toCustomer.emailId,
        },
      },
    })
  }

/**
 * A Resend webhook event written to the Submission its email belongs to. `false` when no
 * Submission names that email yet — the webhook can outrun `recordDelivery` — so the route
 * can ask Resend to try again later.
 */
export const applyDeliveryEvent = async (
  payload: Payload,
  { emailId, status }: DeliveryEvent,
): Promise<boolean> => {
  const { docs } = await payload.find({
    collection: 'submissions',
    where: {
      or: [
        { 'delivery.toJanaEmailId': { equals: emailId } },
        { 'delivery.toCustomerEmailId': { equals: emailId } },
      ],
    },
    depth: 0,
    limit: 1,
    pagination: false,
  })
  const submission = docs[0]

  if (!submission) {
    return false
  }

  const which = submission.delivery?.toJanaEmailId === emailId ? 'toJana' : 'toCustomer'
  const current: DeliveryStatus | null = submission.delivery?.[which] ?? null

  await payload.update({
    collection: 'submissions',
    id: submission.id,
    data: { delivery: { [which]: nextDeliveryStatus(current, status) } },
  })

  return true
}

/** A reference from a cryptographic source, so one customer's cannot be guessed from another's. */
export const newReference: SubmitDependencies['reference'] = () => enquiryReference(randomInt)
