import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { Category, Item, Media } from '@/payload-types'

import { CataloguePage } from './CataloguePage'

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

const item = (
  fields: Pick<Item, 'id' | 'title' | 'slug' | 'category' | 'sizes'> & Partial<Item>,
): Item => ({
  photographs: [{ ...photograph(fields.id), alt: `${fields.title}, photographed` }],
  updatedAt: '2026-09-22T00:00:00.000Z',
  createdAt: '2026-09-22T00:00:00.000Z',
  ...fields,
})

const items: Item[] = [
  item({
    id: 12,
    title: 'Cheeky Bento Cake',
    slug: 'cheeky-bento-cake',
    category: 2,
    sizes: [{ label: 'Bento', price: 25, servings: 2 }],
  }),
  item({
    id: 13,
    title: 'Carrot Cake',
    slug: 'carrot-cake',
    category: 4,
    sizes: [
      { label: '15 cm', price: 45, servings: 8 },
      { label: '20 cm', price: 60, servings: 14 },
    ],
  }),
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

  it('sets each Category as a heading, not a link, with the card’s tagline and her note', () => {
    render(<CataloguePage locale="en" catalogue="cakes" categories={categories} items={items} />)

    const heading = screen.getByRole('heading', { level: 2, name: 'Cheeky Bento Cakes' })
    const section = heading.closest('section')!

    expect(heading.closest('a')).toBeNull()
    expect(within(heading).queryAllByRole('link')).toEqual([])
    expect(within(section).getByText('Mini Cakes for Big Moments')).toBeTruthy()
    expect(within(section).getByText('personalisation available on request')).toBeTruthy()
  })

  it('lists each Category’s Items as tiles under its heading, each exactly one link to its page', () => {
    render(<CataloguePage locale="nl" catalogue="cakes" categories={categories} items={items} />)

    const specialty = screen.getByRole('heading', { level: 2, name: 'Specialty Cakes' })
    const section = specialty.closest('section')!
    const titles = within(section).getAllByRole('heading', { level: 3 })

    // In the order fetched: the page files Items, it does not sort them.
    expect(titles.map((each) => each.textContent)).toEqual([
      'Carrot Cake',
      'Burnt Basque Cheesecake',
    ])

    const tile = titles[0]!.closest('li')!
    const [link, ...others] = within(tile).getAllByRole('link')

    expect(others).toEqual([])
    expect(link?.getAttribute('href')).toBe('/nl/taarten/carrot-cake')
    expect(within(link!).getByRole('img', { name: 'Carrot Cake, photographed' })).toBeTruthy()
    expect(within(link!).getByText('Specialty Cakes')).toBeTruthy()
    expect(within(link!).getByText('vanaf €45')).toBeTruthy()
    expect(within(link!).getByText('voor 8–14 personen')).toBeTruthy()
  })

  it('prices a one-Size Item at its one price, and leaves servings out when a Size lacks them', () => {
    render(<CataloguePage locale="en" catalogue="cakes" categories={categories} items={items} />)

    const link = screen.getByRole('link', { name: /Burnt Basque Cheesecake/ })

    expect(link.getAttribute('href')).toBe('/cakes/burnt-basque-cheesecake')
    expect(within(link).getByText('€56')).toBeTruthy()
    expect(within(link).queryByText(/serves/)).toBeNull()
  })

  it('is links, not buttons — no buy button, no cart', () => {
    render(<CataloguePage locale="en" catalogue="nibbles" categories={categories} items={items} />)

    expect(screen.queryAllByRole('button')).toEqual([])
    expect(screen.getByRole('link', { name: /Brownies/ }).textContent).toContain('6 large brownies')
  })

  it('leaves out the index when there is only one Category to jump to', () => {
    render(<CataloguePage locale="en" catalogue="nibbles" categories={categories} items={items} />)

    expect(screen.queryByRole('navigation', { name: 'Jump to' })).toBeNull()
  })
})
