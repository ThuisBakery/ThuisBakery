import { seoPlugin } from '@payloadcms/plugin-seo'
import type { Plugin } from 'payload'

import { itemPath, isCatalogue, isLocale, marketingPagePath } from '@/domain/routes'
import { metaDescription, metaTitle, pageRichTexts, summary } from '@/domain/seo'
import { siteOrigin } from '@/lib/site'

/**
 * Per-locale editable titles and descriptions on Items and marketing pages, with the
 * search-result preview and character counters (ADR-0002). The plugin's fields are
 * localized as it ships them, so the Dutch result reads in Dutch.
 *
 * The plugin supplies the fields and their editor and nothing else: hreflang, canonicals,
 * the sitemap and JSON-LD are ours. What a *blank* field becomes on the site is decided in
 * `src/domain/seo.ts`, and the Auto-generate buttons here fill in exactly that, so Jana sees
 * what the page will say before she decides to write her own.
 *
 * No meta image field: nothing here produces social cards yet, and an unused field is one
 * more thing to wonder about.
 */

type Doc = Record<string, unknown>

const name = (doc: Doc): string => (typeof doc['title'] === 'string' ? doc['title'] : '')

/** What a blank description is cut from: an Item's description, or a page's own words. */
const descriptionSource = (collection: string | undefined, doc: Doc): unknown[] =>
  collection === 'pages' ? pageRichTexts(doc) : [doc['description']]

export const seo: Plugin = seoPlugin({
  collections: ['items', 'pages'],
  generateTitle: ({ doc }) => metaTitle(null, name(doc)),
  generateDescription: ({ doc, collectionConfig }) =>
    metaDescription(null, summary(descriptionSource(collectionConfig?.slug, doc))) ?? '',
  /**
   * The address shown in the search-result preview. An Item's catalogue follows from its
   * Category, which the form holds only as an id, so it is looked up.
   */
  generateURL: async ({ doc, collectionConfig, locale, req }) => {
    const slug = typeof doc['slug'] === 'string' ? doc['slug'] : ''
    const current = isLocale(locale) ? locale : 'en'

    if (collectionConfig?.slug === 'pages') {
      return `${siteOrigin()}${marketingPagePath(current, slug)}`
    }

    const category: unknown = doc['category']
    const id =
      typeof category === 'object' && category !== null && 'id' in category ? category.id : category

    if (typeof id !== 'number' && typeof id !== 'string') {
      return siteOrigin()
    }

    const { catalogue } = await req.payload.findByID({
      collection: 'categories',
      id,
      depth: 0,
      select: { catalogue: true },
      req,
    })

    return isCatalogue(catalogue)
      ? `${siteOrigin()}${itemPath(catalogue, current, slug)}`
      : siteOrigin()
  },
})
