import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import { itemListing, type ItemListing, type LocalizedFields } from '@/domain/item'
import { LOCALES, isCatalogue, type Catalogue, type Locale } from '@/domain/routes'

export type { ItemListing }

/**
 * Every Published Item and the locales it has a URL in, read once per build (and once per render, by
 * `cache`) — the one place that decides which Items have a URL in which locale.
 *
 * Readiness is read with `fallbackLocale: 'none'` (ADR-0002): with fallback on, an Item
 * written only in English would read as filled in Dutch too, and get a Dutch URL serving
 * English words under `<html lang="nl">`. `fallback` stays on in the config and for
 * rendering, where one language's value serves both — only this question turns it off.
 */
export const itemListings = cache(async (): Promise<ItemListing[]> => {
  const payload = await getPayload({ config: configPromise })

  const byLocale = await Promise.all(
    LOCALES.map(async (locale) => {
      const { docs } = await payload.find({
        collection: 'items',
        where: { _status: { equals: 'published' } },
        depth: 1,
        locale,
        fallbackLocale: 'none',
        pagination: false,
        select: { title: true, slug: true, description: true, category: true },
      })

      return { locale, docs }
    }),
  )

  const listings = new Map<
    number,
    { catalogue: Catalogue; states: Partial<Record<Locale, LocalizedFields>> }
  >()

  for (const { locale, docs } of byLocale) {
    for (const doc of docs) {
      const catalogue = typeof doc.category === 'object' ? doc.category.catalogue : undefined

      if (!isCatalogue(catalogue)) {
        continue
      }

      const listing = listings.get(doc.id) ?? { catalogue, states: {} }

      listing.states[locale] = doc
      listings.set(doc.id, listing)
    }
  }

  return [...listings].map(([id, { catalogue, states }]) => itemListing(id, catalogue, states))
})

/** The ids of the Items with a URL in a locale, optionally in one catalogue only. */
export const readyItemIds = async (locale: Locale, catalogue?: Catalogue): Promise<number[]> =>
  (await itemListings())
    .filter((listing) => listing.paths[locale] !== undefined)
    .filter((listing) => catalogue === undefined || listing.catalogue === catalogue)
    .map((listing) => listing.id)
