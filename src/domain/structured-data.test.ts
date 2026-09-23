import { describe, expect, it } from 'vitest'

import { breadcrumbList, product } from './structured-data'

const origin = 'https://thuisbakery.nl'

const applePie = {
  name: 'Apple pie',
  description: 'Apples, cinnamon, a lattice top.',
  path: '/cakes/apple-pie',
  images: ['/api/media/file/apple-pie.jpg', 'https://blob.example.com/apple-pie-2.jpg'],
  sizes: [
    { label: 'Small', price: 29 },
    { label: 'Large', price: 42.5 },
  ],
}

describe('product', () => {
  it('marks up the Item with one euro Offer per Size, named as the page names it', () => {
    expect(product(applePie, origin)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Apple pie',
      description: 'Apples, cinnamon, a lattice top.',
      url: 'https://thuisbakery.nl/cakes/apple-pie',
      image: [
        'https://thuisbakery.nl/api/media/file/apple-pie.jpg',
        'https://blob.example.com/apple-pie-2.jpg',
      ],
      offers: [
        {
          '@type': 'Offer',
          name: 'Small',
          price: 29,
          priceCurrency: 'EUR',
          url: 'https://thuisbakery.nl/cakes/apple-pie',
        },
        {
          '@type': 'Offer',
          name: 'Large',
          price: 42.5,
          priceCurrency: 'EUR',
          url: 'https://thuisbakery.nl/cakes/apple-pie',
        },
      ],
    })
  })

  it('never carries a rating or a review (ADR-0002)', () => {
    const markup = JSON.stringify(product(applePie, origin))

    expect(markup).not.toMatch(/aggregateRating|review/i)
  })

  it('leaves out an image list the page has no photographs for', () => {
    expect(product({ ...applePie, images: [] }, origin)).not.toHaveProperty('image')
  })
})

describe('breadcrumbList', () => {
  it('lists the trail in order, fully qualified, positions from one', () => {
    expect(
      breadcrumbList(
        [
          { name: 'Home', path: '/nl' },
          { name: 'Taarten', path: '/nl/taarten' },
          { name: 'Appeltaart', path: '/nl/taarten/appeltaart' },
        ],
        origin,
      ),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://thuisbakery.nl/nl' },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Taarten',
          item: 'https://thuisbakery.nl/nl/taarten',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Appeltaart',
          item: 'https://thuisbakery.nl/nl/taarten/appeltaart',
        },
      ],
    })
  })
})
