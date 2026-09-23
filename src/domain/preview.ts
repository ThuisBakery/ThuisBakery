import { pagePath, type CodedPage, type Locale } from './routes'

/**
 * Live Preview's entry point.
 *
 * Payload renders the preview in an iframe whose `src` is this path. The route behind it
 * authenticates Jana, enables Next's `draftMode()`, and redirects to the Item's real
 * public URL — so a preview is the live page with drafts turned on, not a second
 * rendering path that can drift from it.
 *
 * The URL carries an id rather than a resolved path on purpose: Payload warns that the
 * `url` function runs on every autosave, so it must not read the database. Resolving the
 * Item's catalogue and slug happens once, inside the route, on load.
 */
export const PREVIEW_ROUTE = '/next/preview'

export type PreviewTarget =
  { kind: 'collection'; slug: string; id: number | string } | { kind: 'global'; slug: string }

export const previewUrl = (target: PreviewTarget, locale: string): string => {
  const params = new URLSearchParams({ kind: target.kind, slug: target.slug, locale })

  if (target.kind === 'collection') {
    params.set('id', String(target.id))
  }

  return `${PREVIEW_ROUTE}?${params.toString()}`
}

/**
 * The coded pages whose words live in a global of their own — the page-content singletons of
 * ADR-0003 — by the global's slug.
 */
const PAGE_GLOBALS: Readonly<Record<string, CodedPage>> = {
  about: 'about',
  contact: 'contact',
  'custom-order': 'customOrder',
  privacy: 'privacy',
}

/**
 * Where a global is previewed: a page's own global on that page, and a site-wide one — the
 * Lead time, Closed until, the homepage's words — on the front page.
 */
export const globalPreviewPath = (slug: string, locale: Locale): string =>
  pagePath((Object.hasOwn(PAGE_GLOBALS, slug) && PAGE_GLOBALS[slug]) || 'home', locale)
