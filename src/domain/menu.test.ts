import { describe, expect, it } from 'vitest'

import { catalogueSections, categoryPrice, formatEuros, itemPrice, menuSpans } from './menu'

describe('formatEuros', () => {
  it('writes whole euros without decimals, as Jana’s card does', () => {
    expect(formatEuros(29, 'en')).toBe('€29')
    expect(formatEuros(29, 'nl')).toBe('€29')
  })

  it('keeps cents, with each locale’s own decimal mark', () => {
    expect(formatEuros(10.5, 'en')).toBe('€10.50')
    expect(formatEuros(10.5, 'nl')).toBe('€10,50')
  })
})

describe('categoryPrice', () => {
  it('is the plain figure for a tier with one price', () => {
    expect(categoryPrice({ price: 29, priceFrom: false }, 'en')).toBe('€29')
  })

  it('is a starting figure, in the page’s language, when Jana marks it as one', () => {
    expect(categoryPrice({ price: 25, priceFrom: true }, 'en')).toBe('from €25')
    expect(categoryPrice({ price: 25, priceFrom: true }, 'nl')).toBe('vanaf €25')
  })

  it('is absent for a tier the card prices per Item', () => {
    expect(categoryPrice({ price: null, priceFrom: true }, 'en')).toBeNull()
    expect(categoryPrice({}, 'en')).toBeNull()
  })
})

describe('itemPrice', () => {
  it('names the one Size an Item comes in, as the card does for a box of cookies', () => {
    expect(itemPrice([{ label: '6 large cookies', price: 10.5 }], 'nl')).toEqual({
      price: '€10,50',
      size: '6 large cookies',
    })
  })

  it('starts from the cheapest Size when the Sizes differ', () => {
    const sizes = [
      { label: '8 inch', price: 64 },
      { label: '6 inch', price: 52 },
    ]

    expect(itemPrice(sizes, 'en')).toEqual({ price: 'from €52', size: null })
  })

  it('is the plain figure when every Size costs the same', () => {
    const sizes = [
      { label: 'Round', price: 49 },
      { label: 'Square', price: 49 },
    ]

    expect(itemPrice(sizes, 'en')).toEqual({ price: '€49', size: null })
  })

  it('is absent for an Item without a Size', () => {
    expect(itemPrice([], 'en')).toBeNull()
  })
})

describe('menuSpans', () => {
  it('runs 7/5 then 5/7, so no row repeats the one above at equal width', () => {
    expect(menuSpans(4)).toEqual(['wide', 'narrow', 'narrow', 'wide'])
  })

  it('runs an odd last entry full width as a band, so the menu never ends lopsided', () => {
    expect(menuSpans(5)).toEqual(['wide', 'narrow', 'narrow', 'wide', 'band'])
  })

  it('makes a lone Category a band', () => {
    expect(menuSpans(1)).toEqual(['band'])
  })

  it('keeps alternating past the card’s five', () => {
    expect(menuSpans(6)).toEqual(['wide', 'narrow', 'narrow', 'wide', 'wide', 'narrow'])
  })
})

describe('catalogueSections', () => {
  const categories = [
    { id: 3, name: 'Indulgent', catalogue: 'cakes', order: 3 },
    { id: 5, name: 'Nibbles', catalogue: 'nibbles', order: 5 },
    { id: 1, name: 'Proefhapjes', catalogue: 'cakes', order: 1 },
  ]

  it('shows the Categories whose catalogue is this page, lowest order first', () => {
    const names = catalogueSections('cakes', categories, []).map((s) => s.category.name)

    expect(names).toEqual(['Proefhapjes', 'Indulgent'])
  })

  it('follows a Category moved to the other catalogue, with no code change', () => {
    const moved = categories.map((c) => (c.id === 5 ? { ...c, catalogue: 'cakes' } : c))

    expect(catalogueSections('nibbles', moved, [])).toEqual([])
    expect(catalogueSections('cakes', moved, []).map((s) => s.category.name)).toContain('Nibbles')
  })

  it('files each Item under its own Category, whether the relation is populated or not', () => {
    const items = [
      { title: 'Brownies', category: 5 },
      { title: 'Cookies', category: { id: 5 } },
      { title: 'Red Velvet', category: 3 },
    ]

    const [nibbles] = catalogueSections('nibbles', categories, items)

    expect(nibbles?.items.map((item) => item.title)).toEqual(['Brownies', 'Cookies'])
  })
})
