import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import { pageListing, type PageListing, type PageLocalizedFields } from '@/domain/page'
import { LOCALES, type Locale } from '@/domain/routes'

export type { PageListing }

/**
 * Every Published marketing page and the locales it has a URL in, read once per build (and
 * once per render, by `cache`) — the one place that decides which pages exist where. The
 * counterpart of `itemListings`, and read the same way: with `fallbackLocale: 'none'`, so
 * a page Jana has built only in English is not given a Dutch URL serving English blocks.
 */
export const pageListings = cache(async (): Promise<PageListing[]> => {
  const payload = await getPayload({ config: configPromise })

  const byLocale = await Promise.all(
    LOCALES.map(async (locale) => {
      const { docs } = await payload.find({
        collection: 'pages',
        where: { _status: { equals: 'published' } },
        depth: 0,
        locale,
        fallbackLocale: 'none',
        pagination: false,
        select: { title: true, slug: true, layout: true, occasion: true },
      })

      return { locale, docs }
    }),
  )

  const listings = new Map<
    number,
    { occasion: number | null; states: Partial<Record<Locale, PageLocalizedFields>> }
  >()

  for (const { locale, docs } of byLocale) {
    for (const doc of docs) {
      const occasion = typeof doc.occasion === 'object' ? (doc.occasion?.id ?? null) : doc.occasion
      const listing = listings.get(doc.id) ?? { occasion: occasion ?? null, states: {} }

      listing.states[locale] = doc
      listings.set(doc.id, listing)
    }
  }

  return [...listings].map(([id, { occasion, states }]) => pageListing(id, occasion, states))
})
