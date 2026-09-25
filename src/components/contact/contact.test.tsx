import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CustomOrderHost } from '@/components/enquiry/CustomOrderHost'
import { SiteHeader } from '@/components/site/SiteHeader'
import type { Contact, CustomOrder, Header, Media } from '@/payload-types'

import { ContactPage } from './ContactPage'
import { CustomOrderPage } from './CustomOrderPage'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  cleanup()
})

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

/**
 * A page inside the site-wide sheet host, as the frontend layout renders it: the Lead time
 * and Closed until the layout fetched once, for a Custom order from anywhere.
 */
const withHost = (
  page: ReactNode,
  {
    locale = 'en',
    closedUntil = null,
    closedNotice = null,
  }: {
    locale?: 'en' | 'nl'
    closedUntil?: string | null
    closedNotice?: string | null
  } = {},
) =>
  render(
    <CustomOrderHost
      locale={locale}
      leadTime={{ days: 3, timeOfDay: '17:00' }}
      closedUntil={closedUntil}
      closedNotice={closedNotice}
    >
      {page}
    </CustomOrderHost>,
  )

const renderCustomOrder = (locale: 'en' | 'nl' = 'en') =>
  withHost(<CustomOrderPage locale={locale} customOrder={customOrder} />, { locale })

/** Only the clock is faked: 21 September 2026, 09:00 in Amsterdam. */
const monday21September = () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-21T07:00:00Z'))
}

/** The route handler, faked at the network: it accepts whatever it is sent. */
const acceptingRoute = () => {
  const fetch = vi.fn(async (_: string, __: RequestInit) =>
    Response.json({ status: 'accepted', receipt: null }),
  )

  vi.stubGlobal('fetch', fetch)

  return fetch
}

const press = async (name: string | RegExp) => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }))
  })
}

const day = (name: string) => screen.getByRole('radio', { name }) as HTMLInputElement

describe('CustomOrderPage', () => {
  it('introduces the bespoke path in Jana’s words', () => {
    renderCustomOrder()

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Something of your own')
    expect(screen.getByText('Tell Jana about it.')).toBeTruthy()
    expect(screen.getByAltText('A three-tier wedding cake')).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Tell Jana what you’re imagining' })).toBeTruthy()
  })

  it('offers the Custom order sheet at the top, as a link that still works without scripts', () => {
    renderCustomOrder('nl')

    expect(screen.getByRole('link', { name: 'Vertel Jana je idee' }).getAttribute('href')).toBe(
      '/nl/maatwerk',
    )
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens the sheet in place and sends a Custom order Enquiry from it', async () => {
    monday21September()
    const fetch = acceptingRoute()
    renderCustomOrder()

    const click = new MouseEvent('click', { bubbles: true, cancelable: true })
    act(() => {
      screen.getByRole('link', { name: 'Tell Jana your idea' }).dispatchEvent(click)
    })

    // Opened in place: the browser does not follow the link.
    expect(click.defaultPrevented).toBe(true)
    const sheet = screen.getByRole('dialog', { name: 'Tell Jana your idea' })
    expect(
      within(within(sheet).getByRole('list', { name: 'Steps' }))
        .getAllByRole('listitem')
        .map((step) => step.textContent),
    ).toEqual(['Idea', 'When', 'Photo', 'You'])

    fireEvent.click(screen.getByLabelText('Just because'))
    fireEvent.change(screen.getByLabelText('What do you have in mind?'), {
      target: { value: 'A cake shaped like our dog.' },
    })
    await press('Next')
    fireEvent.click(day('Saturday 26 September'))
    await press('Next')
    await press('Next')
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Sanne de Vries' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'sanne@example.nl' } })
    await press('Send to Jana')

    expect(fetch).toHaveBeenCalledOnce()
    const [endpoint, init] = fetch.mock.calls[0]!
    const sent = init.body as FormData
    expect(endpoint).toBe('/next/enquiry')
    expect(sent.get('enquiryType')).toBe('custom-order')
    expect(sent.get('requestedPickupDate')).toBe('2026-09-26')
    expect(sent.get('message')).toBe(
      'For: Just because\nAbout 12 people\n\nA cake shaped like our dog.',
    )
    expect(screen.getByRole('dialog', { name: 'Sent to Jana' })).toBeTruthy()
  })

  it('offers Contact for a question that is not an order', () => {
    renderCustomOrder('nl')

    expect(screen.getByRole('link', { name: 'Contact' }).getAttribute('href')).toBe('/nl/contact')
  })
})

const header: Header = {
  id: 1,
  links: [
    { page: 'cakes', label: 'Cakes' },
    { page: 'nibbles', label: 'Nibbles' },
    { page: 'about', label: 'About' },
    { page: 'contact', label: 'Contact' },
  ],
  callToAction: { page: 'customOrder', label: 'Custom order' },
}

describe('Custom order from anywhere', () => {
  /** The header's Custom order control on a wide screen: the one outside the phone menu. */
  const headerControl = () =>
    within(screen.getByRole('navigation', { name: 'Main menu' })).getByRole('link', {
      name: 'Custom order',
    })

  it('is a link to Custom order in the header of another page', () => {
    withHost(<SiteHeader locale="en" page="about" header={header} />)

    expect(headerControl().getAttribute('href')).toBe('/custom-order')
  })

  it('opens the Custom order sheet in place from the header, and gives focus back on closing', async () => {
    monday21September()
    withHost(<SiteHeader locale="en" page="about" header={header} />)

    const control = headerControl()
    control.focus()
    fireEvent.click(control)

    expect(screen.getByRole('dialog', { name: 'Tell Jana your idea' })).toBeTruthy()

    await press('Close')

    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(control))
  })

  it('opens from the phone menu, which closes as the sheet opens', async () => {
    withHost(<SiteHeader locale="en" page="about" header={header} />)

    await press('Menu')
    fireEvent.click(
      within(screen.getByRole('dialog', { name: 'Menu' })).getByRole('link', {
        name: 'Custom order',
      }),
    )

    expect(screen.queryByRole('dialog', { name: 'Menu' })).toBeNull()
    expect(screen.getByRole('dialog', { name: 'Tell Jana your idea' })).toBeTruthy()
  })

  it('starts a new Custom order when reopened after one was sent', async () => {
    monday21September()
    acceptingRoute()
    withHost(<SiteHeader locale="en" page="about" header={header} />)

    fireEvent.click(headerControl())
    fireEvent.change(screen.getByLabelText('What do you have in mind?'), {
      target: { value: 'A cake shaped like our dog.' },
    })
    await press('Next')
    fireEvent.click(day('Saturday 26 September'))
    await press('Next')
    await press('Next')
    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Sanne de Vries' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'sanne@example.nl' } })
    await press('Send to Jana')
    await press('Done')

    fireEvent.click(headerControl())

    expect(screen.getByRole('dialog', { name: 'Tell Jana your idea' })).toBeTruthy()
    expect((screen.getByLabelText('What do you have in mind?') as HTMLTextAreaElement).value).toBe(
      '',
    )
  })

  it('holds the date to the Lead time and Closed until the layout fetched', async () => {
    monday21September()
    withHost(<SiteHeader locale="en" page="about" header={header} />, {
      closedUntil: '2026-10-05T12:00:00.000Z',
      closedNotice: 'On holiday — back soon!',
    })

    fireEvent.click(headerControl())
    fireEvent.change(screen.getByLabelText('What do you have in mind?'), {
      target: { value: 'A cake shaped like our dog.' },
    })
    await press('Next')

    expect(screen.getByText('On holiday — back soon!')).toBeTruthy()
    expect(day('Friday 2 October').disabled).toBe(true)
    expect(day('Monday 5 October').disabled).toBe(false)
  })

  it('leaves a click with a modifier key to the browser, to open the page in a new tab', () => {
    withHost(<SiteHeader locale="en" page="about" header={header} />)

    fireEvent.click(headerControl(), { metaKey: true })

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('is a plain link where no sheet host is running', () => {
    render(<SiteHeader locale="en" page="about" header={header} />)

    fireEvent.click(headerControl())

    expect(headerControl().getAttribute('href')).toBe('/custom-order')
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
