import type { StoredLeadTime } from './lead-time'
import { formatEuros } from './menu'
import { LOCALES, itemPath, type Catalogue, type Locale } from './routes'

/**
 * An Item page's derived values: which locales it exists in, and what it links to. Plain
 * shapes in, plain values out; the page maps Payload documents onto these.
 */

/**
 * What a rich-text description says, as plain text: one line per paragraph. Walks the
 * Lexical JSON Payload stores rather than importing Lexical, which `src/domain` may not.
 */
export const plainText = (richText: unknown): string => {
  const root = isNode(richText) && isNode(richText['root']) ? richText['root'] : null

  if (!root) {
    return ''
  }

  return children(root).map(inlineText).join('\n').trim()
}

type Node = Record<string, unknown>

const isNode = (value: unknown): value is Node => typeof value === 'object' && value !== null

const children = (node: Node): Node[] =>
  Array.isArray(node['children']) ? node['children'].filter(isNode) : []

const inlineText = (node: Node): string =>
  typeof node['text'] === 'string' ? node['text'] : children(node).map(inlineText).join('')

/** The localized fields readiness is decided on, as read in one locale with `fallbackLocale: 'none'`. */
export type LocalizedFields = {
  title?: string | null
  slug?: string | null
  description?: unknown
}

const filled = (value: string | null | undefined): boolean =>
  typeof value === 'string' && value.trim() !== ''

/**
 * Whether an Item is ready in a locale: its title, slug and description are filled in that
 * locale (ADR-0002). Everything else may fall back. The state must be read without locale
 * fallback, or an untranslated field would read as the other locale's and pass.
 */
export const isReady = (state: LocalizedFields | null | undefined): boolean =>
  Boolean(state) &&
  filled(state?.title) &&
  filled(state?.slug) &&
  plainText(state?.description) !== ''

/**
 * An Item's public path in each locale it is ready in, and in no other. This is what
 * `alternates` builds the hreflang set from, so an untranslated locale is omitted from the
 * set rather than pointed at a 404 — which would break reciprocity (ADR-0002).
 */
export const itemPaths = (
  catalogue: Catalogue,
  states: Partial<Record<Locale, LocalizedFields | null>>,
): Partial<Record<Locale, string>> => {
  const paths: Partial<Record<Locale, string>> = {}

  for (const locale of LOCALES) {
    const state = states[locale]

    if (isReady(state) && state?.slug) {
      paths[locale] = itemPath(catalogue, locale, state.slug)
    }
  }

  return paths
}

/**
 * A Published Item's slug, title and path in each locale it is ready in, and in no other.
 * A locale missing here is one the Item has no URL in: no page, no hreflang alternate, no
 * catalogue entry. Published is one state for the whole document; readiness is per locale.
 */
export type ItemListing = {
  id: number
  catalogue: Catalogue
  paths: Partial<Record<Locale, string>>
  slugs: Partial<Record<Locale, string>>
  titles: Partial<Record<Locale, string>>
}

export const itemListing = (
  id: number,
  catalogue: Catalogue,
  states: Partial<Record<Locale, LocalizedFields | null>>,
): ItemListing => {
  const paths = itemPaths(catalogue, states)
  const slugs: ItemListing['slugs'] = {}
  const titles: ItemListing['titles'] = {}

  for (const locale of LOCALES) {
    const { slug, title } = states[locale] ?? {}

    if (paths[locale] !== undefined && slug && title) {
      slugs[locale] = slug
      titles[locale] = title
    }
  }

  return { id, catalogue, paths, slugs, titles }
}

/**
 * The Sponges or Fillings a customer may choose: the Item's own list, or every one when it
 * names none — "Leave empty to offer every Sponge", as the admin tells Jana. Unpopulated
 * entries (bare ids) are skipped.
 */
export const offeredChoices = <T extends { id: number | string }>(
  own: readonly (number | string | T)[] | null | undefined,
  every: readonly T[],
): T[] => {
  const chosen = (own ?? []).filter((each): each is T => typeof each === 'object')

  return chosen.length > 0 ? chosen : [...every]
}

/** What choosing an Item's siblings needs of each Item: its Category by id, and its catalogue. */
export type SiblingCandidate = {
  id: number | string
  title: string
  category: number | string
  catalogue: Catalogue
}

const byTitle = (a: { title: string }, b: { title: string }): number =>
  a.title.localeCompare(b.title)

/**
 * The two or three Items an Item page links to, computed from Item data rather than
 * authored (ADR-0003). Its own Category first, starting from the Item after it and wrapping
 * round, so every Item in a Category is linked from another rather than the first three
 * from all of them. A Category too small to fill the list is made up from the rest of the
 * same catalogue: a cake page never links a box of brownies as a sibling.
 */
export const siblingItems = <T extends SiblingCandidate>(
  current: T,
  candidates: readonly T[],
): T[] => {
  const catalogue = candidates.filter((each) => each.catalogue === current.catalogue)
  const category = catalogue.filter((each) => each.category === current.category).sort(byTitle)
  const position = category.findIndex((each) => each.id === current.id)
  const wrapped = [...category.slice(position + 1), ...category.slice(0, Math.max(position, 0))]
  const rest = catalogue.filter((each) => each.category !== current.category).sort(byTitle)

  return [...wrapped, ...rest].filter((each) => each.id !== current.id).slice(0, 3)
}

/**
 * The Lead time an Item page states: the Item's own override when it sets both halves,
 * otherwise the site-wide one; `null` when neither is set. Half an override is refused on save, so meeting one here
 * means old data; it falls back whole rather than mixing one half of each (CONTEXT.md:
 * Lead time is the pair).
 */
export const itemLeadTime = (
  site: Partial<StoredLeadTime>,
  override: Partial<Record<keyof StoredLeadTime, unknown>> | null | undefined,
): StoredLeadTime | null => {
  for (const { days, timeOfDay } of [override ?? {}, site]) {
    if (typeof days === 'number' && typeof timeOfDay === 'string' && timeOfDay !== '') {
      return { days, timeOfDay }
    }
  }

  return null
}

/**
 * The links from an Item back to its Occasion pages — the backlink ADR-0003 names as the
 * one most likely to be forgotten, without which Occasion pages are orphans. An Occasion
 * is a tag; its page is a marketing page Jana writes when she has something to say, so a
 * tagged Occasion with no page yet is left out rather than linked to a 404.
 *
 * `pages` maps an Occasion's id to its page's path in this locale.
 */
export const occasionLinks = (
  occasions: readonly (number | string | { id: number | string; name: string })[],
  pages: ReadonlyMap<number | string, string>,
): { name: string; href: string }[] =>
  occasions.flatMap((occasion) => {
    if (typeof occasion !== 'object') {
      return []
    }

    const href = pages.get(occasion.id)

    return href === undefined ? [] : [{ name: occasion.name, href }]
  })

/** What a Filling adds to an Item's price — `+€2.50` — or `null` when it adds nothing. */
export const surcharge = (amount: number | null | undefined, locale: Locale): string | null =>
  typeof amount === 'number' && amount > 0 ? `+${formatEuros(amount, locale)}` : null
