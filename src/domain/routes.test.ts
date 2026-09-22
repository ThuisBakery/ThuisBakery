import { describe, expect, it } from 'vitest'

import {
  CATALOGUES,
  LOCALES,
  RESERVED_SLUGS,
  cataloguePath,
  isCatalogue,
  isLocale,
  isReservedSlug,
  itemPath,
} from './routes'

describe('cataloguePath', () => {
  it('puts English at the bare root', () => {
    expect(cataloguePath('cakes', 'en')).toBe('/cakes')
    expect(cataloguePath('nibbles', 'en')).toBe('/nibbles')
  })

  it('puts Dutch under the /nl prefix, with the segment localized too', () => {
    expect(cataloguePath('cakes', 'nl')).toBe('/nl/taarten')
    expect(cataloguePath('nibbles', 'nl')).toBe('/nl/lekkernijen')
  })
})

describe('itemPath', () => {
  it('nests an Item under its catalogue', () => {
    expect(itemPath('cakes', 'en', 'apple-pie')).toBe('/cakes/apple-pie')
    expect(itemPath('cakes', 'nl', 'appeltaart')).toBe('/nl/taarten/appeltaart')
    expect(itemPath('nibbles', 'nl', 'brownies')).toBe('/nl/lekkernijen/brownies')
  })
})

describe('isReservedSlug', () => {
  it.each(['cakes', 'taarten', 'nibbles', 'lekkernijen', 'custom-order', 'maatwerk', 'contact'])(
    'rejects the coded segment %s',
    (slug) => {
      expect(isReservedSlug(slug)).toBe(true)
    },
  )

  it.each(['nl', 'admin', 'api', 'next'])('rejects the infrastructure segment %s', (slug) => {
    expect(isReservedSlug(slug)).toBe(true)
  })

  it('reserves both locales’ segments in both locales', () => {
    // An English slug of `taarten` is not shadowed by a route, but a URL reading
    // /cakes/taarten is a permanent tell. One reserved set, not two.
    expect(isReservedSlug('over-jana')).toBe(true)
    expect(isReservedSlug('about')).toBe(true)
  })

  it('ignores case and surrounding whitespace, which are the same claim on a URL', () => {
    expect(isReservedSlug(' Cakes ')).toBe(true)
  })

  it.each(['apple-pie', 'appeltaart', 'bento-box', 'cake'])('allows %s', (slug) => {
    expect(isReservedSlug(slug)).toBe(false)
  })

  it('lists every reserved slug exactly once', () => {
    expect(RESERVED_SLUGS).toEqual([...new Set(RESERVED_SLUGS)])
  })
})

describe('type guards', () => {
  it('accepts the values the config declares', () => {
    expect(CATALOGUES.every(isCatalogue)).toBe(true)
    expect(LOCALES.every(isLocale)).toBe(true)
  })

  it('rejects anything else, including what Payload hands back for an unpopulated field', () => {
    expect(isCatalogue('treats')).toBe(false)
    expect(isCatalogue(undefined)).toBe(false)
    expect(isCatalogue({ id: 1 })).toBe(false)
    expect(isLocale('de')).toBe(false)
    expect(isLocale(null)).toBe(false)
  })
})
