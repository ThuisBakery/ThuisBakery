/**
 * The site's route map, and the slugs an editor may not take.
 *
 * ADR-0002 puts English at the bare root and Dutch under `/nl`, with static segments
 * localized as well as slugs. ADR-0003 lists the nine coded routes per locale and notes
 * that, because marketing pages resolve from a single unmatched root segment, those coded
 * segments are reserved: Payload has to reject them at validation time rather than let
 * someone publish a page that a route silently shadows.
 *
 * This module is the one place that knows those segments. Pure data and pure functions —
 * the Payload configs import it, never the other way round.
 */

export const LOCALES = ['en', 'nl'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

/**
 * The catalogue split from ADR-0003: cakes are a conversation, nibbles are a quantity, and
 * they nest under different URLs. Modelled as a property on Category so a sixth Category
 * is a content change rather than a code change.
 */
export const CATALOGUES = ['cakes', 'nibbles'] as const

export type Catalogue = (typeof CATALOGUES)[number]

/** What each catalogue is called in the admin. English only: the admin runs in English. */
export const CATALOGUE_LABELS: Record<Catalogue, string> = {
  cakes: 'Cakes',
  nibbles: 'Nibbles',
}

/** The localized first segment of each catalogue's index page. */
const CATALOGUE_SEGMENTS: Record<Catalogue, Record<Locale, string>> = {
  cakes: { en: 'cakes', nl: 'taarten' },
  nibbles: { en: 'nibbles', nl: 'lekkernijen' },
}

/**
 * Every coded route segment, both locales. `lekkernijen` and `over-jana` are provisional
 * Dutch wording per ADR-0003; changing them here is the whole change.
 */
const CODED_SEGMENTS: Record<Locale, readonly string[]> = {
  en: ['cakes', 'nibbles', 'custom-order', 'about', 'contact', 'privacy'],
  nl: ['taarten', 'lekkernijen', 'maatwerk', 'over-jana', 'contact', 'privacy'],
}

/**
 * Segments that belong to the framework rather than to a page: the Dutch locale prefix
 * itself, Payload's admin and REST/GraphQL trees, and Next's own reserved `next` segment
 * where the draft-mode preview route lives.
 */
const INFRASTRUCTURE_SEGMENTS = ['nl', 'admin', 'api', 'next'] as const

/**
 * Slugs an Item or a marketing page may not take. Both locales' segments are reserved in
 * both locales: an English slug of `taarten` is not shadowed by a route today, but it is a
 * permanent tell in a URL, and keeping one set is simpler than keeping two.
 */
export const RESERVED_SLUGS: readonly string[] = [
  ...new Set([...CODED_SEGMENTS.en, ...CODED_SEGMENTS.nl, ...INFRASTRUCTURE_SEGMENTS]),
].sort()

const reserved = new Set(RESERVED_SLUGS)

/** Case- and whitespace-insensitive: `Cakes ` is the same claim on the URL as `cakes`. */
export const isReservedSlug = (slug: string): boolean => reserved.has(slug.trim().toLowerCase())

/** The public path of a catalogue index page — `/cakes`, `/nl/taarten`. */
export const cataloguePath = (catalogue: Catalogue, locale: Locale): string => {
  const segment = CATALOGUE_SEGMENTS[catalogue][locale]

  return locale === DEFAULT_LOCALE ? `/${segment}` : `/${locale}/${segment}`
}

/** The public path of an Item — `/cakes/apple-pie`, `/nl/taarten/appeltaart`. */
export const itemPath = (catalogue: Catalogue, locale: Locale, slug: string): string =>
  `${cataloguePath(catalogue, locale)}/${slug}`

/** Whether a value read back from Payload is a catalogue this code knows how to route. */
export const isCatalogue = (value: unknown): value is Catalogue =>
  typeof value === 'string' && (CATALOGUES as readonly string[]).includes(value)

/** Whether a value read back from Payload is a locale this site is published in. */
export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
