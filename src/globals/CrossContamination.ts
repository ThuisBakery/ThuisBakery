import type { GlobalConfig } from 'payload'

import { DRAFTS_WITH_AUTOSAVE } from '@/versions'

/**
 * The cross-contamination statement — the single site-wide notice that Jana bakes in a
 * home kitchen and cannot exclude traces. It sits alongside every Allergen list and is
 * never written per Item, which is exactly why it is a Global. See CONTEXT.md.
 */
export const CrossContamination: GlobalConfig = {
  slug: 'cross-contamination',
  label: 'Cross-contamination statement',
  versions: {
    drafts: DRAFTS_WITH_AUTOSAVE,
  },
  fields: [
    {
      name: 'statement',
      type: 'textarea',
      required: true,
      localized: true,
      admin: {
        description: 'Shown alongside every Allergen list, on every Item.',
      },
    },
  ],
}
