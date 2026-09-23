import { describe, expect, it } from 'vitest'

import { alternates } from './alternates'
import {
  isReady,
  itemListing,
  offeredChoices,
  itemLeadTime,
  itemPaths,
  occasionLinks,
  plainText,
  siblingItems,
} from './item'

/** A Lexical document as Payload stores a description: paragraphs of text nodes. */
const richText = (...paragraphs: string[]) => ({
  root: {
    type: 'root',
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      children: text === '' ? [] : [{ type: 'text', text }],
    })),
  },
})

const english = {
  title: 'Apple pie',
  slug: 'apple-pie',
  description: richText('Apples, cinnamon, a lattice top.'),
}

const dutch = {
  title: 'Appeltaart',
  slug: 'appeltaart',
  description: richText('Appels, kaneel, een roosterdeeg.'),
}

describe('plainText', () => {
  it('reads the words out of a description, one paragraph per line', () => {
    expect(plainText(richText('Apples.', 'Cinnamon.'))).toBe('Apples.\nCinnamon.')
  })

  it('joins text nodes inside a paragraph without inventing spaces', () => {
    const bold = {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', text: 'Very ' },
              { type: 'text', text: 'good', format: 1 },
              { type: 'text', text: '.' },
            ],
          },
        ],
      },
    }

    expect(plainText(bold)).toBe('Very good.')
  })

  it('is empty for an editor Jana opened and left blank, or nothing at all', () => {
    expect(plainText(richText(''))).toBe('')
    expect(plainText(null)).toBe('')
    expect(plainText(undefined)).toBe('')
  })
})

describe('isReady', () => {
  it('is ready when title, slug and description are filled in that locale', () => {
    expect(isReady(english)).toBe(true)
  })

  it('is not ready with any of the three missing', () => {
    expect(isReady({ ...english, title: null })).toBe(false)
    expect(isReady({ ...english, slug: '' })).toBe(false)
    expect(isReady({ ...english, description: null })).toBe(false)
  })

  it('treats a description with no words in it as missing', () => {
    expect(isReady({ ...english, description: richText('', '  ') })).toBe(false)
  })

  it('treats a title of only spaces as missing', () => {
    expect(isReady({ ...english, title: '   ' })).toBe(false)
  })
})

describe('itemPaths', () => {
  const origin = 'https://thuisbakery.nl'

  it('gives a translated Item a path in both locales, and reciprocal alternates', () => {
    const paths = itemPaths('cakes', { en: english, nl: dutch })

    expect(paths).toEqual({ en: '/cakes/apple-pie', nl: '/nl/taarten/appeltaart' })
    expect(alternates(paths, 'nl', origin).languages).toEqual({
      en: 'https://thuisbakery.nl/cakes/apple-pie',
      nl: 'https://thuisbakery.nl/nl/taarten/appeltaart',
      'x-default': 'https://thuisbakery.nl/cakes/apple-pie',
    })
  })

  it('gives an Item untranslated in Dutch no Dutch path, and omits the Dutch alternate', () => {
    const paths = itemPaths('cakes', { en: english, nl: { ...dutch, description: null } })

    expect(paths).toEqual({ en: '/cakes/apple-pie' })
    expect(alternates(paths, 'en', origin).languages).toEqual({
      en: 'https://thuisbakery.nl/cakes/apple-pie',
      'x-default': 'https://thuisbakery.nl/cakes/apple-pie',
    })
  })

  it('gives an Item drafted in Dutch first no English path, and so no x-default', () => {
    const paths = itemPaths('nibbles', {
      en: { title: null, slug: null, description: null },
      nl: dutch,
    })

    expect(paths).toEqual({ nl: '/nl/lekkernijen/appeltaart' })
    expect(alternates(paths, 'nl', origin).languages).toEqual({
      nl: 'https://thuisbakery.nl/nl/lekkernijen/appeltaart',
    })
  })

  it('gives an Item with no state read in a locale no path there', () => {
    expect(itemPaths('cakes', { en: english })).toEqual({ en: '/cakes/apple-pie' })
  })
})

describe('siblingItems', () => {
  const item = (
    id: number,
    title: string,
    category: number,
    catalogue: 'cakes' | 'nibbles' = 'cakes',
  ) => ({
    id,
    title,
    category,
    catalogue,
  })

  const apple = item(1, 'Apple pie', 10)
  const banana = item(2, 'Banana bread', 10)
  const carrot = item(3, 'Carrot cake', 10)
  const date = item(4, 'Date loaf', 10)
  const bento = item(5, 'Bento heart', 20)
  const brownies = item(6, 'Brownies', 30, 'nibbles')

  it('links the Items after it in its own Category, wrapping round, never itself', () => {
    const all = [date, bento, carrot, apple, banana, brownies]

    expect(siblingItems(carrot, all).map(({ title }) => title)).toEqual([
      'Date loaf',
      'Apple pie',
      'Banana bread',
    ])
  })

  it('makes up a small Category from the rest of its catalogue, never the other one', () => {
    expect(siblingItems(apple, [apple, banana, bento, brownies]).map(({ title }) => title)).toEqual(
      ['Banana bread', 'Bento heart'],
    )
  })

  it('links nothing when an Item is alone in its catalogue', () => {
    expect(siblingItems(brownies, [apple, brownies])).toEqual([])
  })

  it('links at most three', () => {
    expect(siblingItems(apple, [apple, banana, carrot, date, bento])).toHaveLength(3)
  })
})

describe('itemLeadTime', () => {
  const site = { days: 3, timeOfDay: '17:00' }

  it('is the site-wide Lead time when the Item has no override', () => {
    expect(itemLeadTime(site, {})).toEqual(site)
    expect(itemLeadTime(site, null)).toEqual(site)
    expect(itemLeadTime(site, { days: null, timeOfDay: null })).toEqual(site)
  })

  it('is the Item’s own pair when it overrides both halves', () => {
    expect(itemLeadTime(site, { days: 7, timeOfDay: '12:00' })).toEqual({
      days: 7,
      timeOfDay: '12:00',
    })
  })

  it('is nothing to state when neither is set: a Lead time global never saved', () => {
    expect(itemLeadTime({}, null)).toBeNull()
    expect(itemLeadTime({}, { days: 7, timeOfDay: '12:00' })).toEqual({
      days: 7,
      timeOfDay: '12:00',
    })
  })

  it('ignores half an override rather than mixing it with the site-wide half', () => {
    expect(itemLeadTime(site, { days: 7, timeOfDay: null })).toEqual(site)
    expect(itemLeadTime(site, { days: null, timeOfDay: '12:00' })).toEqual(site)
  })
})

describe('occasionLinks', () => {
  const birthday = { id: 1, name: 'Birthday' }
  const wedding = { id: 2, name: 'Wedding' }

  it('links each tagged Occasion that has a page, in the order the Item lists them', () => {
    const pages = new Map([
      [2, '/wedding-cakes'],
      [1, '/birthday-cakes'],
    ])

    expect(occasionLinks([wedding, birthday], pages)).toEqual([
      { name: 'Wedding', href: '/wedding-cakes' },
      { name: 'Birthday', href: '/birthday-cakes' },
    ])
  })

  it('leaves out an Occasion Jana has not written a page for, rather than linking a 404', () => {
    expect(occasionLinks([birthday, wedding], new Map([[2, '/wedding-cakes']]))).toEqual([
      { name: 'Wedding', href: '/wedding-cakes' },
    ])
  })

  it('skips Occasions that were not populated', () => {
    expect(occasionLinks([1, wedding], new Map([[1, '/birthday-cakes']]))).toEqual([])
  })
})

describe('itemListing', () => {
  it('records slug, title and path in each locale the Item is ready in, and no other', () => {
    expect(itemListing(7, 'cakes', { en: english, nl: { ...dutch, description: null } })).toEqual({
      id: 7,
      catalogue: 'cakes',
      paths: { en: '/cakes/apple-pie' },
      slugs: { en: 'apple-pie' },
      titles: { en: 'Apple pie' },
    })
  })
})

describe('offeredChoices', () => {
  const chocolate = { id: 1, name: 'Chocolate' }
  const vanilla = { id: 2, name: 'Vanilla' }

  it('is the Item’s own list when it names one', () => {
    expect(offeredChoices([vanilla], [chocolate, vanilla])).toEqual([vanilla])
  })

  it('is every one when the Item names none', () => {
    expect(offeredChoices([], [chocolate, vanilla])).toEqual([chocolate, vanilla])
    expect(offeredChoices(null, [chocolate, vanilla])).toEqual([chocolate, vanilla])
  })

  it('ignores entries that were not populated', () => {
    expect(offeredChoices([1, vanilla], [chocolate, vanilla])).toEqual([vanilla])
  })
})
