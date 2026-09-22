import type { GlobalConfig } from 'payload'

import { pageLinkFields } from '@/fields/pageLink'

/**
 * The site footer. It links every coded page in the inventory, in each locale's own terms
 * (ADR-0003's internal-linking rules). Seeded, not coded: the seed lives in a migration.
 */
export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  fields: [
    {
      name: 'tagline',
      type: 'textarea',
      required: true,
      localized: true,
      admin: {
        description: 'The short line under the name.',
      },
    },
    {
      name: 'links',
      type: 'array',
      required: true,
      admin: {
        description: 'Every page on the site, in order.',
      },
      fields: pageLinkFields,
    },
  ],
}
