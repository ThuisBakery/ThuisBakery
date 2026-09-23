import type { Access, CollectionConfig } from 'payload'

import { ENQUIRY_TYPES, type EnquiryType } from '@/domain/enquiry'
import { LOCALES, type Locale } from '@/domain/routes'

/**
 * Submission — the stored record of an Enquiry. The Enquiry is what the customer sends; the
 * Submission is what the site keeps, and it outlives the emails about it. See CONTEXT.md and
 * ADR-0006.
 *
 * One collection for all three forms, told apart by `enquiryType` (ADR-0003). Public
 * `create`; `read`, `update` and `delete` for a logged-in user — Jana — only.
 *
 * **No hook here does I/O**, and none may. An `afterChange` hook fires when Jana edits a
 * Submission in the admin, so one that sent email would silently re-email the customer.
 * Sending belongs to the route handler, after the Submission is stored (ADR-0006).
 *
 * What the customer chose is copied, not related: a Size, Sponge or Filling is stored by
 * its name, and the Estimate as a snapshot, so a later rename or price change never
 * rewrites what the customer asked for and was shown. The Item alone is related, so Jana
 * can click through to it.
 */

const loggedIn: Access = ({ req }) => Boolean(req.user)

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

export const Submissions: CollectionConfig = {
  slug: 'submissions',
  labels: {
    singular: 'Submission',
    plural: 'Submissions',
  },
  access: {
    create: () => true,
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
