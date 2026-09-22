import type { CollectionConfig } from 'payload'

/**
 * Sponge — a cake base a customer can choose: Chocolate, Vanilla, Funfetti, Red Velvet.
 * A shared collection, reused across every Configurable Item rather than written out per
 * Item, so adding a base adds it everywhere. See CONTEXT.md.
 */
export const Sponges: CollectionConfig = {
  slug: 'sponges',
  labels: {
    singular: 'Sponge',
    plural: 'Sponges',
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
