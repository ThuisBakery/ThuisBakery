import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { Allergen, Category, Filling, Item, LeadTime, Media, Sponge } from '@/payload-types'

import { ItemPage } from './ItemPage'

afterEach(cleanup)

const stamps = { updatedAt: '2026-09-23T00:00:00.000Z', createdAt: '2026-09-23T00:00:00.000Z' }

const media = (id: number, alt: string): Media => ({
  id,
  alt,
  url: `https://example.public.blob.vercel-storage.com/${id}.jpg`,
  width: 1600,
  height: 1200,
  ...stamps,
})

const description = (text: string): NonNullable<Item['description']> => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        children: [
          { type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 },
        ],
      },
    ],
  },
})

const specialty: Category = {
  id: 4,
  name: 'Specialty Cakes',
  slug: 'specialty',
  tagline: 'For the big day',
  photograph: media(90, 'A tall cake'),
  catalogue: 'cakes',
  order: 4,
  ...stamps,
}

const sponge = (id: number, name: string): Sponge => ({ id, name, ...stamps })
const filling = (id: number, name: string, surcharge?: number): Filling => ({
  id,
  name,
  surcharge: surcharge ?? null,
  ...stamps,
})

const sponges = [sponge(1, 'Chocolate'), sponge(2, 'Vanilla'), sponge(3, 'Red Velvet')]
const fillings = [
  filling(1, 'Cream Cheese'),
  filling(2, 'Salted Caramel', 2.5),
  filling(3, 'Ganache', 3),
]

const egg: Allergen = { id: 1, name: 'Egg', icon: media(80, ''), ...stamps }
const milk: Allergen = { id: 2, name: 'Milk', icon: media(81, ''), ...stamps }

const cheesecake: Item = {
  id: 10,
  title: 'Burnt Basque Cheesecake',
  slug: 'burnt-basque-cheesecake',
  category: specialty,
  occasions: [
    { id: 1, name: 'Birthday', ...stamps },
    { id: 2, name: 'Wedding', ...stamps },
  ],
  photographs: [media(1, 'The cheesecake, cut'), media(2, 'The cheesecake, whole')],
  description: description('Caramelised outside, barely set inside.'),
  configurable: true,
  sponges: [sponges[0]!, sponges[2]!],
  fillings: [],
  sizes: [
    { label: 'Small', diameter: 15, layers: 1, servings: 8, price: 45 },
    { label: 'Large', diameter: 20, layers: 2, servings: 14, price: 62.5 },
  ],
  allergens: [egg, milk],
  leadTime: { days: 5, timeOfDay: '12:00' },
  ...stamps,
}

const sibling = (id: number, title: string, slug: string, category = 4): Item => ({
  id,
  title,
  slug,
  category,
  sizes: [{ label: 'Whole', price: 40 }],
  ...stamps,
})

const items: Item[] = [
  cheesecake,
  sibling(11, 'Carrot Cake', 'carrot-cake'),
  sibling(12, 'Lemon Drizzle', 'lemon-drizzle'),
  sibling(13, 'Bento Heart', 'bento-heart', 2),
  sibling(14, 'Apple Pie', 'apple-pie'),
]

const siteLeadTime: LeadTime = { id: 1, days: 3, timeOfDay: '17:00' }

const statement = 'Baked in a home kitchen that also handles nuts, gluten and sesame.'

const renderPage = (overrides: Partial<Parameters<typeof ItemPage>[0]> = {}) =>
  render(
    <ItemPage
      locale="en"
      catalogue="cakes"
      item={cheesecake}
      items={items}
      sponges={sponges}
      fillings={fillings}
      leadTime={siteLeadTime}
      closedUntil={{}}
      statement={statement}
      occasionPages={new Map([[2, '/wedding-cakes']])}
      origin="https://thuisbakery.nl"
      {...overrides}
    />,
  )

/** Every JSON-LD block on the page, parsed. */
const structuredData = (container: HTMLElement): Record<string, unknown>[] =>
  [...container.querySelectorAll('script[type="application/ld+json"]')].map(
    (script) => JSON.parse(script.textContent ?? '') as Record<string, unknown>,
  )

describe('ItemPage', () => {
  it('heads the page with the Item’s title and shows its description and photographs', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Burnt Basque Cheesecake')
    expect(screen.getByText('Caramelised outside, barely set inside.')).toBeTruthy()
    expect(screen.getByAltText('The cheesecake, cut')).toBeTruthy()
    expect(screen.getByAltText('The cheesecake, whole')).toBeTruthy()
  })

  it('prints every Size with what it is and its price', () => {
    renderPage()

    const sizes = screen.getByRole('list', { name: 'Sizes' })
    const rows = within(sizes)
      .getAllByRole('listitem')
      .map((row) => row.textContent)

    expect(rows).toEqual([
      'Small15 cm · 1 layer · serves 8€45',
      'Large20 cm · 2 layers · serves 14€62.50',
    ])
  })

  it('offers the Item’s own Sponges, and every Filling when it names none, with Surcharges', () => {
    renderPage()

    const spongeList = screen.getByRole('list', { name: 'Sponge' })
    expect(
      within(spongeList)
        .getAllByRole('listitem')
        .map((row) => row.textContent),
    ).toEqual(['Chocolate', 'Red Velvet'])

    const fillingList = screen.getByRole('list', { name: 'Filling' })
    expect(
      within(fillingList)
        .getAllByRole('listitem')
        .map((row) => row.textContent),
    ).toEqual(['Cream Cheese', 'Salted Caramel+€2.50', 'Ganache+€3'])
  })

  it('offers no choices on an Item sold exactly as described', () => {
    renderPage({ item: { ...cheesecake, configurable: false } })

    expect(screen.queryByRole('list', { name: 'Sponge' })).toBeNull()
    expect(screen.queryByRole('list', { name: 'Filling' })).toBeNull()
  })

  it('lists the Allergens with their icons, beside the cross-contamination statement', () => {
    const { container } = renderPage()

    const allergens = screen.getByRole('list', { name: 'Allergens' })
    expect(
      within(allergens)
        .getAllByRole('listitem')
        .map((row) => row.textContent),
    ).toEqual(['Egg', 'Milk'])
    expect(allergens.querySelectorAll('img')).toHaveLength(2)
    expect(container.textContent).toContain(statement)
  })

  it('states the Item’s own Lead time, days and time of day, over the site-wide one', () => {
    const { container } = renderPage()

    expect(container.textContent).toContain('5 days’ notice')
    expect(container.textContent).toContain('Ask before 12:00 and that day counts.')
  })

  it('falls back to the site-wide Lead time', () => {
    const { container } = renderPage({ item: { ...cheesecake, leadTime: {} } })

    expect(container.textContent).toContain('3 days’ notice')
    expect(container.textContent).toContain('Ask before 17:00')
  })

  it('links back to its Category’s section and on to Custom order', () => {
    renderPage({ locale: 'nl' })

    expect(
      screen
        .getAllByRole('link')
        .some((link) => link.getAttribute('href') === '/nl/taarten#specialty'),
    ).toBe(true)
    expect(screen.getByRole('link', { name: 'Maatwerk' }).getAttribute('href')).toBe('/nl/maatwerk')
  })

  it('links two or three sibling Items from its own catalogue', () => {
    renderPage()

    const siblings = screen.getByRole('navigation', { name: 'More from the menu' })
    expect(
      within(siblings)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/cakes/carrot-cake', '/cakes/lemon-drizzle', '/cakes/apple-pie'])
  })

  it('links back to the Occasion pages it is tagged with, and only those that exist', () => {
    renderPage()

    expect(screen.getByRole('link', { name: 'Wedding' }).getAttribute('href')).toBe(
      '/wedding-cakes',
    )
    expect(screen.queryByRole('link', { name: 'Birthday' })).toBeNull()
  })

  it('shows the breadcrumb trail it marks up', () => {
    const { container } = renderPage()

    const trail = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(
      within(trail)
        .getAllByRole('listitem')
        .map((crumb) => crumb.textContent),
    ).toEqual(['Home', 'Cakes', 'Burnt Basque Cheesecake'])

    const breadcrumbs = structuredData(container).find((each) => each['@type'] === 'BreadcrumbList')
    expect(breadcrumbs?.['itemListElement']).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://thuisbakery.nl/' },
      { '@type': 'ListItem', position: 2, name: 'Cakes', item: 'https://thuisbakery.nl/cakes' },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Burnt Basque Cheesecake',
        item: 'https://thuisbakery.nl/cakes/burnt-basque-cheesecake',
      },
    ])
  })

  it('ends at an Enquiry for this Item, scoped to its own Sizes and choices', () => {
    renderPage()

    const enquiry = screen.getByRole('region', { name: 'Send an enquiry' })

    expect(
      within(within(enquiry).getByRole('group', { name: 'Size' }))
        .getAllByRole('radio')
        .map((radio) => radio.getAttribute('value')),
      // The fixture's Sizes carry no row ids, so they are keyed by position.
    ).toEqual(['0', '1'])
    expect(
      within(within(enquiry).getByRole('group', { name: 'Sponge' }))
        .getAllByRole('radio')
        .map((radio) => radio.getAttribute('value')),
    ).toEqual(['1', '3'])
    expect(screen.getByRole('link', { name: 'Send an enquiry' }).getAttribute('href')).toBe(
      '#enquire',
    )
  })

  it('holds the Enquiry to Closed until, with Jana’s notice', () => {
    renderPage({
      closedUntil: { date: '2099-01-04T12:00:00.000Z', notice: 'Away for the winter.' },
    })

    const enquiry = screen.getByRole('region', { name: 'Send an enquiry' })

    expect(within(enquiry).getByText('Away for the winter.')).toBeTruthy()
    expect(within(enquiry).getByText(/Jana is closed until/)).toBeTruthy()
  })

  it('marks up a Product whose offers are the prices printed on the page', () => {
    const { container } = renderPage()

    const product = structuredData(container).find((each) => each['@type'] === 'Product')

    expect(product).toMatchObject({
      name: 'Burnt Basque Cheesecake',
      description: 'Caramelised outside, barely set inside.',
      offers: [
        { name: 'Small', price: 45, priceCurrency: 'EUR' },
        { name: 'Large', price: 62.5, priceCurrency: 'EUR' },
      ],
    })
    expect(product).not.toHaveProperty('aggregateRating')
    expect(product).not.toHaveProperty('review')
  })
})
