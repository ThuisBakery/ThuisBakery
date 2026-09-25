import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { Category, Home, Item, Media } from '@/payload-types'

import { HomePage } from './HomePage'

afterEach(cleanup)

const photograph = (id: number): Media => ({
  id,
  alt: 'A cake on the kitchen table',
  url: `https://example.public.blob.vercel-storage.com/photo-${id}.jpg`,
  width: 1600,
  height: 1200,
  updatedAt: '2026-09-23T00:00:00.000Z',
  createdAt: '2026-09-23T00:00:00.000Z',
})

const category = (
  fields: Pick<Category, 'id' | 'name' | 'slug' | 'catalogue' | 'order'> & Partial<Category>,
): Category => ({
  tagline: `${fields.name}, tagline`,
  photograph: photograph(fields.id),
  updatedAt: '2026-09-23T00:00:00.000Z',
  createdAt: '2026-09-23T00:00:00.000Z',
  ...fields,
})

const categories: Category[] = [
  category({ id: 5, name: 'Nibbles', slug: 'nibbles', catalogue: 'nibbles', order: 5 }),
  category({
    id: 2,
    name: 'Cheeky Bento Cakes',
    slug: 'bento',
    catalogue: 'cakes',
    order: 2,
    price: 25,
    priceFrom: true,
  }),
  category({ id: 3, name: 'Indulgent Cakes', slug: 'indulgent', catalogue: 'cakes', order: 3 }),
  category({
    id: 1,
    name: 'Proefhapjes',
    slug: 'proefhapjes',
    catalogue: 'cakes',
    order: 1,
    price: 29,
  }),
]

const item = (
  fields: Pick<Item, 'id' | 'title' | 'slug' | 'category' | 'sizes'> & Partial<Item>,
): Item => ({
  photographs: [{ ...photograph(fields.id), alt: `${fields.title}, photographed` }],
  updatedAt: '2026-09-23T00:00:00.000Z',
  createdAt: '2026-09-23T00:00:00.000Z',
  ...fields,
})

// Filed out of Jana's order and titled out of alphabetical order, to show which one wins.
const items: Item[] = [
  item({
    id: 21,
    title: 'Indulgent Layer Cake',
    slug: 'indulgent-layer-cake',
    category: 3,
    sizes: [
      { label: '15 cm', price: 52, servings: 10 },
      { label: '20 cm', price: 72, servings: 20 },
    ],
  }),
  item({
    id: 20,
    title: 'Proefhapjes Box',
    slug: 'proefhapjes-box',
    category: 1,
    sizes: [{ label: 'Box of six', price: 29 }],
  }),
  item({
    id: 22,
    title: 'Cheeky Bento Cake',
    slug: 'cheeky-bento-cake',
    category: 2,
    sizes: [{ label: 'Bento', price: 25, servings: 2 }],
  }),
]

const home: Home = {
  id: 1,
  hero: {
    headline: 'Baked at home in Uithoorn',
    intro: 'One cake at a time, made to order.',
    photograph: photograph(90),
    cakesLabel: 'See the cakes',
    nibblesLabel: 'or the nibbles',
  },
  facts: {
    pickupTitle: 'Pickup in Uithoorn',
    pickupDetail: 'Address sent once your day is confirmed.',
    priceDetail: 'A bento cake.',
  },
  menu: { heading: 'The menu' },
  about: {
    heading: 'One kitchen, one pair of hands',
    body: 'Jana bakes from home.\n\nThere is no shop and no counter.',
    linkLabel: 'Meet Jana',
    photograph: photograph(91),
  },
  allergens: { heading: 'About allergies', intro: 'Every cake lists what it contains.' },
  quote: {
    text: 'The cake was gone before the coffee was poured.',
    attribution: 'Marieke, Uithoorn',
  },
  faq: {
    heading: 'Before you ask',
    questions: [
      { question: 'Where do I collect it?', answer: 'From Jana’s home in Uithoorn.' },
      { question: 'Is the estimate the price?', answer: 'No.' },
    ],
  },
  closing: {
    heading: 'Tell Jana what the day is for',
    body: 'Nothing is booked until Jana replies.',
  },
}

const renderHome = (locale: 'en' | 'nl' = 'en') =>
  render(
    <HomePage
      locale={locale}
      home={home}
      categories={categories}
      items={items}
      leadTime={{ days: 3, timeOfDay: '17:00' }}
      statement="Jana bakes in a home kitchen, so traces cannot be ruled out."
    />,
  )

describe('HomePage', () => {
  it('runs the eight sections in ADR-0004’s order, under one page heading', () => {
    const { container } = renderHome()

    expect(screen.getAllByRole('heading', { level: 1 }).map((each) => each.textContent)).toEqual([
      'Baked at home in Uithoorn',
    ])
    expect([...container.querySelectorAll('h2')].map((each) => each.textContent)).toEqual([
      'The menu',
      'One kitchen, one pair of hands',
      'About allergies',
      'Before you ask',
      'Tell Jana what the day is for',
    ])
    expect(container.querySelectorAll('section')).toHaveLength(8)
  })

  it('opens on a short hero: the headline, one line, a cake from the menu or something custom', () => {
    renderHome('nl')

    const hero = screen.getByRole('heading', { level: 1 }).closest('section')!
    const links = within(hero)
      .getAllByRole('link')
      .map((link) => [link.textContent, link.getAttribute('href')])

    expect(within(hero).getByText('One cake at a time, made to order.')).toBeTruthy()
    expect(links).toEqual([
      ['See the cakes', '/nl/taarten'],
      ['Iets op maat', '/nl/maatwerk'],
    ])
  })

  it('sends the customer into the cakes first, with the nibbles also linked, in each locale', () => {
    renderHome('nl')

    const [cakes] = screen.getAllByRole('link', { name: 'See the cakes' })
    const [nibbles] = screen.getAllByRole('link', { name: 'or the nibbles' })

    expect(cakes?.getAttribute('href')).toBe('/nl/taarten')
    expect(nibbles?.getAttribute('href')).toBe('/nl/lekkernijen')
  })

  it('lists every cake Item as a tile, in Jana’s Category order, labelled with its Category', () => {
    renderHome()

    const titles = screen.getAllByRole('heading', { level: 3 })

    expect(titles.map((each) => each.textContent)).toEqual([
      'Proefhapjes Box',
      'Cheeky Bento Cake',
      'Indulgent Layer Cake',
    ])
    expect(within(titles[1]!.closest('a')!).getByText('Cheeky Bento Cakes')).toBeTruthy()
  })

  it('makes each tile exactly one link, to its Item page, with the photograph inside it', () => {
    renderHome('nl')

    const tile = screen.getByRole('heading', { name: 'Indulgent Layer Cake' }).closest('li')!
    const [link, ...others] = within(tile).getAllByRole('link')

    expect(others).toEqual([])
    expect(link?.getAttribute('href')).toBe('/nl/taarten/indulgent-layer-cake')
    expect(
      within(link!).getByRole('img', { name: 'Indulgent Layer Cake, photographed' }),
    ).toBeTruthy()
  })

  it('prices a tile from its lowest Size, or at its one price, with servings when every Size has them', () => {
    renderHome()

    const tile = (title: string) => screen.getByRole('heading', { name: title }).closest('a')!

    expect(within(tile('Indulgent Layer Cake')).getByText('from €52')).toBeTruthy()
    expect(within(tile('Indulgent Layer Cake')).getByText('serves 10–20')).toBeTruthy()
    expect(within(tile('Cheeky Bento Cake')).getByText('€25')).toBeTruthy()
    expect(within(tile('Cheeky Bento Cake')).getByText('serves 2')).toBeTruthy()
    expect(within(tile('Proefhapjes Box')).getByText('€29')).toBeTruthy()
    expect(within(tile('Proefhapjes Box')).queryByText(/serves/)).toBeNull()
  })

  it('never sends the customer to a Category: no link into a section of a catalogue page', () => {
    renderHome()

    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href') ?? '')

    expect(hrefs.filter((href) => href.includes('#'))).toEqual([])
  })

  it('states the facts from where they are kept: Lead time, pickup and the lowest price', () => {
    const { container } = renderHome()

    const facts = [...container.querySelectorAll('dt')].map((each) => each.textContent)

    expect(facts).toEqual(['3 days’ notice', 'Pickup in Uithoorn', 'From €25'])
    expect(screen.getByText('Ask before 17:00 and that day counts.')).toBeTruthy()
    expect(screen.getByText('A bento cake.')).toBeTruthy()
  })

  it('leaves out the Lead time fact rather than inventing one when the global is empty', () => {
    const { container } = render(
      <HomePage
        locale="en"
        home={home}
        categories={categories}
        items={items}
        leadTime={{}}
        statement={null}
      />,
    )

    expect([...container.querySelectorAll('dt')].map((each) => each.textContent)).toEqual([
      'Pickup in Uithoorn',
      'From €25',
    ])
  })

  it('carries the site-wide cross-contamination statement in the allergen notice', () => {
    renderHome()

    const notice = screen.getByRole('heading', { name: 'About allergies' }).parentElement

    expect(
      within(notice!).getByText('Jana bakes in a home kitchen, so traces cannot be ruled out.'),
    ).toBeTruthy()
  })

  it('sets each question as a disclosure that opens onto its answer', () => {
    renderHome()

    const question = screen.getByText('Where do I collect it?')
    const disclosure = question.closest('details')

    expect(question.closest('summary')).not.toBeNull()
    expect(within(disclosure!).getByText('From Jana’s home in Uithoorn.')).toBeTruthy()
  })

  it('leaves the wordmark to the header, which sets it once per page', () => {
    renderHome()

    expect(screen.queryAllByText(/ThuisBakery/)).toEqual([])
  })

  it('has no Enquiry and no Estimate: no form, no field, no button', () => {
    const { container } = renderHome()

    expect(container.querySelector('form, input, select, textarea')).toBeNull()
    expect(screen.queryAllByRole('button')).toEqual([])
  })
})
