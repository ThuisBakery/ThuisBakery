import { describe, expect, it } from 'vitest'

import { alternates } from './alternates'
import {
  hasHeading,
  isPageReady,
  linkHref,
  linkTargetKey,
  linkTargets,
  occasionPages,
  pageListing,
} from './page'

const block = { blockType: 'content', columns: [] }

const english = { title: 'Christmas', slug: 'christmas', layout: [block] }
const dutch = { title: 'Kerst', slug: 'kerst', layout: [block] }

describe('isPageReady', () => {
  it('is ready with a title, a slug and at least one block in that locale', () => {
    expect(isPageReady(english)).toBe(true)
  })

  it('is not ready while any of the three is missing or blank', () => {
    expect(isPageReady({ ...english, title: ' ' })).toBe(false)
    expect(isPageReady({ ...english, slug: null })).toBe(false)
    expect(isPageReady({ ...english, layout: [] })).toBe(false)
    expect(isPageReady({ ...english, layout: null })).toBe(false)
    expect(isPageReady(null)).toBe(false)
  })
})

describe('pageListing', () => {
  it('gives a page a path, slug and title in each locale it is ready in', () => {
    expect(pageListing(3, 7, { en: english, nl: dutch })).toEqual({
      id: 3,
      occasion: 7,
      paths: { en: '/christmas', nl: '/nl/kerst' },
      slugs: { en: 'christmas', nl: 'kerst' },
      titles: { en: 'Christmas', nl: 'Kerst' },
    })
  })

  it('gives an untranslated page no Dutch URL, so its hreflang omits Dutch', () => {
    const listing = pageListing(3, null, { en: english, nl: { title: 'Kerst', slug: 'kerst' } })

    expect(listing.paths).toEqual({ en: '/christmas' })
    expect(listing.slugs).toEqual({ en: 'christmas' })
    expect(alternates(listing.paths, 'en', 'https://thuisbakery.nl').languages).toEqual({
      en: 'https://thuisbakery.nl/christmas',
      'x-default': 'https://thuisbakery.nl/christmas',
    })
  })
})

describe('occasionPages', () => {
  const wedding = pageListing(1, 20, { en: { ...english, slug: 'weddings' } })
  const birthday = pageListing(2, 21, { en: { ...english, slug: 'birthdays' }, nl: dutch })
  const seasonal = pageListing(3, null, { en: english, nl: dutch })

  it('maps each Occasion to the path of the page written up for it, in this locale', () => {
    expect(occasionPages([wedding, birthday, seasonal], 'en')).toEqual(
      new Map([
        [20, '/weddings'],
        [21, '/birthdays'],
      ]),
    )
  })

  it('leaves out an Occasion whose page has no URL in this locale', () => {
    expect(occasionPages([wedding, birthday], 'nl')).toEqual(new Map([[21, '/nl/kerst']]))
  })
})

describe('linkHref', () => {
  const targets = new Map([
    [linkTargetKey('pages', 3), '/christmas'],
    [linkTargetKey('items', 10), '/cakes/apple-pie'],
  ])

  it('passes a custom URL through', () => {
    expect(linkHref({ type: 'custom', url: '/cakes' }, targets)).toBe('/cakes')
  })

  it('resolves a reference to a page or an Item, populated or not', () => {
    expect(
      linkHref({ type: 'reference', reference: { relationTo: 'pages', value: 3 } }, targets),
    ).toBe('/christmas')
    expect(
      linkHref(
        { type: 'reference', reference: { relationTo: 'items', value: { id: 10 } } },
        targets,
      ),
    ).toBe('/cakes/apple-pie')
  })

  it('links nowhere rather than to a 404 when the target has no URL in this locale', () => {
    expect(
      linkHref({ type: 'reference', reference: { relationTo: 'pages', value: 4 } }, targets),
    ).toBeNull()
    expect(linkHref({ type: 'reference', reference: null }, targets)).toBeNull()
    expect(linkHref({ type: 'custom', url: ' ' }, targets)).toBeNull()
  })
})

describe('hasHeading', () => {
  const doc = (...children: unknown[]) => ({ root: { type: 'root', children } })

  it('finds a heading of that level anywhere in the rich text', () => {
    expect(hasHeading(doc({ type: 'heading', tag: 'h1', children: [] }), 'h1')).toBe(true)
    expect(
      hasHeading(doc({ type: 'quote', children: [{ type: 'heading', tag: 'h1' }] }), 'h1'),
    ).toBe(true)
  })

  it('finds none in other levels, other nodes, or nothing at all', () => {
    expect(hasHeading(doc({ type: 'heading', tag: 'h2', children: [] }), 'h1')).toBe(false)
    expect(hasHeading(doc({ type: 'paragraph', children: [] }), 'h1')).toBe(false)
    expect(hasHeading(null, 'h1')).toBe(false)
  })
})

describe('linkTargets', () => {
  const item = { id: 10, paths: { en: '/cakes/apple-pie' } }
  const page = pageListing(3, null, { en: english, nl: dutch })

  it('maps every Item and page with a URL in this locale to that URL', () => {
    expect(linkTargets({ items: [item], pages: [page] }, 'en')).toEqual(
      new Map([
        ['items:10', '/cakes/apple-pie'],
        ['pages:3', '/christmas'],
      ]),
    )
  })

  it('leaves out one with no URL in this locale', () => {
    expect(linkTargets({ items: [item], pages: [page] }, 'nl')).toEqual(
      new Map([['pages:3', '/nl/kerst']]),
    )
  })
})
