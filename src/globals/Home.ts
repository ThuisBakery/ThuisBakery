import type { GlobalConfig } from 'payload'

import { paragraph, photograph, questions, words } from '@/fields/copy'
import { DRAFTS_WITH_AUTOSAVE } from '@/versions'

/**
 * The homepage's words (ADR-0003's page-content singleton for `/` and `/nl`). Jana fills the
 * sections; she cannot add, remove or reorder them — the eight-section layout is ADR-0004's
 * and lives in code.
 *
 * Three facts are deliberately **not** here, because they are kept elsewhere and the
 * homepage must never contradict them: the Lead time comes from the Lead time global, the
 * starting price from the Categories, and the allergen notice's statement from the
 * cross-contamination global. The menu itself is the cakes, in their Categories’ order.
 */
export const Home: GlobalConfig = {
  slug: 'home',
  label: 'Homepage',
  versions: {
    drafts: DRAFTS_WITH_AUTOSAVE,
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      label: 'Opening',
      fields: [
        words('headline', 'The page’s heading — “Baked at home in Uithoorn”.'),
        paragraph('intro', 'One or two sentences under the heading.'),
        photograph(
          'The photograph beside the heading on a wide screen. Left out on a phone, so the cakes start on the first screen.',
        ),
        {
          type: 'row',
          fields: [
            words('cakesLabel', 'The main button, to the cakes — “Choose a cake”.', {
              width: '50%',
            }),
            words(
              'nibblesLabel',
              'The link to the nibbles, beside the button in the closing band.',
              { width: '50%' },
            ),
          ],
        },
      ],
    },
    {
      name: 'facts',
      type: 'group',
      label: 'Fact band',
      admin: {
        description:
          'Three facts under the menu. The notice needed comes from Lead time, and the starting price from the Categories — only pickup and the line under the price are written here.',
      },
      fields: [
        words('pickupTitle', 'Where cakes are collected — “Pickup in Uithoorn”.'),
        words('pickupDetail', 'The line beneath — “Address sent once your day is confirmed.”'),
        words(
          'priceDetail',
          'Optional. The line under the starting price — “A bento cake. Full sizes run to about €110.”',
          { optional: true },
        ),
      ],
    },
    {
      name: 'menu',
      type: 'group',
      label: 'Menu',
      admin: {
        description:
          'The menu shows every cake, in the Categories’ order, each linking to its own page.',
      },
      fields: [words('heading', 'The heading above the menu — “The menu”.')],
    },
    {
      name: 'about',
      type: 'group',
      label: 'About Jana',
      fields: [
        words('heading', '“One kitchen, one pair of hands”.'),
        paragraph('body', 'A few sentences. Leave a blank line between paragraphs.'),
        words('linkLabel', 'The link to the About page — “Meet Jana”.'),
        photograph('A photograph of Jana, or of her kitchen. Tall rather than wide.'),
      ],
    },
    {
      name: 'allergens',
      type: 'group',
      label: 'Allergen notice',
      admin: {
        description:
          'The cross-contamination statement is added beneath automatically; it is written once, on its own global.',
      },
      fields: [
        words('heading', '“About allergies”.'),
        paragraph('intro', 'Optional. A sentence before the statement.', { optional: true }),
      ],
    },
    {
      name: 'quote',
      type: 'group',
      label: 'Customer quote',
      fields: [
        paragraph('text', 'What the customer said, without quotation marks.'),
        words('attribution', 'Who said it — “Marieke, Uithoorn”. Ask before using a surname.'),
      ],
    },
    questions('“Before you ask”.'),
    {
      name: 'closing',
      type: 'group',
      label: 'Closing band',
      admin: {
        description:
          'The last section, sending the customer into the menu. It uses the Opening’s button and link words.',
      },
      fields: [
        words('heading', '“Tell Jana what the day is for”.'),
        paragraph('body', 'One or two sentences.'),
      ],
    },
  ],
}
