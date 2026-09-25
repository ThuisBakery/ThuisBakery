import {
  act,
  cleanup,
  fireEvent,
  isInaccessible,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Receipt } from '@/domain/submit-enquiry'
import type { Allergen, Category, Filling, Item, LeadTime, Media, Sponge } from '@/payload-types'

import { ItemPage } from './ItemPage'

beforeEach(() => {
  // Only the clock is faked: 21 September 2026, 09:00 in Amsterdam.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-21T07:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  sessionStorage.clear()
  cleanup()
})

const stamps = { updatedAt: '2026-09-23T00:00:00.000Z', createdAt: '2026-09-23T00:00:00.000Z' }

const media = (id: number, alt: string): Media => ({
  id,
  alt,
  url: `https://example.public.blob.vercel-storage.com/${id}.jpg`,
  width: 1600,
  height: 1200,
  ...stamps,
})

const paragraph = (text: string) => ({
  type: 'paragraph',
  format: '' as const,
  indent: 0,
  version: 1,
  direction: 'ltr' as const,
  textFormat: 0,
  children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
})

const description = (...texts: string[]): NonNullable<Item['description']> => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: texts.map(paragraph),
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
  photographs: [media(id * 10, '')],
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

/** Whether `first` comes before `second` in the page. */
const precedes = (first: Element, second: Element) =>
  Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING)

/** Every JSON-LD block on the page, parsed. */
const structuredData = (container: HTMLElement): Record<string, unknown>[] =>
  [...container.querySelectorAll('script[type="application/ld+json"]')].map(
    (script) => JSON.parse(script.textContent ?? '') as Record<string, unknown>,
  )

/** Every **Ask Jana for this cake**: the details column's first, then the phone's bar. */
const askButtons = () => screen.getAllByRole('button', { name: 'Ask Jana for this cake' })

/** Opens the Enquiry sheet from the details column's button, and returns the sheet. */
const openSheet = (button = askButtons()[0]!) => {
  fireEvent.click(button)

  return screen.getByRole('dialog')
}

/** Next, in the sheet's pinned foot. */
const pressNext = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
  })
}

/** A named radio group's options in the sheet, as the values they send. */
const optionsIn = (sheet: HTMLElement, group: string) =>
  within(within(sheet).getByRole('group', { name: group }))
    .getAllByRole('radio')
    .map((radio) => radio.getAttribute('value'))

const pressEscape = () =>
  fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })

describe('ItemPage — deciding', () => {
  it('opens with the Category, the title, the price and servings, and the first paragraph', () => {
    renderPage()

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Burnt Basque Cheesecake')
    expect(screen.getByText('Specialty Cakes')).toBeTruthy()
    expect(screen.getByText('from €45')).toBeTruthy()
    expect(screen.getByText('serves 8–14')).toBeTruthy()
    expect(screen.getByText('Caramelised outside, barely set inside.')).toBeTruthy()
  })

  it('keeps the rest of the description behind More', () => {
    renderPage({
      item: {
        ...cheesecake,
        description: description(
          'Caramelised outside, barely set inside.',
          'Baked hot and fast, the Basque way, and left to settle overnight.',
        ),
      },
    })

    expect(screen.getByText('Caramelised outside, barely set inside.')).toBeTruthy()
    const rest = screen.getByText(
      'Baked hot and fast, the Basque way, and left to settle overnight.',
    )
    expect(isInaccessible(rest)).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'More' }))

    expect(isInaccessible(rest)).toBe(false)
  })

  it('offers no More when the description is one paragraph', () => {
    renderPage()

    expect(screen.queryByRole('button', { name: 'More' })).toBeNull()
  })

  it('links the Category’s label back to its section', () => {
    renderPage({ locale: 'nl' })

    expect(screen.getByRole('link', { name: 'Specialty Cakes' }).getAttribute('href')).toBe(
      '/nl/taarten#specialty',
    )
  })

  it('runs the details column from the Category to the Allergens, with the action between', () => {
    renderPage()

    const order = [
      screen.getByText('Specialty Cakes'),
      screen.getByRole('heading', { level: 1 }),
      screen.getByText('from €45'),
      screen.getByText('Caramelised outside, barely set inside.'),
      screen.getByRole('region', { name: 'How far ahead to ask' }),
      screen.getByRole('list', { name: 'Sizes' }),
      askButtons()[0]!,
      screen.getByRole('list', { name: 'Allergens' }),
    ]

    for (const [index, element] of order.slice(1).entries()) {
      expect(precedes(order[index]!, element)).toBe(true)
    }
  })

  it('prints every Size with what it is and its price, outside the sheet', () => {
    renderPage()

    expect(screen.queryByRole('dialog')).toBeNull()

    const sizes = within(screen.getByRole('list', { name: 'Sizes' }))
    expect(sizes.getAllByRole('listitem').map((row) => row.textContent)).toEqual([
      'Small15 cm · 1 layer · serves 8€45',
      'Large20 cm · 2 layers · serves 14€62.50',
    ])
  })

  it('prints a single Size, its price as the price', () => {
    renderPage({ item: { ...cheesecake, sizes: [{ id: 'whole', label: 'Whole', price: 40 }] } })

    const sizes = within(screen.getByRole('list', { name: 'Sizes' }))
    expect(sizes.getAllByRole('listitem').map((row) => row.textContent)).toEqual(['Whole€40'])
  })

  it('states the Item’s own Lead time, days and time of day, and the earliest pickup', () => {
    renderPage()

    const leadTime = within(screen.getByRole('region', { name: 'How far ahead to ask' }))
    expect(leadTime.getByText('5 days’ notice')).toBeTruthy()
    expect(leadTime.getByText('Ask before 12:00 and that day counts.')).toBeTruthy()
    // Monday 21 September at 09:00, before the cutoff: five days on is Saturday 26.
    expect(leadTime.getByText(/The earliest you can ask for is .*26 September/)).toBeTruthy()
  })

  it('falls back to the site-wide Lead time', () => {
    const { container } = renderPage({ item: { ...cheesecake, leadTime: {} } })

    expect(container.textContent).toContain('3 days’ notice')
    expect(container.textContent).toContain('Ask before 17:00')
  })

  it('lists the Allergens with their icons, beside the cross-contamination statement', () => {
    renderPage()

    const allergens = screen.getByRole('list', { name: 'Allergens' })
    expect(
      within(allergens)
        .getAllByRole('listitem')
        .map((row) => row.textContent),
    ).toEqual(['Egg', 'Milk'])
    expect(allergens.querySelectorAll('img')).toHaveLength(2)
    expect(
      within(screen.getByRole('region', { name: 'Allergens' })).getByText(statement),
    ).toBeTruthy()
  })

  it('repeats the title and the action in the phone’s bar', () => {
    renderPage()

    const [, bar] = askButtons()
    expect(bar).toBeTruthy()
    expect(bar!.parentElement?.textContent).toContain('Burnt Basque Cheesecake')
  })
})

describe('ItemPage — the gallery', () => {
  it('shows one main photograph, and swaps it from the thumbnails', () => {
    renderPage()

    const first = screen.getByRole('button', { name: 'Show photograph 1' })
    const second = screen.getByRole('button', { name: 'Show photograph 2' })

    expect(screen.getByAltText('The cheesecake, cut')).toBeTruthy()
    expect(screen.queryByAltText('The cheesecake, whole')).toBeNull()
    expect(first.getAttribute('aria-pressed')).toBe('true')
    expect(second.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(second)

    expect(screen.getByAltText('The cheesecake, whole')).toBeTruthy()
    expect(screen.queryByAltText('The cheesecake, cut')).toBeNull()
    expect(first.getAttribute('aria-pressed')).toBe('false')
    expect(second.getAttribute('aria-pressed')).toBe('true')
  })

  it('shows no thumbnails for an Item with one photograph', () => {
    renderPage({ item: { ...cheesecake, photographs: [media(1, 'The cheesecake, cut')] } })

    expect(screen.getByAltText('The cheesecake, cut')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Show photograph/ })).toBeNull()
  })
})

describe('ItemPage — the foot', () => {
  it('links two or three sibling Items from its own catalogue, each with its price', () => {
    renderPage()

    const siblings = screen.getByRole('navigation', { name: 'More from the menu' })
    const links = within(siblings).getAllByRole('link')

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/cakes/carrot-cake',
      '/cakes/lemon-drizzle',
      '/cakes/apple-pie',
    ])
    expect(links[0]!.textContent).toBe('Carrot Cake€40')
  })

  it('links the Occasion pages it is tagged with, and only those that exist, beside Custom order', () => {
    renderPage({ locale: 'nl' })

    const occasions = within(screen.getByRole('list', { name: 'Gemaakt voor' }))

    expect(
      occasions.getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([['Wedding', '/wedding-cakes']])
    expect(screen.queryByRole('link', { name: 'Birthday' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Iets op maat' }).getAttribute('href')).toBe(
      '/nl/maatwerk',
    )
  })

  it('still offers Custom order when the Item is tagged with no Occasion page', () => {
    renderPage({ occasionPages: new Map() })

    expect(screen.queryByRole('list', { name: 'Made for' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Something custom' }).getAttribute('href')).toBe(
      '/custom-order',
    )
  })

  it('puts the Occasions and the siblings after the details column', () => {
    renderPage()

    expect(
      precedes(
        screen.getByRole('list', { name: 'Allergens' }),
        screen.getByRole('link', { name: 'Wedding' }),
      ),
    ).toBe(true)
  })
})

describe('ItemPage — structured data', () => {
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

describe('ItemPage — the Enquiry sheet', () => {
  it('opens the stepped Enquiry from Ask Jana for this cake, on Size', () => {
    renderPage()

    expect(screen.queryByRole('dialog')).toBeNull()

    const sheet = within(openSheet())

    expect(sheet.getByRole('heading', { name: 'Choose a size' })).toBeTruthy()
    expect(sheet.getByText('Burnt Basque Cheesecake')).toBeTruthy()
    expect(sheet.getByRole('group', { name: 'Size' })).toBeTruthy()
    expect(
      within(sheet.getByRole('list', { name: 'Steps' }))
        .getAllByRole('listitem')
        .map((step) => step.textContent),
    ).toEqual(['Size', 'Flavour', 'Date', 'You'])
  })

  it('offers every Size, and the Item’s own Sponges and every Filling, with Surcharges', async () => {
    renderPage()

    const sheet = openSheet()

    // The fixture's Sizes carry no row ids, so they are keyed by position.
    expect(optionsIn(sheet, 'Size')).toEqual(['0', '1'])

    await pressNext()

    expect(optionsIn(sheet, 'Sponge')).toEqual(['1', '3'])
    expect(optionsIn(sheet, 'Filling')).toEqual(['1', '2', '3'])

    const fillingGroup = within(within(sheet).getByRole('group', { name: 'Filling' }))
    expect(fillingGroup.getByText('+€2.50')).toBeTruthy()
    expect(fillingGroup.getByText('+€3')).toBeTruthy()
  })

  it('starts on the first of each choice, and the pinned Estimate follows them', async () => {
    renderPage()

    const sheet = within(openSheet())
    const estimate = () => within(sheet.getByRole('region', { name: /Estimate/ }))

    expect((sheet.getByLabelText('Small') as HTMLInputElement).checked).toBe(true)
    expect(estimate().getByText('€45')).toBeTruthy()

    fireEvent.click(sheet.getByRole('button', { name: 'One more' }))
    expect(estimate().getByText('Small × 2')).toBeTruthy()
    expect(estimate().getByText('€90')).toBeTruthy()

    await pressNext()

    expect((sheet.getByLabelText('Chocolate') as HTMLInputElement).checked).toBe(true)
    expect((sheet.getByLabelText('Cream Cheese') as HTMLInputElement).checked).toBe(true)

    fireEvent.click(sheet.getByLabelText('Ganache'))

    expect(estimate().getByText('Ganache × 2')).toBeTruthy()
    expect(estimate().getByText('€96')).toBeTruthy()
  })

  it('arrives on a single Size already chosen, and skips Flavour on an Item sold as described', async () => {
    renderPage({
      item: {
        ...cheesecake,
        configurable: false,
        sizes: [{ id: 'whole', label: 'Whole', price: 40 }],
      },
    })

    const sheet = within(openSheet())

    expect(sheet.getByRole('heading', { name: 'How many?' })).toBeTruthy()
    expect((sheet.getByLabelText('Whole') as HTMLInputElement).checked).toBe(true)

    await pressNext()

    expect(sheet.getByRole('heading', { name: 'When do you need it?' })).toBeTruthy()
    expect(sheet.queryByRole('group', { name: 'Sponge' })).toBeNull()
    expect(sheet.queryByRole('group', { name: 'Filling' })).toBeNull()
  })

  it('holds the date to Closed until, with Jana’s notice', async () => {
    renderPage({
      closedUntil: { date: '2099-01-04T12:00:00.000Z', notice: 'Away for the winter.' },
    })

    const sheet = within(openSheet())
    await pressNext()
    await pressNext()

    expect(sheet.getByText('Away for the winter.')).toBeTruthy()
    expect(sheet.getByText(/Jana is closed until/)).toBeTruthy()
    expect(
      (sheet.getByRole('radio', { name: 'Saturday 3 January 2099' }) as HTMLInputElement).disabled,
    ).toBe(true)
    expect(
      (sheet.getByRole('radio', { name: 'Sunday 4 January 2099' }) as HTMLInputElement).disabled,
    ).toBe(false)
  })

  it('takes focus in, and puts the page behind out of reach while open', async () => {
    renderPage()

    const sheet = openSheet()

    await waitFor(() => expect(sheet.contains(document.activeElement)).toBe(true))
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
  })

  it('closes on Escape and gives focus back to the button that opened it', async () => {
    renderPage()

    const button = askButtons()[0]!
    const sheet = openSheet(button)
    await waitFor(() => expect(sheet.contains(document.activeElement)).toBe(true))

    pressEscape()

    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(button))
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
  })

  it('closes on a tap outside, and from the phone’s bar gives focus back to the bar', async () => {
    renderPage()

    const bar = askButtons()[1]!
    const sheet = openSheet(bar)
    await waitFor(() => expect(sheet.contains(document.activeElement)).toBe(true))

    // A tap outside: the press, then the click it ends in.
    fireEvent.pointerDown(document.body)
    fireEvent.click(document.body)

    expect(screen.queryByRole('dialog')).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(bar))
  })

  it('keeps the step and everything entered when it is closed and opened again', async () => {
    renderPage()

    let sheet = within(openSheet())
    fireEvent.click(sheet.getByLabelText('Large'))
    await pressNext()
    await pressNext()
    fireEvent.click(sheet.getByRole('radio', { name: 'Saturday 26 September' }))
    await pressNext()
    fireEvent.change(sheet.getByLabelText('Your name'), { target: { value: 'Sanne de Vries' } })

    fireEvent.click(sheet.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).toBeNull()

    sheet = within(openSheet())
    expect(sheet.getByRole('heading', { name: 'Where should Jana reply?' })).toBeTruthy()
    expect((sheet.getByLabelText('Your name') as HTMLInputElement).value).toBe('Sanne de Vries')

    fireEvent.click(sheet.getByRole('button', { name: 'Back' }))
    fireEvent.click(sheet.getByRole('button', { name: 'Back' }))
    fireEvent.click(sheet.getByRole('button', { name: 'Back' }))
    expect((sheet.getByLabelText('Large') as HTMLInputElement).checked).toBe(true)
  })

  /** Steps through the whole Enquiry to You, as a customer would, and fills it in. */
  const fillWhole = async (sheet: ReturnType<typeof within>) => {
    fireEvent.click(sheet.getByLabelText('Large'))
    fireEvent.click(sheet.getByRole('button', { name: 'One more' }))
    await pressNext()
    fireEvent.click(sheet.getByLabelText('Red Velvet'))
    fireEvent.click(sheet.getByLabelText('Salted Caramel'))
    await pressNext()
    fireEvent.click(sheet.getByRole('radio', { name: 'Saturday 26 September' }))
    await pressNext()
    fireEvent.change(sheet.getByLabelText('Your name'), { target: { value: 'Sanne de Vries' } })
    fireEvent.change(sheet.getByLabelText('Email'), { target: { value: 'sanne@example.nl' } })
  }

  const sendToJana = async (sheet: ReturnType<typeof within>) => {
    await act(async () => {
      fireEvent.click(sheet.getByRole('button', { name: 'Send to Jana' }))
    })
  }

  it('sends the same Enquiry as before, and confirms in the sheet', async () => {
    const receipt: Receipt = {
      reference: 'K7MQ-3XTP',
      enquiryType: 'item',
      itemTitle: 'Burnt Basque Cheesecake',
      size: 'Large',
      quantity: 2,
      sponge: 'Red Velvet',
      filling: 'Salted Caramel',
      requestedPickupDate: '2026-09-26',
      specialRequests: null,
      message: null,
      estimate: null,
      leadTimeDays: 5,
    }
    const fetch = vi.fn(async (_url: string, _init: RequestInit) =>
      Response.json({ status: 'accepted', receipt }),
    )
    vi.stubGlobal('fetch', fetch)

    renderPage()

    const sheet = within(openSheet())
    await fillWhole(sheet)
    await sendToJana(sheet)

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = fetch.mock.calls[0]!
    expect(url).toBe('/next/enquiry')
    expect(Object.fromEntries(init.body as FormData)).toEqual({
      enquiryType: 'item',
      locale: 'en',
      item: '10',
      size: '1',
      quantity: '2',
      sponge: '3',
      filling: '2',
      requestedPickupDate: '2026-09-26',
      specialRequests: '',
      name: 'Sanne de Vries',
      email: 'sanne@example.nl',
      phone: '',
      website: '',
    })

    const sent = within(screen.getByRole('dialog', { name: 'Sent to Jana' }))
    expect(sent.getByText('Expect her reply within 5 days.')).toBeTruthy()
    expect(sent.getByText('Reference K7MQ-3XTP')).toBeTruthy()
    expect(sent.getByText('Saturday 26 September')).toBeTruthy()
    expect(sent.getByRole('link', { name: 'Back to the cakes' }).getAttribute('href')).toBe(
      '/cakes',
    )
  })

  it('returns to the step that owns a problem the server names', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          { status: 'invalid', problems: { requestedPickupDate: 'tooSoon' } },
          { status: 422 },
        ),
      ),
    )

    renderPage()

    const sheet = within(openSheet())
    await fillWhole(sheet)
    await sendToJana(sheet)

    expect(sheet.getByRole('heading', { name: 'When do you need it?' })).toBeTruthy()
    expect(sheet.getByText(/That is too soon/)).toBeTruthy()
  })

  it('keeps everything entered on a failure on our side, with a direct route to Jana', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ status: 'failed' }, { status: 500 })),
    )

    renderPage()

    const sheet = within(openSheet())
    await fillWhole(sheet)
    await sendToJana(sheet)

    expect(sheet.getByRole('alert').textContent).toMatch('The problem is on our side')
    expect(sheet.getByRole('link', { name: 'Or get in touch directly' }).getAttribute('href')).toBe(
      '/contact',
    )
    expect((sheet.getByLabelText('Email') as HTMLInputElement).value).toBe('sanne@example.nl')
  })
})
