import type { GlobalConfig } from 'payload'

import { paragraph, photograph, words } from '@/fields/copy'
import { DRAFTS_WITH_AUTOSAVE } from '@/versions'

/**
 * The Custom order page's words (ADR-0003's page-content singleton for `/custom-order` and
 * `/nl/maatwerk`) — the bespoke path. The form is the Custom order sheet, in code: it has no
 * Item and no Estimate, only "tell me what you're imagining". `formHeading` heads the way
 * into it at the top of the page (ADR-0007).
 */
export const CustomOrder: GlobalConfig = {
  slug: 'custom-order',
  label: 'Custom order page',
  versions: {
    drafts: DRAFTS_WITH_AUTOSAVE,
  },
  fields: [
    words('heading', 'The page’s heading — “Something of your own”.'),
    paragraph(
      'intro',
      'A few sentences on what Jana will make to order. Leave a blank line between paragraphs.',
    ),
    photograph('Optional. A cake Jana made to order, beside the introduction.'),
    words('formHeading', 'The heading above the form — “Tell Jana what you’re imagining”.'),
  ],
}
