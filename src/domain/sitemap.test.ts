import { describe, expect, it } from 'vitest'

import { alternates } from './alternates'
import { itemListing } from './item'
import { pageListing } from './page'
import { LOCALES, pagePath } from './routes'
import { sitemapEntries, type SitemapEntry } from './sitemap'

const origin = 'https://thuisbakery.nl'

const description = {
  root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Good.' }] }] },
}

const block = { blockType: 'content', columns: [] }

/** Translated in both locales. */
const applePie = itemListing(1, 'cakes', {
  en: { title: 'Apple pie', slug: 'apple-pie', description },
  nl: { title: 'Appeltaart', slug: 'appeltaart', description },
})

/** Written in English only: no Dutch URL. */
const brownies = itemListing(2, 'nibbles', {
  en: { title: 'Brownies', slug: 'brownies', description },
  nl: { title: null, slug: null, description: null },
})

/** Written in Dutch only: no English URL, so no x-default either. */
const kerststol = itemListing(3, 'cakes', {
  nl: { title: 'Kerststol', slug: 'kerststol', description },
})

const christmas = pageListing(4, null, {
  en: { title: 'Christmas', slug: 'christmas', layout: [block] },
  nl: { title: 'Kerst', slug: 'kerst', layout: [block] },
})

/** Built in English only. */
const weddings = pageListing(5, 6, {
  en: { title: 'Weddings', slug: 'weddings', layout: [block] },
  nl: { title: 'Bruiloft', slug: 'bruiloft', layout: [] },
})

const entries = sitemapEntries(
  { items: [applePie, brownies, kerststol], pages: [christmas, weddings] },
  origin,
)
const urls = entries.map((entry) => entry.url)
const byUrl = new Map(entries.map((entry) => [entry.url, entry]))

describe('sitemapEntries', () => {
  it('lists the coded pages in both locale trees', () => {
    expect(urls).toEqual(
      expect.arrayContaining([
        'https://thuisbakery.nl/',
        'https://thuisbakery.nl/nl',
        'https://thuisbakery.nl/cakes',
        'https://thuisbakery.nl/nl/taarten',
        'https://thuisbakery.nl/custom-order',
        'https://thuisbakery.nl/nl/maatwerk',
      ]),
    )
  })

  it('leaves out the Enquiry receipt, which is not for search', () => {
    expect(urls).not.toContain(`${origin}${pagePath('enquirySent', 'en')}`)
    expect(urls).not.toContain(`${origin}${pagePath('enquirySent', 'nl')}`)
  })

  it('lists Item pages and marketing pages in both locale trees', () => {
    expect(urls).toEqual(
      expect.arrayContaining([
        'https://thuisbakery.nl/cakes/apple-pie',
        'https://thuisbakery.nl/nl/taarten/appeltaart',
        'https://thuisbakery.nl/christmas',
        'https://thuisbakery.nl/nl/kerst',
      ]),
    )
  })

  it('leaves an untranslated Item or page out of that locale, and keeps it in the other', () => {
    expect(urls).toContain('https://thuisbakery.nl/nibbles/brownies')
    expect(urls.some((url) => url.includes('/nl/lekkernijen/'))).toBe(false)

    expect(urls).toContain('https://thuisbakery.nl/nl/taarten/kerststol')
    expect(urls.some((url) => url.endsWith('/cakes/kerststol'))).toBe(false)

    expect(urls).toContain('https://thuisbakery.nl/weddings')
    expect(urls).not.toContain('https://thuisbakery.nl/nl/bruiloft')
  })

  it('lists every URL once', () => {
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('annotates each URL exactly as its page does', () => {
    const entry = byUrl.get('https://thuisbakery.nl/nl/taarten/appeltaart')

    expect(entry?.alternates.languages).toEqual(alternates(applePie.paths, 'nl', origin).languages)
  })
})

/**
 * The final sweep ADR-0002 asks for, over every page type the site has: coded pages, Items
 * and marketing pages, translated and not. The sitemap lists every indexable URL with the
 * annotations its page emits, so if these hold here they hold on the site.
 */
describe('hreflang across every page type', () => {
  const each = (test: (entry: SitemapEntry) => void) => entries.forEach(test)

  it('is self-referencing: each URL names itself under its own locale', () => {
    each((entry) => {
      const own = LOCALES.filter((locale) => entry.alternates.languages[locale] === entry.url)

      expect(own).toHaveLength(1)
    })
  })

  it('is reciprocal: every alternate is a listed URL carrying the same set', () => {
    each((entry) => {
      for (const locale of LOCALES) {
        const url = entry.alternates.languages[locale]

        if (url !== undefined) {
          expect(byUrl.get(url)?.alternates.languages).toEqual(entry.alternates.languages)
        }
      }
    })
  })

  it('never points at a URL the site does not have', () => {
    each((entry) => {
      for (const url of Object.values(entry.alternates.languages)) {
        expect(urls).toContain(url)
      }
    })
  })

  it('puts x-default on the English page wherever there is one', () => {
    each((entry) => {
      const { en, 'x-default': fallback } = entry.alternates.languages

      expect(fallback).toBe(en)
    })

    expect(byUrl.get('https://thuisbakery.nl/nl')?.alternates.languages['x-default']).toBe(
      'https://thuisbakery.nl/',
    )
  })
})
