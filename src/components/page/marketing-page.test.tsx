import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { linkTargetKey } from '@/domain/page'
import type { Item, Media, Page } from '@/payload-types'

import { MarketingPage } from './MarketingPage'

afterEach(cleanup)

const stamps = { updatedAt: '2026-09-23T00:00:00.000Z', createdAt: '2026-09-23T00:00:00.000Z' }

type RichText = NonNullable<NonNullable<Page['hero']['richText']>>

const text = (value: string) => ({
  type: 'text',
  text: value,
  format: 0,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

const root = (...children: Record<string, unknown>[]): RichText => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: children.map((child) => ({ version: 1, ...child, type: child['type'] })),
  },
})

const paragraph = (...children: Record<string, unknown>[]) => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  textFormat: 0,
  children,
})

const heading = (tag: string, value: string) => ({
  type: 'heading',
  tag,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children: [text(value)],
})

const internalLink = (relationTo: string, id: number, label: string) => ({
  type: 'link',
  format: '',
  indent: 0,
  version: 3,
  direction: 'ltr',
  fields: { linkType: 'internal', newTab: false, doc: { relationTo, value: { id } } },
  children: [text(label)],
})

const photograph: Media = {
  id: 90,
  alt: 'A Christmas cake on a stand',
  url: 'https://example.public.blob.vercel-storage.com/90.jpg',
  width: 1600,
  height: 1200,
  ...stamps,
}

const item = (id: number, title: string, slug: string): Item => ({
  id,
  title,
  slug,
  category: 4,
  sizes: [{ label: 'One size', price: 30 }],
  ...stamps,
})

const christmas = (fields: Partial<Page> = {}): Page => ({
  id: 3,
  title: 'Christmas',
  slug: 'christmas',
  hero: { type: 'none' },
  layout: [],
  ...stamps,
  ...fields,
})

const targets = new Map([
  [linkTargetKey('items', 10), '/cakes/stollen-cake'],
  [linkTargetKey('pages', 5), '/weddings'],
])

describe('MarketingPage', () => {
  it('heads the page with its title when the hero has no words of its own', () => {
    render(<MarketingPage locale="en" page={christmas()} targets={targets} occasionItems={[]} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Christmas' })).toBeDefined()
  })

  it('lets the hero’s own heading be the page’s heading', () => {
    render(
      <MarketingPage
        locale="en"
        page={christmas({
          hero: {
            type: 'mediumImpact',
            richText: root(heading('h1', 'Baked for Christmas'), paragraph(text('Order early.'))),
            media: photograph,
          },
        })}
        targets={targets}
        occasionItems={[]}
      />,
    )

    expect(screen.getAllByRole('heading', { level: 1 }).map((each) => each.textContent)).toEqual([
      'Baked for Christmas',
    ])
    expect(screen.getByText('Order early.')).toBeDefined()
    expect(screen.getByRole('img', { name: 'A Christmas cake on a stand' })).toBeDefined()
  })

  it('renders the blocks in Jana’s order', () => {
    render(
      <MarketingPage
        locale="en"
        page={christmas({
          layout: [
            {
              blockType: 'content',
              columns: [
                { size: 'half', richText: root(heading('h2', 'Stollen')) },
                { size: 'half', richText: root(heading('h2', 'Kerstkransjes')) },
              ],
            },
            { blockType: 'mediaBlock', media: photograph },
            { blockType: 'cta', richText: root(heading('h2', 'Order by 15 December')) },
          ],
        })}
        targets={targets}
        occasionItems={[]}
      />,
    )

    expect(screen.getAllByRole('heading', { level: 2 }).map((each) => each.textContent)).toEqual([
      'Stollen',
      'Kerstkransjes',
      'Order by 15 December',
    ])
    expect(screen.getByRole('img', { name: 'A Christmas cake on a stand' })).toBeDefined()
  })

  it('leads a block’s links to their pages and Items in this locale', () => {
    render(
      <MarketingPage
        locale="en"
        page={christmas({
          layout: [
            {
              blockType: 'cta',
              links: [
                {
                  link: {
                    type: 'reference',
                    reference: { relationTo: 'items', value: 10 },
                    label: 'See the stollen',
                  },
                },
                { link: { type: 'custom', url: '/cakes', label: 'All cakes' } },
              ],
            },
            {
              blockType: 'content',
              columns: [
                {
                  richText: root(paragraph(text('Or '), internalLink('pages', 5, 'a wedding'))),
                },
              ],
            },
          ],
        })}
        targets={targets}
        occasionItems={[]}
      />,
    )

    expect(screen.getByRole('link', { name: 'See the stollen' }).getAttribute('href')).toBe(
      '/cakes/stollen-cake',
    )
    expect(screen.getByRole('link', { name: 'All cakes' }).getAttribute('href')).toBe('/cakes')
    expect(screen.getByRole('link', { name: 'a wedding' }).getAttribute('href')).toBe('/weddings')
  })

  it('never links to a page or Item with no URL in this locale, keeping the words', () => {
    render(
      <MarketingPage
        locale="nl"
        page={christmas({
          layout: [
            {
              blockType: 'cta',
              links: [
                {
                  link: {
                    type: 'reference',
                    reference: { relationTo: 'pages', value: 99 },
                    label: 'Bruiloften',
                  },
                },
              ],
            },
            {
              blockType: 'content',
              columns: [{ richText: root(paragraph(internalLink('items', 98, 'de stol'))) }],
            },
          ],
        })}
        targets={targets}
        occasionItems={[]}
      />,
    )

    expect(screen.queryByRole('link', { name: 'Bruiloften' })).toBeNull()
    expect(screen.getByText('Bruiloften')).toBeDefined()
    expect(screen.queryByRole('link', { name: 'de stol' })).toBeNull()
    expect(screen.getByText('de stol')).toBeDefined()
  })

  it('links an Occasion page to every Item tagged with its Occasion', () => {
    render(
      <MarketingPage
        locale="en"
        page={christmas({ occasion: { id: 20, name: 'Christmas', ...stamps } })}
        targets={targets}
        occasionItems={[item(10, 'Stollen cake', 'stollen-cake')]}
      />,
    )

    const list = screen.getByRole('navigation', { name: 'From the menu' })

    expect(
      within(list)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([['Stollen cake', '/cakes/stollen-cake']])
  })

  it('shows no Item list on a page with no tagged Items', () => {
    render(<MarketingPage locale="en" page={christmas()} targets={targets} occasionItems={[]} />)

    expect(screen.queryByRole('navigation', { name: 'From the menu' })).toBeNull()
  })
})

describe('MarketingPage with no hero', () => {
  it('still heads the page with its title when the unused hero text holds a heading', () => {
    render(
      <MarketingPage
        locale="en"
        page={christmas({ hero: { type: 'none', richText: root(heading('h1', 'Old words')) } })}
        targets={targets}
        occasionItems={[]}
      />,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Christmas' })).toBeDefined()
  })
})
