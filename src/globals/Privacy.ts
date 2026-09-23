import type { GlobalConfig } from 'payload'

import { DRAFTS_WITH_AUTOSAVE } from '@/versions'

/**
 * The privacy policy (ADR-0003: `/privacy` and `/nl/privacy`, as CMS rich text). Seeded with
 * a first draft carrying ADR-0006's four required disclosures — Resend and the US transfer,
 * the retention periods, Vercel and Neon as processors, and cookieless analytics. The words
 * are a launch-checklist item: a home bakery in the Netherlands is a data controller, and
 * the finished text deserves a human reading it.
 *
 * No consent banner and no terms of service go with it (ADR-0003).
 */
export const Privacy: GlobalConfig = {
  slug: 'privacy',
  label: 'Privacy policy',
  versions: {
    drafts: DRAFTS_WITH_AUTOSAVE,
  },
  fields: [
    {
      name: 'body',
      type: 'richText',
      required: true,
      localized: true,
      admin: {
        description:
          'The whole policy. Keep the sections on Resend, how long things are kept, where the site is hosted, and analytics: the law requires each one.',
      },
    },
    {
      name: 'lastUpdated',
      type: 'date',
      required: true,
      admin: {
        description: 'Shown under the heading. Change it whenever the policy changes.',
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' },
      },
    },
  ],
}
