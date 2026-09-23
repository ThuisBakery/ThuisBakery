import type { Block } from 'payload'

/** Payload's website template `MediaBlock`, unmodified: one photograph from Media. */
export const MediaBlock: Block = {
  slug: 'mediaBlock',
  interfaceName: 'MediaBlock',
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
  ],
}
