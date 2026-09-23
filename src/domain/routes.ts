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

/**
 * The coded pages from ADR-0003, and the key the CMS uses to link to one. Item pages and
 * marketing pages are not here: they are generated from content, not coded.
 */
export const CODED_PAGES = [
  'home',
  'cakes',
  'nibbles',
  'customOrder',
  'about',
  'contact',
  'privacy',
  'enquirySent',
] as const

export type CodedPage = (typeof CODED_PAGES)[number]

/**
 * The coded pages the Header and Footer may link to. The confirmation page an Enquiry lands
 * on is not one: it is a receipt, reached only by sending one.
 */
export const LINKABLE_PAGES = CODED_PAGES.filter(
  (page): page is Exclude<CodedPage, 'enquirySent'> => page !== 'enquirySent',
)

/** What each coded page is called in the admin, where Jana picks a link's target. */
export const CODED_PAGE_LABELS: Record<CodedPage, string> = {
  home: 'Home',
  cakes: 'Cakes',
  nibbles: 'Nibbles',
  customOrder: 'Custom order',
  about: 'About',
  contact: 'Contact',
  privacy: 'Privacy',
  enquirySent: 'Enquiry sent',
}

/**
 * The localized route map: every coded page's static segment, per locale. ADR-0002 keeps
 * these in a dictionary rather than as route folders, so one `[locale]/[[...segments]]`
 * tree serves them all. Home is the empty segment.
 *
 * `lekkernijen`, `over-jana` and `vraag-verstuurd` are provisional Dutch wording per
 * ADR-0003; changing them here is the whole change.
 */
const ROUTE_MAP: Record<CodedPage, Record<Locale, string>> = {
  home: { en: '', nl: '' },
  cakes: { en: 'cakes', nl: 'taarten' },
  nibbles: { en: 'nibbles', nl: 'lekkernijen' },
  customOrder: { en: 'custom-order', nl: 'maatwerk' },
  about: { en: 'about', nl: 'over-jana' },
  contact: { en: 'contact', nl: 'contact' },
  privacy: { en: 'privacy', nl: 'privacy' },
  enquirySent: { en: 'enquiry-sent', nl: 'vraag-verstuurd' },
}

/** Every coded route segment in one locale, home excluded. */
const codedSegments = (locale: Locale): string[] =>
  CODED_PAGES.map((page) => ROUTE_MAP[page][locale]).filter((segment) => segment !== '')

/**
 * The first segment of the paths BotID's client script calls, fixed by the `botid` package
 * and rewritten to Vercel by `withBotId` in `next.config.ts`. `proxy.ts` must not rewrite
 * them onto the English tree first, or the challenge never reaches Vercel.
 */
const BOTID_SEGMENT = '149e9513-01fa-4fb0-aad4-566afd725d1b'

/**
 * Segments that belong to the framework rather than to a page: Payload's admin and
 * REST/GraphQL trees, the `next` segment where the draft-mode preview route lives, and the
 * paths Next and Vercel serve their own assets from. `proxy.ts` leaves these alone.
 */
export const FRAMEWORK_SEGMENTS: readonly string[] = [
  'admin',
  'api',
  'next',
  '_next',
  '_vercel',
  // BotID's challenge script and proxy, which `withBotId` rewrites to Vercel (ADR-0006).
  BOTID_SEGMENT,
]

/** Framework segments plus the Dutch locale prefix itself. */
const INFRASTRUCTURE_SEGMENTS = ['nl', ...FRAMEWORK_SEGMENTS]

/**
 * Slugs an Item or a marketing page may not take. Both locales' segments are reserved in
 * both locales: an English slug of `taarten` is not shadowed by a route today, but it is a
 * permanent tell in a URL, and keeping one set is simpler than keeping two.
 */
export const RESERVED_SLUGS: readonly string[] = [
  ...new Set([...codedSegments('en'), ...codedSegments('nl'), ...INFRASTRUCTURE_SEGMENTS]),
].sort()

const reserved = new Set(RESERVED_SLUGS)

/** Case- and whitespace-insensitive: `Cakes ` is the same claim on the URL as `cakes`. */
export const isReservedSlug = (slug: string): boolean => reserved.has(slug.trim().toLowerCase())

/** The public path of a coded page — `/`, `/nl`, `/custom-order`, `/nl/maatwerk`. */
export const pagePath = (page: CodedPage, locale: Locale): string => {
  const segment = ROUTE_MAP[page][locale]
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`

  return segment === '' ? prefix || '/' : `${prefix}/${segment}`
}

/**
 * A coded page's segments after the locale prefix — the `[[...segments]]` value that
 * `generateStaticParams` returns for it. Home has none.
 */
export const pageSegments = (page: CodedPage, locale: Locale): string[] => {
  const segment = ROUTE_MAP[page][locale]

  return segment === '' ? [] : [segment]
}

/**
 * The coded page a path's segments name in a locale, or `null` when they name none — an
 * Item, a marketing page, or nothing. The segments are those after the locale prefix.
 */
export const resolvePage = (locale: Locale, segments: readonly string[]): CodedPage | null => {
  if (segments.length > 1) {
    return null
  }

  const segment = segments[0] ?? ''

  return CODED_PAGES.find((page) => ROUTE_MAP[page][locale] === segment) ?? null
}

/** The locale the language switcher leads to. Two locales, so always the other one. */
export const otherLocale = (locale: Locale): Locale => (locale === 'en' ? 'nl' : 'en')

/** The public path of a catalogue index page — `/cakes`, `/nl/taarten`. */
export const cataloguePath = (catalogue: Catalogue, locale: Locale): string =>
  pagePath(catalogue, locale)

/** The public path of an Item — `/cakes/apple-pie`, `/nl/taarten/appeltaart`. */
export const itemPath = (catalogue: Catalogue, locale: Locale, slug: string): string =>
  `${cataloguePath(catalogue, locale)}/${slug}`

/** Whether a value read back from Payload is a catalogue this code knows how to route. */
export const isCatalogue = (value: unknown): value is Catalogue =>
  typeof value === 'string' && (CATALOGUES as readonly string[]).includes(value)

/** Whether a value read back from Payload is a locale this site is published in. */
export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value)

/**
 * An Item's segments after the locale prefix — its catalogue's localized segment, then its
 * slug. The `[[...segments]]` value `generateStaticParams` returns for it.
 */
export const itemSegments = (catalogue: Catalogue, locale: Locale, slug: string): string[] => [
  ROUTE_MAP[catalogue][locale],
  slug,
]

/**
 * The Item a path's segments name in a locale — a catalogue segment in *that* locale's
 * words, then one slug — or `null`. Whether such an Item exists is the caller's question:
 * this only reads the shape of the path.
 */
export const resolveItem = (
  locale: Locale,
  segments: readonly string[],
): { catalogue: Catalogue; slug: string } | null => {
  const [segment, slug, ...rest] = segments

  if (slug === undefined || rest.length > 0) {
    return null
  }

  const catalogue = CATALOGUES.find((each) => ROUTE_MAP[each][locale] === segment)

  return catalogue ? { catalogue, slug } : null
}

/**
 * The public path of a marketing page — `/christmas`, `/nl/kerst`. Marketing pages sit at
 * the bare root because that is where they rank (ADR-0003); their slugs are what the
 * reserved list keeps out of the coded segments' way.
 */
export const marketingPagePath = (locale: Locale, slug: string): string =>
  `${locale === DEFAULT_LOCALE ? '' : `/${locale}`}/${slug}`

/** A marketing page's segments after the locale prefix: its slug, alone. */
export const marketingPageSegments = (slug: string): string[] => [slug]

/**
 * The marketing page slug a path's segments name in a locale — one segment that no coded
 * page claims — or `null`. Whether such a page exists is the caller's question.
 */
export const resolveMarketingPage = (
  locale: Locale,
  segments: readonly string[],
): string | null => {
  const [slug, ...rest] = segments

  if (slug === undefined || rest.length > 0 || resolvePage(locale, segments) !== null) {
    return null
  }

  return slug
}
