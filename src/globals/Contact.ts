import type { GlobalConfig, TextFieldSingleValidation } from 'payload'

import { instagramLink } from '@/domain/contact'
import { parseTimeOfDay } from '@/domain/lead-time'
import { DAYS_OF_WEEK } from '@/domain/structured-data'
import { paragraph, photograph, questions, words } from '@/fields/copy'
import { DRAFTS_WITH_AUTOSAVE } from '@/versions'

const time = (name: 'opens' | 'closes', label: string) => ({
  name,
  type: 'text' as const,
  required: true,
  label,
  admin: { placeholder: name === 'opens' ? '10:00' : '16:00', width: '25%' },
  validate: ((value) =>
    typeof value === 'string' && parseTimeOfDay(value) !== null
      ? true
      : 'Use a 24-hour time, such as 10:00.') satisfies TextFieldSingleValidation,
})

/**
 * The Contact page's words and details (ADR-0003's page-content singleton for `/contact` and
 * `/nl/contact`): how to reach Jana, when, how collection works, and the questions people ask.
 *
 * Contact carries the site's `Bakery` structured data, and Google's rule is that nothing is
 * marked up that the page does not show — so every detail here is both printed and marked up,
 * from the one value (ADR-0002). A detail left empty is left out of both.
 *
 * **There is no address field, and there must never be one.** The website never prints the
 * street address: pickup is in Uithoorn, by arrangement, and the address is sent when an
 * order is confirmed. `areaServed` in the markup is permanent, not a launch placeholder.
 */
export const Contact: GlobalConfig = {
  slug: 'contact',
  label: 'Contact page',
  versions: {
    drafts: DRAFTS_WITH_AUTOSAVE,
  },
  fields: [
    words('heading', 'The page’s heading — “Get in touch”.'),
    paragraph('intro', 'One or two sentences under the heading.'),
    {
      name: 'details',
      type: 'group',
      label: 'How to reach Jana',
      admin: {
        description:
          'Printed on the page and given to search engines. Leave one empty to leave it out.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'email',
              type: 'email',
              admin: { description: 'The address customers write to.', width: '33%' },
            },
            {
              name: 'telephone',
              type: 'text',
              admin: {
                description: 'Optional. As it should be dialled — +31 6 1234 5678.',
                width: '33%',
              },
            },
            {
              name: 'instagram',
              type: 'text',
              admin: { description: 'The Instagram username — thuisbakery.', width: '33%' },
              validate: ((value) =>
                !value || instagramLink(value) !== null
                  ? true
                  : 'Just the username, such as thuisbakery.') satisfies TextFieldSingleValidation,
            },
          ],
        },
        photograph(
          'Optional. A photograph beside the details — the kitchen, or a finished cake. Search engines show it with the bakery.',
        ),
      ],
    },
    {
      name: 'hours',
      type: 'group',
      label: 'Opening hours',
      fields: [
        paragraph(
          'note',
          'Optional. A line under the hours — “Outside these hours by arrangement.”',
          { optional: true },
        ),
        {
          name: 'rows',
          type: 'array',
          labels: { singular: 'Hours', plural: 'Hours' },
          admin: {
            description:
              'When customers can collect or call. One row per set of days sharing the same hours.',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'days',
                  type: 'select',
                  hasMany: true,
                  required: true,
                  options: [...DAYS_OF_WEEK],
                  admin: { width: '50%' },
                },
                time('opens', 'Opens'),
                time('closes', 'Closes'),
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'collection',
      type: 'group',
      label: 'Collecting an order',
      admin: {
        description:
          'Where pickup is — Uithoorn, by arrangement, the address sent on confirmation — is printed by the site itself. Write the rest here.',
      },
      fields: [
        words('heading', '“Collecting your cake”.'),
        paragraph('policy', 'How collection works. Leave a blank line between paragraphs.'),
      ],
    },
    questions('“Questions people ask”.'),
    words('formHeading', 'The heading above the form — “Ask a question”.'),
  ],
}
