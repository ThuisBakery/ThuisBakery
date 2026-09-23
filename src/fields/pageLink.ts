import type { Field } from 'payload'

import { CODED_PAGE_LABELS, LINKABLE_PAGES } from '@/domain/routes'

/**
 * A link to one of the coded pages, as the Header and Footer globals hold them.
 *
 * The target is a page *key*, not a URL: the route map in `src/domain/routes.ts` turns it
 * into `/custom-order` or `/nl/maatwerk`, so one link serves both locales and a renamed
 * Dutch segment never leaves a stale href in the CMS. Only the label is translated.
 */
export const pageLinkFields: Field[] = [
  {
    name: 'page',
    type: 'select',
    required: true,
    options: LINKABLE_PAGES.map((page) => ({ label: CODED_PAGE_LABELS[page], value: page })),
    admin: { width: '50%' },
  },
  {
    name: 'label',
    type: 'text',
    required: true,
    localized: true,
    admin: { width: '50%' },
  },
]
