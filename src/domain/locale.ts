import { DEFAULT_LOCALE, FRAMEWORK_SEGMENTS, type Locale } from './routes'

/**
 * Which locale a request is for, read from its path alone — the whole of what `proxy.ts`
 * decides.
 *
 * ADR-0002: English at the bare root, Dutch under `/nl`, and no automatic language
 * detection anywhere. So the only input is the pathname — never `Accept-Language`, never a
 * cookie — which is what keeps every public page static and free of `Vary`.
 *
 * English is served by a **rewrite** onto the `/en` tree, never a redirect: the visitor and
 * Googlebot keep the unprefixed URL.
 */
export type LocaleResolution =
  | {
      kind: 'page'
      locale: Locale
      /** Where the request is rewritten to, or `null` to pass it through untouched. */
      rewrite: string | null
    }
  /** Payload's admin and API, the preview route, and Next's own assets. Not ours to route. */
  | { kind: 'framework' }

/** The first segment of a path, without its slashes: `/nl/taarten` → `nl`. */
const firstSegment = (pathname: string): string => pathname.split('/')[1] ?? ''

const framework = new Set(FRAMEWORK_SEGMENTS)

export const resolveLocale = (pathname: string): LocaleResolution => {
  const first = firstSegment(pathname)

  if (framework.has(first)) {
    return { kind: 'framework' }
  }

  if (first === 'nl') {
    return { kind: 'page', locale: 'nl', rewrite: null }
  }

  // Everything else is English, including a typed `/en/…`: rewriting it to `/en/en/…`
  // 404s, which is what keeps English at one URL per page rather than two.
  const rest = pathname === '/' ? '' : pathname

  return { kind: 'page', locale: DEFAULT_LOCALE, rewrite: `/${DEFAULT_LOCALE}${rest}` }
}
