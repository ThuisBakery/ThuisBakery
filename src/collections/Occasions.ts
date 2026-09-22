import type { CollectionConfig } from 'payload'

/**
 * Occasion — what an Item is bought for: birthday, wedding, baby shower.
 *
 * An optional tag on an Item, used to build landing pages, **never** to organise the
 * menu; the menu is organised by Category and only by Category. See CONTEXT.md and
 * ADR-0003, where Occasion pages are marketing pages Jana writes when she has something
 * to say, rather than a page generated per tag.
 */
export const Occasions: CollectionConfig = {
  slug: 'occasions',
  labels: {
    singular: 'Occasion',
    plural: 'Occasions',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
  ],
}
