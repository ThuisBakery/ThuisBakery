import type { GlobalConfig } from 'payload'

import { photograph, words } from '@/fields/copy'
import { DRAFTS_WITH_AUTOSAVE } from '@/versions'

/**
 * The About page's words (ADR-0003's page-content singleton for `/about` and
 * `/nl/over-jana`): Jana's story and her photograph. The layout is fixed in code, and it
 * always ends by sending the reader to the cakes — the link ADR-0003 specifies for About.
 */
export const About: GlobalConfig = {
  slug: 'about',
  label: 'About page',
  versions: {
    drafts: DRAFTS_WITH_AUTOSAVE,
  },
  fields: [
    words('heading', 'The page’s heading — “One kitchen, one pair of hands”.'),
    {
      name: 'story',
      type: 'richText',
      required: true,
      localized: true,
      admin: {
        description:
          'Jana’s story, in her own words. Subheadings are welcome; the page heading is above.',
      },
    },
    photograph('A photograph of Jana. Tall rather than wide.'),
    words('cakesLabel', 'The link to the cakes at the foot of the page — “See what Jana bakes”.'),
  ],
}
