import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { Contact, CustomOrder, Media } from '@/payload-types'

import { ContactPage } from './ContactPage'
import { CustomOrderPage } from './CustomOrderPage'

afterEach(cleanup)

const stamps = { updatedAt: '2026-09-23T00:00:00.000Z', createdAt: '2026-09-23T00:00:00.000Z' }

const photograph = (id: number, alt: string): Media => ({
  id,
  alt,
  url: `https://example.public.blob.vercel-storage.com/${id}.jpg`,
  width: 1600,
  height: 1200,
  ...stamps,
})

const contact: Contact = {
  id: 1,
  heading: 'Get in touch',
  intro: 'Jana answers every message herself.',
  details: {
    email: 'hallo@thuisbakery.com',
    telephone: '+31 6 1234 5678',
    instagram: 'thuisbakery',
    photograph: photograph(7, 'Jana’s kitchen table'),
  },
  hours: {
    note: 'Outside these hours by arrangement.',
    rows: [
      { days: ['Wednesday', 'Thursday', 'Friday'], opens: '10:00', closes: '17:00' },
      { days: ['Saturday'], opens: '09:00', closes: '13:00' },
    ],
  },
  collection: {
    heading: 'Collecting your cake',
    policy: 'Bring a flat surface for the car.\n\nCakes are boxed.',
  },
  faq: {
    heading: 'Questions people ask',
    questions: [{ question: 'Do you deliver?', answer: 'No, pickup only.' }],
  },
  formHeading: 'Ask a question',
  ...stamps,
}

const renderContact = (overrides: Partial<Parameters<typeof ContactPage>[0]> = {}) =>
  render(
    <ContactPage
      locale="en"
      contact={contact}
      prices={[29, 3.5, 110]}
      origin="https://thuisbakery.nl"
      {...overrides}
    />,
  )

/** The page's JSON-LD, parsed. */
const markup = () =>
  [...document.querySelectorAll('script[type="application/ld+json"]')].map(
    (script) => JSON.parse(script.textContent ?? '') as Record<string, unknown>,
  )

const bakery = () => markup().find((each) => each['@type'] === 'Bakery')

/** Every string in a value, however deep, but a schema.org `@type`. */
const strings = (value: unknown): string[] =>
  typeof value === 'string'
    ? [value]
    : Array.isArray(value)
      ? value.flatMap(strings)
      : typeof value === 'object' && value !== null
        ? Object.entries(value).flatMap(([key, each]) => (key.startsWith('@') ? [] : strings(each)))
        : []

/** The page's text, without its JSON-LD. */
const visibleText = () => {
  const copy = document.body.cloneNode(true) as HTMLElement

  copy.querySelectorAll('script').forEach((script) => script.remove())

  return copy.textContent ?? ''
}

describe('ContactPage', () => {
  it('prints how to reach Jana, each as a link', () => {
    renderContact()

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Get in touch')
    expect(screen.getByRole('link', { name: 'hallo@thuisbakery.com' }).getAttribute('href')).toBe(
      'mailto:hallo@thuisbakery.com',
    )
    expect(screen.getByRole('link', { name: '+31 6 1234 5678' }).getAttribute('href')).toBe(
      'tel:+31612345678',
    )
    expect(screen.getByRole('link', { name: '@thuisbakery' }).getAttribute('href')).toBe(
      'https://www.instagram.com/thuisbakery/',
    )
  })

  it('prints the opening hours, the price range and where pickup is', () => {
    renderContact()

    expect(screen.getByText('Wednesday – Friday')).toBeTruthy()
    expect(screen.getByText('10:00 – 17:00')).toBeTruthy()
    expect(screen.getByText('Saturday')).toBeTruthy()
    expect(screen.getByText('Outside these hours by arrangement.')).toBeTruthy()
    expect(screen.getByText('€3.50 – €110')).toBeTruthy()
    expect(screen.getByText(/In Uithoorn, by arrangement/)).toBeTruthy()
    expect(screen.getByText(/exact address is sent when your order is confirmed/)).toBeTruthy()
  })

  it('carries Bakery markup whose every value is printed on the page (ADR-0002)', () => {
    renderContact()

    const data = bakery()
    // The URL is the page itself, the name is the header's wordmark on every page, the image
    // is checked below, and the days are printed as a range — `Wednesday – Friday` — which the
    // hours test checks.
    const {
      '@context': _,
      '@type': __,
      url: ___,
      name: _____,
      image: ____,
      openingHoursSpecification: hours,
      ...marked
    } = data ?? {}
    const text = visibleText()

    expect(
      (hours as { opens: string; closes: string }[]).map(({ opens, closes }) => [opens, closes]),
    ).toEqual([
      ['10:00', '17:00'],
      ['09:00', '13:00'],
    ])

    expect(data).toBeTruthy()
    expect(data?.['url']).toBe('https://thuisbakery.nl/contact')

    for (const value of strings(marked)) {
      const printed = value.startsWith('https://www.instagram.com/') ? '@thuisbakery' : value

      expect(text).toContain(printed)
    }
  })

  it('marks up where pickup is, never a street address', () => {
    renderContact()

    expect(bakery()?.['areaServed']).toEqual({ '@type': 'City', name: 'Uithoorn' })
    expect(bakery()).not.toHaveProperty('address')
  })

  it('marks up the photograph it shows', () => {
    renderContact()

    expect(screen.getByAltText('Jana’s kitchen table')).toBeTruthy()
    expect(bakery()?.['image']).toEqual(['https://example.public.blob.vercel-storage.com/7.jpg'])
  })

  it('leaves a detail Jana has not set out of the page and the markup alike', () => {
    renderContact({
      contact: { ...contact, details: { email: 'hallo@thuisbakery.com' }, hours: {} },
      prices: [],
    })

    expect(screen.queryByText(/^\+31/)).toBeNull()
    expect(screen.queryByText('@thuisbakery')).toBeNull()
    expect(bakery()).not.toHaveProperty('telephone')
    expect(bakery()).not.toHaveProperty('sameAs')
    expect(bakery()).not.toHaveProperty('openingHoursSpecification')
    expect(bakery()).not.toHaveProperty('priceRange')
    expect(bakery()).not.toHaveProperty('image')
  })

  it('carries the collection policy, the questions and the Contact form', () => {
    renderContact()

    expect(screen.getByRole('heading', { name: 'Collecting your cake' })).toBeTruthy()
    expect(screen.getByText('Cakes are boxed.')).toBeTruthy()
    expect(screen.getByText('Do you deliver?')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Ask a question' })).toBeTruthy()
    expect(screen.getByLabelText('Your question')).toBeTruthy()
    expect(screen.queryByLabelText(/Pickup date/)).toBeNull()
  })

  it('links to Custom order, in the page’s language', () => {
    renderContact({ locale: 'nl' })

    expect(screen.getByRole('link', { name: 'Maatwerk' }).getAttribute('href')).toBe('/nl/maatwerk')
    expect(screen.getByText('zaterdag')).toBeTruthy()
    expect(bakery()?.['url']).toBe('https://thuisbakery.nl/nl/contact')
  })
})

const customOrder: CustomOrder = {
  id: 1,
  heading: 'Something of your own',
  intro: 'A cake for a day no menu could guess.\n\nTell Jana about it.',
  photograph: photograph(8, 'A three-tier wedding cake'),
  formHeading: 'Tell Jana what you’re imagining',
  ...stamps,
}

const renderCustomOrder = (locale: 'en' | 'nl' = 'en') =>
  render(
    <CustomOrderPage
      locale={locale}
      customOrder={customOrder}
      leadTime={{ days: 3, timeOfDay: '17:00' }}
      closedUntil={{ date: null, notice: null }}
    />,
  )

describe('CustomOrderPage', () => {
  it('introduces the bespoke path in Jana’s words', () => {
    renderCustomOrder()

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Something of your own')
    expect(screen.getByText('Tell Jana about it.')).toBeTruthy()
    expect(screen.getByAltText('A three-tier wedding cake')).toBeTruthy()
  })

  it('ends at the Estimate-free form, with a date and a photo', () => {
    renderCustomOrder()

    const form = screen.getByRole('region', { name: 'Tell Jana what you’re imagining' })

    expect(within(form).getByLabelText(/What you’re imagining/)).toBeTruthy()
    expect(within(form).getByLabelText(/Pickup date/)).toBeTruthy()
    expect(within(form).getByLabelText(/Inspiration photo/)).toBeTruthy()
    expect(within(form).queryByRole('region', { name: /Estimate/ })).toBeNull()
  })

  it('offers Contact for a question that is not an order', () => {
    renderCustomOrder('nl')

    expect(screen.getByRole('link', { name: 'Contact' }).getAttribute('href')).toBe('/nl/contact')
  })
})
