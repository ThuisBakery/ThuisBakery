import type { GlobalConfig } from 'payload'

import { pageLinkFields } from '@/fields/pageLink'

/**
 * The site header's navigation. Payload names globals "the primary way to structure
 * singletons in Payload, such as a header navigation", so the nav is seeded configuration,
 * not code (ADR-0003). The seed lives in a migration.
 *
 * Four links — Cakes, Nibbles, About, Contact — plus Custom order as a button, because it
 * is a conversion path rather than a section. Marketing and Occasion pages stay out: that
 * is how a five-item menu becomes eleven. The language switcher is not here either; it is
 * part of the shell, not something to edit away.
 */
export const Header: GlobalConfig = {
  slug: 'header',
  label: 'Header',
  fields: [
    {
      name: 'links',
      type: 'array',
      required: true,
      maxRows: 4,
      admin: {
        description: 'The navigation links, in order. Keep it short: four is the design.',
      },
      fields: pageLinkFields,
    },
    {
      name: 'callToAction',
      type: 'group',
      label: 'Button',
      admin: {
        description: 'The one link shown as a button. Custom order, by design.',
      },
      fields: pageLinkFields,
    },
  ],
}
