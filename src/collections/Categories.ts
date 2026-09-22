import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

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
    defaultColumns: ['name', 'catalogue', 'order', 'price'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description:
          'Jana’s own name for this Category — Proefhapjes, Cheeky Bento Cakes, Indulgent Cakes, Specialty Cakes, Nibbles.',
      },
    },
    // The section anchor on the catalogue page — /cakes#bento. Not localized: one anchor
    // per Category in both languages, so a shared link lands in the same place.
    slugField({
      useAsSlug: 'name',
      position: 'sidebar',
      overrides: (row) => {
        const slug = row.fields.find((field) => 'name' in field && field.name === 'slug')

        if (slug && 'admin' in slug) {
          slug.admin = {
            ...slug.admin,
            description:
              'Where the catalogue page scrolls to for this Category — /cakes#bento. Changing it breaks links people have shared.',
          }
        }

        return row
      },
    }),
    {
      name: 'tagline',
      type: 'text',
      required: true,
      localized: true,
      admin: {
        description: 'The line under the name on the card — “Mini Cakes for Big Moments”.',
      },
    },
    {
      name: 'note',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Optional. The italic line beneath, where the card has one — “personalisation available on request”.',
      },
    },
    {
      name: 'photograph',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description:
          'The photograph this Category is shown as. Set its focal point on the photograph itself, so the cake stays in frame when the menu crops it.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          min: 0,
          admin: {
            description:
              'Euros, as on the card — 29. Leave empty for a Category priced Item by Item, like Specialty or Nibbles.',
            step: 0.5,
            width: '50%',
          },
        },
        {
          name: 'priceFrom',
          type: 'checkbox',
          label: 'Starting price',
          defaultValue: false,
          admin: {
            description: 'Shows “from €25” rather than “€25”.',
            condition: (_, siblingData) => typeof siblingData['price'] === 'number',
            width: '50%',
          },
        },
      ],
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
