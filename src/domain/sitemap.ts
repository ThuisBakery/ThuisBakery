import { alternates, type Alternates } from './alternates'
import { CODED_PAGES, LOCALES, pagePath, type Locale } from './routes'
import { isIndexed } from './seo'

/**
 * The sitemap ADR-0002 asks for: every indexable URL in both locale trees — coded pages,
 * Item pages and marketing pages — each with its hreflang alternates.
 *
 * Built from the same per-locale paths the pages are generated from (`itemListings`,
 * `pageListings`), so an Item untranslated in a locale is absent here exactly as it has no
 * URL there. And each entry's alternates are the ones its page emits, from the same
 * `alternates` function: the sitemap and the `<head>` cannot tell Google two stories.
 *
 * The shape is what Next's `MetadataRoute.Sitemap` takes, so `app/sitemap.ts` returns it
 * straight through. No `lastModified`: Google uses it only when it is consistently
 * accurate, and a coded page has no date to give.
 */
export type SitemapEntry = {
  url: string
  alternates: { languages: Alternates['languages'] }
}

type Listed = { paths: Partial<Record<Locale, string>> }

export const sitemapEntries = (
  { items, pages }: { items: readonly Listed[]; pages: readonly Listed[] },
  origin: string,
): SitemapEntry[] => {
  const coded = CODED_PAGES.filter(isIndexed).map((page) => ({
    paths: { en: pagePath(page, 'en'), nl: pagePath(page, 'nl') },
  }))

  return [...coded, ...items, ...pages].flatMap(({ paths }) =>
    LOCALES.flatMap((locale) => {
      if (paths[locale] === undefined) {
        return []
      }

      const { canonical, languages } = alternates(paths, locale, origin)

      return [{ url: canonical, alternates: { languages } }]
    }),
  )
}
