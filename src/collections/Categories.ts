import type { CollectionConfig } from 'payload'

import { CATALOGUES, CATALOGUE_LABELS } from '@/domain/routes'

/**
 * Category — a tier of Jana's menu ladder: Proefhapjes, Bento, Indulgent, Specialty,
 * Nibbles. Every Item belongs to exactly one, and it is what the menu page is organised
 * by. See CONTEXT.md.
 *
 * `catalogue` is the cakes/nibbles split from ADR-0003, deliberately modelled as a
 * property *on* Category rather than as a hard-coded list of cake Categories: a sixth
 * Category is then a content change rather than a code change.
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Category',
    plural: 'Categories',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'catalogue', 'order'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description:
          'Jana’s own name for the tier — Proefhapjes, Bento, Indulgent, Specialty, Nibbles.',
      },
    },
    {
      name: 'catalogue',
      type: 'select',
      required: true,
      // Not localized: which catalogue page a Category belongs to is one fact about the
      // Category, not a translation of one.
      options: CATALOGUES.map((catalogue) => ({
        label: CATALOGUE_LABELS[catalogue],
        value: catalogue,
      })),
      admin: {
        description:
          'Which catalogue page this tier appears on. Cakes are Configurable and are bought as a conversation; Nibbles are fixed and are bought as a quantity.',
      },
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        description: 'Where this tier sits on the catalogue page. Lowest first.',
      },
    },
  ],
}
