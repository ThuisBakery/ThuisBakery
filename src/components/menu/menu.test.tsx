import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { Category, Item, Media } from '@/payload-types'

import { CataloguePage } from './CataloguePage'
import { IllustratedMenu } from './IllustratedMenu'

afterEach(cleanup)

const photograph = (id: number): Media => ({
  id,
  alt: 'A cake on the kitchen table',
  url: `https://example.public.blob.vercel-storage.com/cake-${id}.jpg`,
  width: 1600,
  height: 1200,
  focalX: 50,
  focalY: 40,
  updatedAt: '2026-09-22T00:00:00.000Z',
  createdAt: '2026-09-22T00:00:00.000Z',
})

const category = (
  fields: Pick<Category, 'id' | 'name' | 'slug' | 'catalogue' | 'order'> & Partial<Category>,
): Category => ({
  tagline: `${fields.name}, tagline`,
  photograph: photograph(fields.id),
  updatedAt: '2026-09-22T00:00:00.000Z',
  createdAt: '2026-09-22T00:00:00.000Z',
  ...fields,
})

const categories: Category[] = [
  category({
    id: 2,
    name: 'Cheeky Bento Cakes',
    slug: 'bento',
    catalogue: 'cakes',
    order: 2,
    tagline: 'Mini Cakes for Big Moments',
    note: 'personalisation available on request',
    price: 25,
    priceFrom: true,
  }),
  category({
    id: 1,
    name: 'Proefhapjes',
    slug: 'proefhapjes',
    catalogue: 'cakes',
    order: 1,
    price: 29,
  }),
  category({ id: 4, name: 'Specialty Cakes', slug: 'specialty', catalogue: 'cakes', order: 4 }),
  category({ id: 5, name: 'Nibbles', slug: 'nibbles', catalogue: 'nibbles', order: 5 }),
]

const item = (fields: Pick<Item, 'id' | 'title' | 'slug' | 'category' | 'sizes'>): Item => ({
  updatedAt: '2026-09-22T00:00:00.000Z',
  createdAt: '2026-09-22T00:00:00.000Z',
  ...fields,
})

const items: Item[] = [
  item({
    id: 10,
    title: 'Burnt Basque Cheesecake',
    slug: 'burnt-basque-cheesecake',
    category: 4,
    sizes: [{ label: 'Whole', price: 56 }],
  }),
  item({
    id: 11,
    title: 'Brownies',
    slug: 'brownies',
    category: 5,
    sizes: [{ label: '6 large brownies', price: 12 }],
  }),
]

describe('CataloguePage', () => {
  it('shows only the Categories whose catalogue is this page, in Jana’s order', () => {
    render(<CataloguePage locale="en" catalogue="cakes" categories={categories} items={items} />)

    const names = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)

    expect(names).toEqual(['Proefhapjes', 'Cheeky Bento Cakes', 'Specialty Cakes'])
  })

  it('makes each Category an anchored section that the page’s own index links to', () => {
    const { container } = render(
      <CataloguePage locale="en" catalogue="cakes" categories={categories} items={items} />,
    )

    const index = screen.getByRole('navigation', { name: 'Jump to' })
    const hrefs = within(index)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))

    expect(hrefs).toEqual(['#proefhapjes', '#bento', '#specialty'])
    hrefs.forEach((href) => {
      expect(container.querySelector(href ?? '')).not.toBeNull()
    })
  })

  it('carries the card’s lines: tagline, the italic note where she wrote one, and the price', () => {
    render(<CataloguePage locale="nl" catalogue="cakes" categories={categories} items={items} />)

    const bento = screen.getByRole('heading', { name: 'Cheeky Bento Cakes' }).closest('li')

    expect(bento).not.toBeNull()
    expect(within(bento!).getByText('Mini Cakes for Big Moments')).toBeTruthy()
    expect(within(bento!).getByText('personalisation available on request')).toBeTruthy()
    expect(within(bento!).getByText('vanaf €25')).toBeTruthy()
  })

  it('lists a Category’s Items as links to their pages, in the page’s locale', () => {
    render(<CataloguePage locale="nl" catalogue="cakes" categories={categories} items={items} />)

    const link = screen.getByRole('link', { name: /Burnt Basque Cheesecake/ })

    expect(link.getAttribute('href')).toBe('/nl/taarten/burnt-basque-cheesecake')
    expect(link.textContent).toContain('€56')
  })

  it('has no buttons anywhere — no buy button, no cart', () => {
    render(<CataloguePage locale="en" catalogue="nibbles" categories={categories} items={items} />)

    expect(screen.queryAllByRole('button')).toEqual([])
    expect(screen.getByRole('link', { name: /Brownies/ }).textContent).toContain('6 large brownies')
  })

  it('leaves out the index when there is only one Category to jump to', () => {
    render(<CataloguePage locale="en" catalogue="nibbles" categories={categories} items={items} />)

    expect(screen.queryByRole('navigation', { name: 'Jump to' })).toBeNull()
  })
})

describe('IllustratedMenu', () => {
  it('makes the whole entry one link when it is given somewhere to go, as the homepage does', () => {
    const cakes = categories.filter((each) => each.catalogue === 'cakes')

    render(
      <IllustratedMenu
        locale="en"
        sections={cakes.map((each) => ({ category: each, items: [] }))}
        categoryHref={(each) => `/cakes#${each.slug}`}
      />,
    )

    const link = screen.getByRole('link', { name: /Cheeky Bento Cakes/ })

    expect(link.getAttribute('href')).toBe('/cakes#bento')
    expect(within(link).getByRole('img')).toBeTruthy()
    expect(within(link).getByText('from €25')).toBeTruthy()
  })
})
