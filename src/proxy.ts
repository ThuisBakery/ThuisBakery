import { NextResponse, type NextRequest } from 'next/server'

import { resolveLocale } from '@/domain/locale'

/**
 * English at the bare root, Dutch under `/nl` (ADR-0002). Every path not starting with
 * `/nl` is **rewritten** onto the `/en` tree — never redirected — so the visitor and
 * Googlebot keep the unprefixed URL. The decision itself is `resolveLocale`, a pure
 * function tested in `src/domain`; this file only applies it.
 *
 * It reads the path and nothing else: no `Accept-Language`, no cookie, no header set on
 * the way out. That is what keeps every public page one static file with no `Vary`.
 */
export const proxy = (request: NextRequest): NextResponse => {
  const resolution = resolveLocale(request.nextUrl.pathname)

  if (resolution.kind === 'page' && resolution.rewrite !== null) {
    const url = request.nextUrl.clone()
    url.pathname = resolution.rewrite

    return NextResponse.rewrite(url)
  }

  return NextResponse.next()
}

export const config = {
  // Skip Next's own assets and anything with a file extension. Payload's admin and API
  // still reach the proxy, and `resolveLocale` passes them through as infrastructure.
  matcher: ['/((?!_next/static|_next/image|.*\\.[^/]+$).*)'],
}
