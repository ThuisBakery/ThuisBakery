import { DEFAULT_LOCALE, LOCALES, type Locale } from './routes'

/**
 * A page's canonical and hreflang annotations, per ADR-0002.
 *
 * - Every locale URL **self-canonicalises**: English never canonicalises to Dutch or back,
 *   which would collapse the cluster and defeat hreflang.
 * - hreflang alternates are **self-referencing, reciprocal and fully qualified**. Both
 *   locales of a page are built from the same set of paths, so they emit the same set.
 * - `x-default` is the English page, English being the tree at the bare root. Google defines
 *   it as "the URL where you want your users to land if your site doesn't support their
 *   language" and allows it on any page, so it is the English version of *this* page: a
 *   German visitor to a cake page should land on that cake, not on the homepage.
 * - A locale the page has no URL in is **omitted**, never pointed at a 404 — Google ignores
 *   non-reciprocal annotations, which can poison the whole set.
 *
 * The shape is what Next's `Metadata['alternates']` takes, so `generateMetadata` passes it
 * straight through.
 */
export type Alternates = {
  canonical: string
  languages: Partial<Record<Locale | 'x-default', string>>
}

export const alternates = (
  paths: Partial<Record<Locale, string>>,
  locale: Locale,
  origin: string,
): Alternates => {
  const base = origin.replace(/\/+$/, '')
  const absolute = (path: string): string => `${base}${path}`
  const own = paths[locale]

  if (own === undefined) {
    throw new Error(`A page cannot be annotated in ${locale} when it has no ${locale} path.`)
  }

  const languages: Alternates['languages'] = {}

  for (const each of LOCALES) {
    const path = paths[each]

    if (path !== undefined) {
      languages[each] = absolute(path)
    }
  }

  const fallback = paths[DEFAULT_LOCALE]

  if (fallback !== undefined) {
    languages['x-default'] = absolute(fallback)
  }

  return { canonical: absolute(own), languages }
}
