import { describe, expect, it } from 'vitest'

import {
  CATALOGUES,
  LOCALES,
  LINKABLE_PAGES,
  RESERVED_SLUGS,
  cataloguePath,
  isCatalogue,
  isLocale,
  isReservedSlug,
  itemPath,
  itemSegments,
  marketingPagePath,
  marketingPageSegments,
  resolveMarketingPage,
  otherLocale,
  pagePath,
  pageSegments,
  resolveItem,
  resolvePage,
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

describe('pagePath', () => {
  it('puts each locale’s home at its root', () => {
    expect(pagePath('home', 'en')).toBe('/')
    expect(pagePath('home', 'nl')).toBe('/nl')
  })

  it('localizes the static segment, not just the prefix', () => {
    expect(pagePath('customOrder', 'en')).toBe('/custom-order')
    expect(pagePath('customOrder', 'nl')).toBe('/nl/maatwerk')
    expect(pagePath('about', 'nl')).toBe('/nl/over-jana')
    expect(pagePath('privacy', 'nl')).toBe('/nl/privacy')
  })
})

describe('resolvePage', () => {
  it('finds each locale’s home from no segments at all', () => {
    expect(resolvePage('en', [])).toBe('home')
    expect(resolvePage('nl', [])).toBe('home')
  })

  it('finds a coded page from its localized segment', () => {
    expect(resolvePage('en', ['cakes'])).toBe('cakes')
    expect(resolvePage('nl', ['taarten'])).toBe('cakes')
    expect(resolvePage('nl', ['over-jana'])).toBe('about')
  })

  it('does not resolve one locale’s segment under the other', () => {
    // `/taarten` is not a page, and neither is `/nl/cakes`: each has one URL per locale.
    expect(resolvePage('en', ['taarten'])).toBeNull()
    expect(resolvePage('nl', ['cakes'])).toBeNull()
  })

  it('leaves anything deeper or unknown to other resolvers', () => {
    expect(resolvePage('en', ['cakes', 'apple-pie'])).toBeNull()
    expect(resolvePage('en', ['summer'])).toBeNull()
  })
})

describe('resolveItem', () => {
  it('names an Item by its catalogue’s localized segment and its slug', () => {
    expect(resolveItem('en', ['cakes', 'apple-pie'])).toEqual({
      catalogue: 'cakes',
      slug: 'apple-pie',
    })
    expect(resolveItem('nl', ['lekkernijen', 'brownies'])).toEqual({
      catalogue: 'nibbles',
      slug: 'brownies',
    })
  })

  it('does not accept the other locale’s catalogue segment', () => {
    expect(resolveItem('en', ['taarten', 'appeltaart'])).toBeNull()
    expect(resolveItem('nl', ['cakes', 'apple-pie'])).toBeNull()
  })

  it('names nothing that is not a catalogue followed by exactly one slug', () => {
    expect(resolveItem('en', ['cakes'])).toBeNull()
    expect(resolveItem('en', ['about', 'jana'])).toBeNull()
    expect(resolveItem('en', ['cakes', 'apple-pie', 'more'])).toBeNull()
    expect(resolveItem('en', [])).toBeNull()
  })
})

describe('itemSegments', () => {
  it('round-trips through resolveItem and agrees with itemPath', () => {
    expect(itemSegments('cakes', 'nl', 'appeltaart')).toEqual(['taarten', 'appeltaart'])
    expect(resolveItem('nl', itemSegments('cakes', 'nl', 'appeltaart'))).toEqual({
      catalogue: 'cakes',
      slug: 'appeltaart',
    })
    expect(`/nl/${itemSegments('cakes', 'nl', 'appeltaart').join('/')}`).toBe(
      itemPath('cakes', 'nl', 'appeltaart'),
    )
  })
})

describe('pageSegments', () => {
  it('is what the catch-all receives after the locale, and round-trips through resolvePage', () => {
    expect(pageSegments('home', 'nl')).toEqual([])
    expect(pageSegments('about', 'nl')).toEqual(['over-jana'])
    expect(resolvePage('nl', pageSegments('about', 'nl'))).toBe('about')
  })
})

describe('otherLocale', () => {
  it('is the locale the language switcher leads to', () => {
    expect(otherLocale('en')).toBe('nl')
    expect(otherLocale('nl')).toBe('en')
  })
})

describe('the confirmation page', () => {
  it('has a path in each locale, like any coded page', () => {
    expect(pagePath('enquirySent', 'en')).toBe('/enquiry-sent')
    expect(pagePath('enquirySent', 'nl')).toBe('/nl/vraag-verstuurd')
    expect(resolvePage('nl', ['vraag-verstuurd'])).toBe('enquirySent')
  })

  it('is not a page the Header or Footer can link to', () => {
    expect(LINKABLE_PAGES).not.toContain('enquirySent')
    expect(LINKABLE_PAGES).toContain('customOrder')
  })
})

describe('isReservedSlug', () => {
  it.each([
    'cakes',
    'taarten',
    'nibbles',
    'lekkernijen',
    'custom-order',
    'maatwerk',
    'contact',
    'enquiry-sent',
    'vraag-verstuurd',
  ])('rejects the coded segment %s', (slug) => {
    expect(isReservedSlug(slug)).toBe(true)
  })

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

describe('marketingPagePath', () => {
  it('puts a marketing page at the bare root in English and under /nl in Dutch', () => {
    expect(marketingPagePath('en', 'christmas')).toBe('/christmas')
    expect(marketingPagePath('nl', 'kerst')).toBe('/nl/kerst')
  })
})

describe('resolveMarketingPage', () => {
  it('names the slug of a single segment no coded page claims', () => {
    expect(resolveMarketingPage('en', ['christmas'])).toBe('christmas')
    expect(resolveMarketingPage('nl', ['kerst'])).toBe('kerst')
  })

  it('names nothing for home, a coded page, or a deeper path', () => {
    expect(resolveMarketingPage('en', [])).toBeNull()
    expect(resolveMarketingPage('en', ['cakes'])).toBeNull()
    expect(resolveMarketingPage('nl', ['taarten'])).toBeNull()
    expect(resolveMarketingPage('en', ['cakes', 'apple-pie'])).toBeNull()
  })

  it('round-trips with the segments a marketing page is generated at', () => {
    expect(resolveMarketingPage('nl', marketingPageSegments('kerst'))).toBe('kerst')
  })
})
