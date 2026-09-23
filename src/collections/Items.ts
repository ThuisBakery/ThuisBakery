import type { CollectionConfig } from 'payload'
import { ValidationError } from 'payload'

import { isWholeLeadTimeOverride } from '@/domain/lead-time'
import { PAIRING_MESSAGE, leadTimeFields } from '@/fields/leadTime'
import { slugField } from '@/fields/slug'
import { DRAFTS_WITH_AUTOSAVE } from '@/versions'

/**
 * Item — something Jana sells, whether or not it is a cake. Cakes, cookies and brownies
 * are all Items; there is no separate Product or Cake type. See CONTEXT.md.
 *
 * Configurability is a *property* of an Item rather than a second content type: an Item
 * that comes one way is simply one Size with `configurable` off. That is the whole reason
 * this collection is singular.
 *
 * Drafts plus autosave are on because Live Preview requires them, and because Jana's work
 * should survive the browser. Publishing is a whole-document state, never per locale:
 * `localizeStatus` stays off in the root config, so an Item is Published only once it is
 * complete in both English and Dutch. That is a handover rule Jana applies, not readiness
 * logic this code derives.
 */
export const Items: CollectionConfig = {
  slug: 'items',
  labels: {
    singular: 'Item',
    plural: 'Items',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'configurable', '_status'],
  },
  versions: {
    drafts: DRAFTS_WITH_AUTOSAVE,
    // Autosave writes a version per pause in typing, so an unbounded history is a
    // database that grows with keystrokes rather than with work.
    maxPerDoc: 20,
  },
  hooks: {
    /**
     * Lead time is a number of days *and* a time of day, so half an override is rejected
     * here rather than by the two fields' own validators: Payload does not re-run a
     * sibling's validator when only the other field changes, so clearing the days while a
     * time remained would otherwise pass.
     */
    beforeValidate: [
      ({ data }) => {
        if (data && !isWholeLeadTimeOverride(data.leadTime ?? {})) {
          throw new ValidationError({
            errors: [{ message: PAIRING_MESSAGE, path: 'leadTime' }],
          })
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    slugField(
      'The last part of this Item’s URL, in this locale’s own words — apple-pie, appeltaart.',
    ),
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      hasMany: false,
      admin: {
        position: 'sidebar',
        description:
          'Exactly one. The Category also decides which catalogue page this Item lives under.',
      },
    },
    {
      name: 'occasions',
      type: 'relationship',
      relationTo: 'occasions',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Optional. Used to build landing pages — never to organise the menu.',
      },
    },
    {
      name: 'photographs',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description: 'The first photograph is the one the catalogue page shows.',
      },
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
    },
    {
      name: 'configurable',
      type: 'checkbox',
      defaultValue: false,
      label: 'Configurable',
      admin: {
        description:
          'On: the customer chooses a Sponge and a Filling from the shared lists. Off: this Item is sold exactly as described.',
      },
    },
    {
      name: 'sponges',
      type: 'relationship',
      relationTo: 'sponges',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => Boolean(siblingData['configurable']),
        description:
          'Which of the shared Sponges a customer may choose for this Item. Leave empty to offer every Sponge.',
      },
    },
    {
      name: 'fillings',
      type: 'relationship',
      relationTo: 'fillings',
      hasMany: true,
      admin: {
        condition: (_, siblingData) => Boolean(siblingData['configurable']),
        description:
          'Which of the shared Fillings a customer may choose. Leave empty to offer every Filling. A Filling’s Surcharge is set on the Filling, never here.',
      },
    },
    {
      name: 'sizes',
      type: 'array',
      required: true,
      minRows: 1,
      labels: {
        singular: 'Size',
        plural: 'Sizes',
      },
      admin: {
        description:
          'A priced variant of this Item. An Item that comes only one way has exactly one Size.',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'What a customer calls this Size — Small, 6 inch, Bento.',
          },
        },
        {
          name: 'diameter',
          type: 'number',
          min: 0,
          admin: {
            description: 'Centimetres. Leave empty for an Item that is not round.',
            width: '33%',
          },
        },
        {
          name: 'layers',
          type: 'number',
          min: 1,
          admin: {
            description: 'Layer count.',
            width: '33%',
          },
        },
        {
          name: 'servings',
          type: 'number',
          min: 1,
          admin: {
            description: 'Serving count.',
            width: '33%',
          },
        },
        {
          name: 'price',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            description: 'Euros. Shown on the page — the Estimate and the page must agree.',
            step: 0.5,
          },
        },
      ],
    },
    {
      name: 'allergens',
      type: 'relationship',
      relationTo: 'allergens',
      hasMany: true,
      admin: {
        description:
          'What this Item contains. The cross-contamination statement is site-wide and is never written here.',
      },
    },
    {
      name: 'leadTime',
      type: 'group',
      label: 'Lead time override',
      admin: {
        description:
          'Only for an Item that needs more notice than the site-wide Lead time. Days and time of day are a pair — set both, or clear both.',
      },
      fields: leadTimeFields({ required: false }),
    },
  ],
}
