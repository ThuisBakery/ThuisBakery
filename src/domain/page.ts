import { LOCALES, marketingPagePath, type Locale } from './routes'

/**
 * A marketing page's derived values: which locales it exists in, which Occasion it is
 * written up for, and where its links lead. Plain shapes in, plain values out; the page
 * maps Payload documents onto these.
 */

/** The localized fields readiness is decided on, as read in one locale with `fallbackLocale: 'none'`. */
export type PageLocalizedFields = {
  title?: string | null
  slug?: string | null
  layout?: readonly unknown[] | null
}

const filled = (value: string | null | undefined): boolean =>
  typeof value === 'string' && value.trim() !== ''

/**
 * Whether a marketing page is ready in a locale: its title and slug are filled there, and
 * it has at least one block. The page's counterpart of an Item's title, slug and
 * description (ADR-0002) — a page with no blocks in a locale is a heading over nothing, so
 * it gets no URL there. Read without locale fallback, or the other locale's blocks would
 * make an untranslated page look ready.
 */
export const isPageReady = (state: PageLocalizedFields | null | undefined): boolean =>
  Boolean(state) &&
  filled(state?.title) &&
  filled(state?.slug) &&
  Array.isArray(state?.layout) &&
  state.layout.length > 0

/**
 * A Published marketing page's slug, title and path in each locale it is ready in, and in
 * no other — so a missing locale has no page, no hreflang alternate and no backlink — plus
 * the Occasion it is written up for, if any.
 */
export type PageListing = {
  id: number
  occasion: number | null
  paths: Partial<Record<Locale, string>>
  slugs: Partial<Record<Locale, string>>
  titles: Partial<Record<Locale, string>>
}

export const pageListing = (
  id: number,
  occasion: number | null,
  states: Partial<Record<Locale, PageLocalizedFields | null>>,
): PageListing => {
  const listing: PageListing = { id, occasion, paths: {}, slugs: {}, titles: {} }

  for (const locale of LOCALES) {
    const state = states[locale]

    if (isPageReady(state) && state?.slug && state.title) {
      listing.paths[locale] = marketingPagePath(locale, state.slug)
      listing.slugs[locale] = state.slug
      listing.titles[locale] = state.title
    }
  }

  return listing
}

/**
 * Each Occasion's page in a locale, by Occasion id: what an Item's backlink to its Occasion
 * pages is built from (`occasionLinks`). One field on the page — the Occasion it is written
 * up for — drives both directions. An Occasion whose page has no URL here is left out, so
 * nothing links to a 404.
 */
export const occasionPages = (
  listings: readonly PageListing[],
  locale: Locale,
): Map<number, string> => {
  const pages = new Map<number, string>()

  for (const { occasion, paths } of listings) {
    const path = paths[locale]

    if (occasion !== null && path !== undefined) {
      pages.set(occasion, path)
    }
  }

  return pages
}

/**
 * What an editorial link may point at inside the site: marketing pages and Items. The
 * website template's `link` field targets `pages` and `posts`; this site has no posts.
 */
export const LINK_TARGETS = ['pages', 'items'] as const

export type LinkTarget = (typeof LINK_TARGETS)[number]

/** The key a link's internal target is looked up by: `pages:3`, `items:10`. */
export const linkTargetKey = (
  relationTo: LinkTarget | (string & {}),
  id: number | string,
): string => `${relationTo}:${id}`

/**
 * Every Item and marketing page with a URL in this locale, by `linkTargetKey`: where an
 * editorial link may lead. One missing here has no URL in this locale, so a link to it is
 * left unlinked rather than pointed at a 404.
 */
export const linkTargets = (
  listings: Record<LinkTarget, readonly { id: number; paths: Partial<Record<Locale, string>> }[]>,
  locale: Locale,
): Map<string, string> => {
  const targets = new Map<string, string>()

  for (const relationTo of LINK_TARGETS) {
    for (const { id, paths } of listings[relationTo]) {
      const path = paths[locale]

      if (path !== undefined) {
        targets.set(linkTargetKey(relationTo, id), path)
      }
    }
  }

  return targets
}

/** An internal link's target as Payload stores it, populated or not. */
export type LinkReference = {
  relationTo: string
  value: number | string | { id: number | string }
}

/** A link as the template's `link` field holds it. */
export type CmsLink = {
  type?: 'reference' | 'custom' | null
  reference?: LinkReference | null
  url?: string | null
}

/**
 * Where an editorial link leads in this locale: a custom URL as Jana typed it, or an
 * internal target's path from `targets` (keyed by `linkTargetKey`). `null` when an internal
 * target has no URL here — untranslated, or not Published — so the caller renders the label
 * without a link rather than a link to a 404.
 */
export const linkHref = (link: CmsLink, targets: ReadonlyMap<string, string>): string | null => {
  if (link.type === 'custom') {
    return filled(link.url) ? (link.url ?? null) : null
  }

  return referenceHref(link.reference, targets)
}

/** An internal target's path in this locale, or `null` — shared by blocks and rich text. */
export const referenceHref = (
  reference: LinkReference | null | undefined,
  targets: ReadonlyMap<string, string>,
): string | null => {
  if (!reference) {
    return null
  }

  const id = typeof reference.value === 'object' ? reference.value.id : reference.value

  return targets.get(linkTargetKey(reference.relationTo, id)) ?? null
}

type Node = Record<string, unknown>

const isNode = (value: unknown): value is Node => typeof value === 'object' && value !== null

/**
 * Whether Lexical rich text holds a heading of a level — `h1` — anywhere. Walks the JSON
 * Payload stores rather than importing Lexical, which `src/domain` may not.
 */
export const hasHeading = (richText: unknown, tag: string): boolean => {
  const visit = (node: Node): boolean =>
    (node['type'] === 'heading' && node['tag'] === tag) ||
    (Array.isArray(node['children']) && node['children'].filter(isNode).some(visit))

  return isNode(richText) && isNode(richText['root']) && visit(richText['root'])
}
