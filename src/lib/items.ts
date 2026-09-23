import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import { itemPaths, type LocaleState } from '@/domain/item'
import { LOCALES, isCatalogue, type Catalogue, type Locale } from '@/domain/routes'

/**
 * A Published Item, and its slug, title and path in each locale it is ready in — and in no
 * other. A locale missing here is one the Item has no URL in.
 */
export type ItemListing = {
  id: number
  catalogue: Catalogue
  paths: Partial<Record<Locale, string>>
  slugs: Partial<Record<Locale, string>>
  titles: Partial<Record<Locale, string>>
}

/**
 * Every Published Item and where it lives, read once per build (and once per render, by
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
    { catalogue: Catalogue; states: Partial<Record<Locale, LocaleState>> }
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

  return [...listings].map(([id, { catalogue, states }]) => {
    const paths = itemPaths(catalogue, states)
    const slugs: Partial<Record<Locale, string>> = {}
    const titles: Partial<Record<Locale, string>> = {}

    for (const locale of LOCALES) {
      const { slug, title } = states[locale] ?? {}

      if (paths[locale] !== undefined && slug && title) {
        slugs[locale] = slug
        titles[locale] = title
      }
    }

    return { id, catalogue, paths, slugs, titles }
  })
})

/** The ids of the Items with a URL in a locale, optionally in one catalogue only. */
export const readyItemIds = async (locale: Locale, catalogue?: Catalogue): Promise<number[]> =>
  (await itemListings())
    .filter((listing) => listing.paths[locale] !== undefined)
    .filter((listing) => catalogue === undefined || listing.catalogue === catalogue)
    .map((listing) => listing.id)
