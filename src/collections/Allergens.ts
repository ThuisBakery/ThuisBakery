import type { CollectionConfig } from 'payload'

/**
 * Allergen — one of the substances an Item contains, carrying a name and an icon.
 * Distinct from a dietary claim: "contains egg" is an Allergen, "vegan" is not.
 * See CONTEXT.md.
 *
 * The site-wide cross-contamination statement is a Global, never written per Allergen or
 * per Item.
 */
export const Allergens: CollectionConfig = {
  slug: 'allergens',
  labels: {
    singular: 'Allergen',
    plural: 'Allergens',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'icon'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
  ],
}
