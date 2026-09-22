import type { CollectionConfig } from 'payload'

/**
 * Filling — a topping-and-filling a customer can choose: Cream Cheese, Salted Caramel,
 * Ganache. Shared like Sponge, and may carry a Surcharge. See CONTEXT.md.
 *
 * The Surcharge is the only thing besides Size and quantity the Estimate may include, so
 * it lives here rather than per Item: one price for Salted Caramel, everywhere.
 */
export const Fillings: CollectionConfig = {
  slug: 'fillings',
  labels: {
    singular: 'Filling',
    plural: 'Fillings',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'surcharge'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'surcharge',
      type: 'number',
      min: 0,
      // Not localized, and not required: most Fillings add nothing, and an empty
      // Surcharge is a Filling that adds nothing rather than a Filling missing a price.
      admin: {
        description: 'Euros this Filling adds to an Item’s price. Leave empty for no Surcharge.',
        step: 0.5,
      },
    },
  ],
}
