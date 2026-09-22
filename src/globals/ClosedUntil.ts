import type { GlobalConfig } from 'payload'

import { DRAFTS_WITH_AUTOSAVE } from '@/versions'

/**
 * Closed until — a single date Jana sets when she is away or full, which blocks earlier
 * Requested pickup dates and shows a notice. The whole of the site's availability logic:
 * no calendar, no blackout ranges, no holiday mode. See CONTEXT.md.
 *
 * Empty means open, so the field is deliberately not required — clearing the date is how
 * Jana reopens.
 */
export const ClosedUntil: GlobalConfig = {
  slug: 'closed-until',
  label: 'Closed until',
  versions: {
    drafts: DRAFTS_WITH_AUTOSAVE,
  },
  fields: [
    {
      name: 'date',
      type: 'date',
      label: 'Closed until',
      admin: {
        description:
          'Leave empty when open. While set, a customer cannot ask to collect before this date, and the site says so.',
        date: {
          pickerAppearance: 'dayOnly',
          displayFormat: 'd MMMM yyyy',
        },
      },
    },
    {
      name: 'notice',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'What the site says while closed. Shown only when a date is set.',
      },
    },
  ],
}
