import { describe, expect, it } from 'vitest'

import { resolveLocale } from './locale'

describe('resolveLocale', () => {
  it('rewrites the bare root onto the English tree', () => {
    expect(resolveLocale('/')).toEqual({ kind: 'page', locale: 'en', rewrite: '/en' })
  })

  it('rewrites any unprefixed path onto the English tree, keeping the path', () => {
    expect(resolveLocale('/cakes')).toEqual({ kind: 'page', locale: 'en', rewrite: '/en/cakes' })
    expect(resolveLocale('/cakes/apple-pie')).toEqual({
      kind: 'page',
      locale: 'en',
      rewrite: '/en/cakes/apple-pie',
    })
  })

  it('passes the Dutch tree through untouched', () => {
    expect(resolveLocale('/nl')).toEqual({ kind: 'page', locale: 'nl', rewrite: null })
    expect(resolveLocale('/nl/taarten/appeltaart')).toEqual({
      kind: 'page',
      locale: 'nl',
      rewrite: null,
    })
  })

  it('treats /nl as a prefix only when it is a whole segment', () => {
    // A marketing page slugged `nlnieuws` is English content at the root, not Dutch.
    expect(resolveLocale('/nlnieuws')).toEqual({
      kind: 'page',
      locale: 'en',
      rewrite: '/en/nlnieuws',
    })
  })

  it('does not honour a typed /en prefix, so English has exactly one URL per page', () => {
    // `/en/cakes` lands on `/en/en/cakes`, which 404s, rather than duplicating `/cakes`.
    expect(resolveLocale('/en/cakes')).toEqual({
      kind: 'page',
      locale: 'en',
      rewrite: '/en/en/cakes',
    })
  })

  it.each(['/admin', '/admin/collections/items', '/api/items', '/next/preview', '/_next/static/x'])(
    'leaves the framework path %s alone',
    (pathname) => {
      expect(resolveLocale(pathname)).toEqual({ kind: 'framework' })
    },
  )

  it('only reserves a framework segment when it is the whole segment', () => {
    expect(resolveLocale('/apple-pie')).toMatchObject({ kind: 'page', locale: 'en' })
    expect(resolveLocale('/administratie')).toMatchObject({ kind: 'page', locale: 'en' })
  })
})
