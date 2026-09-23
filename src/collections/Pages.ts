import type { CollectionConfig } from 'payload'

import { CallToAction } from '@/blocks/CallToAction'
import { Content } from '@/blocks/Content'
import { MediaBlock } from '@/blocks/MediaBlock'
import { hero } from '@/fields/hero'
import { slugField } from '@/fields/slug'
import { DRAFTS_WITH_AUTOSAVE } from '@/versions'

/**
 * Marketing page — a page Jana assembles herself out of blocks, living at the bare root:
 * `/christmas`, `/nl/kerst`. The sandbox half of ADR-0003's CMS ownership boundary. Inside
 * it, Payload's layout builder is used **fully**, with the website template's hero and
 * blocks as the template writes them; outside it, the coded routes stay coded. That split
 * is a deliberate deviation from Payload's documented recommendation — do not "correct" it.
 *
 * Two of the template's five layout blocks are left out, because what they need is ruled
 * out here: Archive lists the template's blog posts (no blog, #19), and Form needs the
 * form-builder plugin's second submissions store (every Enquiry is one Submission,
 * ADR-0003 and ADR-0006). The template's `publishedAt` and search-meta tab are not the
 * block set; editable metadata is issue #27's.
 *
 * An Occasion page is simply a marketing page with its Occasion set — never hand-coded,
 * never generated per tag, which ADR-0003 rejected as thin-page manufacturing. That one
 * field drives both directions: the page lists the Items tagged with the Occasion, and each
 * of those Items links back here.
 *
 * Marketing pages stay out of the nav: the Header links to coded pages only
 * (`src/fields/pageLink.ts`), so there is no way to add one.
 *
 * The hero and blocks are localized whole, so each locale's page is its own arrangement —
 * the Dutch page can say something different, in a different order, with Dutch URLs in its
 * links. A page with no blocks in a locale has no URL there (`isPageReady`).
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: 'Page',
    plural: 'Pages',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'occasion', '_status', 'updatedAt'],
    description:
      'Your own pages — a Christmas page, a wedding-cake page — built from blocks. They are found from Google and from links, never from the menu.',
  },
  versions: {
    drafts: DRAFTS_WITH_AUTOSAVE,
    // Autosave writes a version per pause in typing; see Items.
    maxPerDoc: 20,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [{ ...hero, localized: true }],
          label: 'Hero',
        },
        {
          fields: [
            {
              name: 'layout',
              type: 'blocks',
              blocks: [CallToAction, Content, MediaBlock],
              required: true,
              localized: true,
              admin: {
                initCollapsed: true,
              },
            },
          ],
          label: 'Content',
        },
      ],
    },
    slugField(
      'This page’s address, in this locale’s own words — christmas, kerst. It sits straight after the domain, so the site’s own addresses are taken.',
    ),
    {
      name: 'occasion',
      type: 'relationship',
      relationTo: 'occasions',
      hasMany: false,
      unique: true,
      admin: {
        position: 'sidebar',
        description:
          'Optional. Makes this the page for an Occasion: it lists every Item tagged with it, and each of those Items links back here. One page per Occasion.',
      },
    },
  ],
}
