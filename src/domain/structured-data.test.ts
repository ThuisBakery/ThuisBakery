import { describe, expect, it } from 'vitest'

import {
  bakeryMarkup,
  type BakeryInput,
  breadcrumbMarkup,
  organizationMarkup,
  productMarkup,
  websiteMarkup,
} from './structured-data'

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

describe('productMarkup', () => {
  it('marks up the Item with one euro Offer per Size, named as the page names it', () => {
    expect(productMarkup(applePie, origin)).toEqual({
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
    const markup = JSON.stringify(productMarkup(applePie, origin))

    expect(markup).not.toMatch(/aggregateRating|review/i)
  })

  it('leaves out an image list the page has no photographs for', () => {
    expect(productMarkup({ ...applePie, images: [] }, origin)).not.toHaveProperty('image')
  })
})

describe('breadcrumbMarkup', () => {
  it('lists the trail in order, fully qualified, positions from one', () => {
    expect(
      breadcrumbMarkup(
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

const bakery: BakeryInput = {
  path: '/contact',
  email: 'hallo@thuisbakery.com',
  telephone: '+31 6 12345678',
  images: ['https://blob.example.com/kitchen.jpg'],
  openingHours: [
    { days: ['Friday', 'Saturday'], opens: '10:00', closes: '16:00' },
    { days: ['Sunday'], opens: '11:00', closes: '13:00' },
  ],
  priceRange: '€3 – €110',
  areaServed: 'Uithoorn',
  sameAs: ['https://www.instagram.com/thuisbakery'],
}

describe('bakeryMarkup', () => {
  it('marks up the bakery with the values the Contact page prints', () => {
    expect(bakeryMarkup(bakery, origin)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Bakery',
      name: 'ThuisBakery',
      url: 'https://thuisbakery.nl/contact',
      email: 'hallo@thuisbakery.com',
      telephone: '+31 6 12345678',
      image: ['https://blob.example.com/kitchen.jpg'],
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Friday', 'Saturday'],
          opens: '10:00',
          closes: '16:00',
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Sunday'],
          opens: '11:00',
          closes: '13:00',
        },
      ],
      priceRange: '€3 – €110',
      areaServed: { '@type': 'City', name: 'Uithoorn' },
      sameAs: ['https://www.instagram.com/thuisbakery'],
    })
  })

  it('never carries an address, a rating or a review (ADR-0002)', () => {
    expect(JSON.stringify(bakeryMarkup(bakery, origin))).not.toMatch(
      /address|aggregateRating|review/i,
    )
  })

  it('leaves out every value the page has nothing to print for', () => {
    expect(
      bakeryMarkup(
        {
          path: '/nl/contact',
          email: null,
          telephone: null,
          images: [],
          openingHours: [],
          priceRange: null,
          areaServed: 'Uithoorn',
          sameAs: [],
        },
        origin,
      ),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Bakery',
      name: 'ThuisBakery',
      url: 'https://thuisbakery.nl/nl/contact',
      areaServed: { '@type': 'City', name: 'Uithoorn' },
    })
  })
})

describe('organizationMarkup', () => {
  it('names the business at the site root', () => {
    expect(organizationMarkup(origin)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'ThuisBakery',
      url: 'https://thuisbakery.nl/',
    })
  })
})

describe('websiteMarkup', () => {
  it('names the site at its home in the page’s language', () => {
    expect(websiteMarkup('nl', origin)).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'ThuisBakery',
      url: 'https://thuisbakery.nl/nl',
      inLanguage: 'nl',
    })
    expect(websiteMarkup('en', origin)).toMatchObject({
      url: 'https://thuisbakery.nl/',
      inLanguage: 'en',
    })
  })
})
