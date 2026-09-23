import { itemTitle } from './dictionary'
import type { CodedPage } from './routes'

/**
 * What a page puts in front of a search engine, per ADR-0002: the title and description Jana
 * wrote in the SEO fields (`@payloadcms/plugin-seo`), or a computed fallback, so a blank
 * field is impossible. The fields are deliberately not required — that would only teach
 * the editor to paste the title in twice.
 *
 * The plugin supplies the fields and nothing else. hreflang, canonicals, the sitemap and
 * JSON-LD are ours (`alternates`, `sitemap`, `structured-data`).
 */

/** The SEO field group as read in one locale, with `fallbackLocale: 'none'`. */
export type MetaFields = { title?: string | null; description?: string | null } | null | undefined

/**
 * Where a computed description is cut. Google shows roughly this much before truncating on
 * its own; the plugin's counter asks Jana for 100–150 characters.
 */
export const DESCRIPTION_LENGTH = 155

const written = (value: string | null | undefined): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : null

/** Jana's title, as she wrote it, or `<name> — ThuisBakery`. */
export const metaTitle = (meta: MetaFields, name: string): string =>
  written(meta?.title) ?? itemTitle(name)

/**
 * Jana's description, or the page's own text cut at a word to fit. `undefined` when both are
 * empty, so the page leaves the tag out rather than emitting an empty one — Google then
 * writes its own snippet from the page.
 *
 * What Jana wrote is not cut: the plugin's counter has already told her the length, and a
 * sentence she chose to run long is hers to keep.
 */
export const metaDescription = (meta: MetaFields, fallback: string): string | undefined =>
  written(meta?.description) ?? (truncate(fallback) || undefined)

const truncate = (text: string): string => {
  const line = text.replace(/\s+/g, ' ').trim()

  if (line.length <= DESCRIPTION_LENGTH) {
    return line
  }

  // Room for the ellipsis, then back to the last whole word.
  const cut = line.slice(0, DESCRIPTION_LENGTH)
  const lastSpace = cut.lastIndexOf(' ')
  const words = lastSpace > 0 ? cut.slice(0, lastSpace) : cut.slice(0, DESCRIPTION_LENGTH - 1)

  return `${words.replace(/[\s,;:.–—-]+$/, '')}…`
}

type Node = Record<string, unknown>

const isNode = (value: unknown): value is Node => typeof value === 'object' && value !== null

const children = (node: Node): Node[] =>
  Array.isArray(node['children']) ? node['children'].filter(isNode) : []

const inlineText = (node: Node): string =>
  typeof node['text'] === 'string' ? node['text'] : children(node).map(inlineText).join('')

/**
 * The prose of some Lexical rich text, in order, as one line: what a computed description
 * is cut from. Headings are left out — on a marketing page the first is the page's own
 * title, which the search result already shows. Walks the stored JSON rather than
 * importing Lexical, which `src/domain` may not.
 */
export const summary = (richTexts: readonly unknown[]): string =>
  richTexts
    .flatMap((richText) =>
      isNode(richText) && isNode(richText['root']) ? children(richText['root']) : [],
    )
    .filter((node) => node['type'] !== 'heading')
    .map(inlineText)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * A marketing page's rich text as a reader meets it: the hero's, then each block's — a
 * Call to action's own, a Content block's per column. What `summary` reads a marketing
 * page's computed description from; the page has no description field of its own.
 */
export const pageRichTexts = (page: { hero?: unknown; layout?: unknown }): unknown[] =>
  [
    isNode(page.hero) ? page.hero['richText'] : undefined,
    ...(Array.isArray(page.layout) ? page.layout : [])
      .filter(isNode)
      .flatMap((block) => [
        block['richText'],
        ...(Array.isArray(block['columns'])
          ? block['columns'].filter(isNode).map((column) => column['richText'])
          : []),
      ]),
  ].filter((richText) => richText !== undefined && richText !== null)

/**
 * The text a blank description is cut from: an Item's description, or a marketing page's
 * own words, having no description field. One function for both the page's `<meta>` and
 * the admin's Auto-generate button, so the button fills in exactly what the page would say.
 */
export const descriptionFallback = (
  collection: 'items' | 'pages',
  doc: { description?: unknown; hero?: unknown; layout?: unknown },
): string => summary(collection === 'pages' ? pageRichTexts(doc) : [doc.description])

/**
 * Whether a coded page is for search. The Enquiry receipt is not: it is reached only by
 * sending an Enquiry. It carries `noindex` and is left out of the sitemap — one rule, read
 * in both places, so the two can never disagree.
 */
export const isIndexed = (page: CodedPage): boolean => page !== 'enquirySent'
