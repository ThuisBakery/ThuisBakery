import type { Access, CollectionConfig } from 'payload'

import { DELIVERY_STATUSES, type DeliveryStatus } from '@/domain/delivery-status'
import { ENQUIRY_TYPES, type EnquiryType } from '@/domain/enquiry'
import { LOCALES, type Locale } from '@/domain/routes'

/**
 * Submission — the stored record of an Enquiry. The Enquiry is what the customer sends; the
 * Submission is what the site keeps, and it outlives the emails about it. See CONTEXT.md and
 * ADR-0006.
 *
 * One collection for all three forms, told apart by `enquiryType` (ADR-0003). `read`,
 * `update` and `delete` for a logged-in user — Jana — only.
 *
 * `create` is public in the sense ADR-0006 means — a stranger's Enquiry is stored — but only
 * through the Enquiry route, which marks its write with `FROM_ENQUIRY_ROUTE`. Payload's own
 * REST and GraphQL `create` would otherwise let anyone skip BotID and the honeypot, and set
 * a Delivery status or point `inspirationPhoto` at any file in the private store.
 *
 * **No hook here does I/O**, and none may. An `afterChange` hook fires when Jana edits a
 * Submission in the admin, so one that sent email would silently re-email the customer.
 * Sending belongs to the route handler, after the Submission is stored (ADR-0006).
 *
 * What the customer chose is copied, not related: a Size, Sponge or Filling is stored by
 * its name, and the Estimate as a snapshot, so a later rename or price change never
 * rewrites what the customer asked for and was shown. The Item alone is related, so Jana
 * can click through to it.
 *
 * The Inspiration photo is not an upload relation. It lives in its own private Blob store,
 * apart from Media (ADR-0006), and the Submission holds only its pathname; the admin shows
 * it through `/next/inspiration/<id>`, which is for a logged-in user alone.
 */

const loggedIn: Access = ({ req }) => Boolean(req.user)

/** The `context` flag the Enquiry route writes a Submission with. See `src/lib/enquiry.ts`. */
export const FROM_ENQUIRY_ROUTE = 'fromEnquiryRoute'

const fromEnquiryRoute: Access = ({ req }) =>
  Boolean(req.user) || req.context[FROM_ENQUIRY_ROUTE] === true

/** Which fields the admin shows, by which form a Submission came from. */
type Condition = (data: Partial<Record<string, unknown>>) => boolean

const fromItemPage: Condition = (data) => data['enquiryType'] === 'item'
const notFromItemPage: Condition = (data) => data['enquiryType'] !== 'item'
const hasPickupDate: Condition = (data) => data['enquiryType'] !== 'contact'

const ENQUIRY_TYPE_LABELS: Record<EnquiryType, string> = {
  item: 'Item',
  'custom-order': 'Custom order',
  contact: 'Contact',
}

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  nl: 'Dutch',
}

const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: 'Sending',
  sent: 'Sent',
  delayed: 'Delayed',
  delivered: 'Delivered',
  'not-sent': 'Not sent',
  bounced: 'Bounced',
  failed: 'Failed',
  complained: 'Marked as spam',
}

/** One email's Delivery status, and the id Resend's webhook names it by. */
const deliveryFields = (name: 'toJana' | 'toCustomer', label: string, description: string) => [
  {
    name,
    type: 'select' as const,
    label,
    index: true,
    defaultValue: 'pending' satisfies DeliveryStatus,
    options: DELIVERY_STATUSES.map((value) => ({ label: DELIVERY_STATUS_LABELS[value], value })),
    admin: { readOnly: true, description },
  },
  {
    name: `${name}EmailId`,
    type: 'text' as const,
    index: true,
    admin: { hidden: true },
  },
]

export const Submissions: CollectionConfig = {
  slug: 'submissions',
  labels: {
    singular: 'Submission',
    plural: 'Submissions',
  },
  access: {
    create: fromEnquiryRoute,
    read: loggedIn,
    update: loggedIn,
    delete: loggedIn,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: [
      'name',
      'reference',
      'enquiryType',
      'itemTitle',
      'requestedPickupDate',
      'createdAt',
    ],
    listSearchableFields: ['name', 'email', 'reference', 'itemTitle'],
    description:
      'Every Enquiry customers have sent, newest first. Use Filters to narrow by type, Item, language or Requested pickup date.',
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'reference',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description:
          'The code the customer was shown on their confirmation page, and will quote if they follow up.',
      },
    },
    {
      name: 'delivery',
      type: 'group',
      label: 'Delivery status',
      admin: {
        position: 'sidebar',
        description:
          'Whether the emails about this Enquiry arrived. Nothing is retried: if either says Not sent, Bounced or Failed, reply to the customer yourself.',
      },
      fields: [
        ...deliveryFields('toJana', 'Your copy', 'The email to you.'),
        ...deliveryFields(
          'toCustomer',
          'Customer’s acknowledgement',
          'Bounced usually means a mistyped address: try their phone.',
        ),
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'enquiryType',
          type: 'select',
          required: true,
          index: true,
          options: ENQUIRY_TYPES.map((value) => ({ label: ENQUIRY_TYPE_LABELS[value], value })),
          admin: {
            readOnly: true,
            description: 'Which form this came from.',
            width: '50%',
          },
        },
        {
          name: 'locale',
          type: 'select',
          required: true,
          index: true,
          label: 'Language',
          options: LOCALES.map((value) => ({ label: LOCALE_LABELS[value], value })),
          admin: {
            readOnly: true,
            description: 'The language the customer wrote in — the one to reply in.',
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', required: true, admin: { width: '33%' } },
        { name: 'email', type: 'email', required: true, index: true, admin: { width: '33%' } },
        { name: 'phone', type: 'text', admin: { width: '33%' } },
      ],
    },
    {
      name: 'item',
      type: 'relationship',
      relationTo: 'items',
      index: true,
      admin: {
        condition: fromItemPage,
        description: 'The Item page this was sent from.',
      },
    },
    {
      name: 'itemTitle',
      type: 'text',
      label: 'Item as named',
      admin: {
        readOnly: true,
        condition: fromItemPage,
        description: 'The Item’s title when the customer sent this, in their language.',
      },
    },
    {
      type: 'row',
      admin: {
        condition: fromItemPage,
      },
      fields: [
        { name: 'size', type: 'text', admin: { width: '25%' } },
        { name: 'quantity', type: 'number', min: 1, admin: { width: '25%' } },
        { name: 'sponge', type: 'text', admin: { width: '25%' } },
        { name: 'filling', type: 'text', admin: { width: '25%' } },
      ],
    },
    {
      name: 'requestedPickupDate',
      type: 'date',
      index: true,
      label: 'Requested pickup date',
      admin: {
        condition: hasPickupDate,
        description: 'Requested, never confirmed: only Jana’s reply confirms a date.',
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'd MMMM yyyy',
        },
      },
    },
    {
      name: 'specialRequests',
      type: 'textarea',
      label: 'Special requests',
      admin: {
        condition: fromItemPage,
        description: 'The customer’s own words, never priced by the Estimate.',
      },
    },
    {
      name: 'message',
      type: 'textarea',
      admin: {
        condition: notFromItemPage,
      },
    },
    {
      name: 'inspirationPhoto',
      type: 'text',
      label: 'Inspiration photo',
      admin: {
        readOnly: true,
        condition: (data) => Boolean(data['inspirationPhoto']),
        components: {
          Field: '@/components/admin/InspirationPhotoField#InspirationPhotoField',
        },
      },
    },
    {
      name: 'estimate',
      type: 'group',
      admin: {
        readOnly: true,
        condition: fromItemPage,
        description:
          'Exactly what the customer was shown, stored when they sent it and never recomputed. Provisional: your reply sets the price.',
      },
      fields: [
        {
          name: 'lines',
          type: 'array',
          labels: { singular: 'Line', plural: 'Lines' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', required: true, admin: { width: '40%' } },
                {
                  name: 'unitAmount',
                  type: 'number',
                  required: true,
                  label: 'Each (€)',
                  admin: { width: '20%' },
                },
                { name: 'quantity', type: 'number', required: true, admin: { width: '20%' } },
                {
                  name: 'amount',
                  type: 'number',
                  required: true,
                  label: 'Amount (€)',
                  admin: { width: '20%' },
                },
              ],
            },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'total', type: 'number', label: 'Estimate (€)', admin: { width: '33%' } },
            {
              name: 'currency',
              type: 'select',
              options: [{ label: 'EUR', value: 'EUR' }],
              admin: { width: '33%' },
            },
            {
              name: 'provisional',
              type: 'checkbox',
              defaultValue: true,
              admin: { width: '33%' },
            },
          ],
        },
      ],
    },
  ],
}
