import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ItemOffer } from '@/domain/enquiry'
import type { EnquiryReply, Receipt } from '@/domain/submit-enquiry'

import { EnquiryForm } from './EnquiryForm'

const cheesecake: ItemOffer = {
  id: 10,
  title: 'Burnt Basque Cheesecake',
  sizes: [
    { id: 'small', label: 'Small', price: 45, diameter: 15, layers: 1, servings: 8 },
    { id: 'large', label: 'Large', price: 62.5, diameter: 20, layers: 2, servings: 14 },
  ],
  configurable: true,
  sponges: [
    { id: 1, name: 'Chocolate' },
    { id: 3, name: 'Red Velvet' },
  ],
  fillings: [
    { id: 1, name: 'Cream Cheese', surcharge: null },
    { id: 2, name: 'Salted Caramel', surcharge: 2.5 },
  ],
}

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
  leadTimeDays: 3,
}

beforeEach(() => {
  // Only the clock is faked: 21 September 2026, 09:00 in Amsterdam.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-09-21T07:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
  cleanup()
})

const renderForm = (overrides: Partial<Parameters<typeof EnquiryForm>[0]> = {}) => {
  const submit = vi.fn(
    async (_: Record<string, unknown>, __: Blob | null): Promise<EnquiryReply> => ({
      status: 'accepted',
      receipt,
    }),
  )
  const onSent = vi.fn()

  render(
    <EnquiryForm
      locale="en"
      offer={cheesecake}
      leadTime={{ days: 3, timeOfDay: '17:00' }}
      closedUntil={null}
      closedNotice={null}
      contactPath="/contact"
      submit={submit}
      onSent={onSent}
      {...overrides}
    />,
  )

  return { submit, onSent }
}

const estimatePanel = () => screen.getByRole('region', { name: /Estimate/ })

/** Which option in a named radio group starts checked. */
const checkedIn = (group: string) =>
  within(screen.getByRole('group', { name: group }))
    .getAllByRole('radio')
    .filter((radio) => (radio as HTMLInputElement).checked)
    .map((radio) => radio.getAttribute('value'))

const fillIn = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

const fillWhole = () => {
  fireEvent.click(screen.getByLabelText('Large'))
  fillIn('How many', '2')
  fireEvent.click(screen.getByLabelText('Red Velvet'))
  fireEvent.click(screen.getByLabelText(/Salted Caramel/))
  fillIn(/Pickup date/, '2026-09-26')
  fillIn('Your name', 'Sanne de Vries')
  fillIn('Email', 'sanne@example.nl')
}

const send = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Send enquiry' }))
  })
}

describe('EnquiryForm — the choices', () => {
  it('starts on the first Size, Sponge and Filling, in Jana’s order', () => {
    renderForm()

    expect(checkedIn('Size')).toEqual(['small'])
    expect(checkedIn('Sponge')).toEqual(['1'])
    expect(checkedIn('Filling')).toEqual(['1'])
  })

  it('prints each Size’s price, and what it is beneath', () => {
    renderForm()

    const sizes = within(screen.getByRole('group', { name: 'Size' }))

    expect(sizes.getByText('€62.50')).toBeTruthy()
    expect(sizes.getByText('15 cm · 1 layer · serves 8')).toBeTruthy()
    expect(sizes.getByText('20 cm · 2 layers · serves 14')).toBeTruthy()
  })

  it('shows an Item’s single Size as already chosen, with its price', () => {
    renderForm({
      offer: { ...cheesecake, sizes: [{ id: 'whole', label: 'Whole', price: 40 }] },
    })

    const sizes = within(screen.getByRole('group', { name: 'Size' }))

    expect(sizes.getAllByRole('radio')).toHaveLength(1)
    expect(checkedIn('Size')).toEqual(['whole'])
    expect(sizes.getByText('€40')).toBeTruthy()
  })
})

describe('EnquiryForm — the running Estimate', () => {
  it('starts from the first Size, one of it, and is labelled provisional', () => {
    renderForm()

    const panel = estimatePanel()

    expect(within(panel).getByText('Provisional')).toBeTruthy()
    expect(within(panel).getByText('Small × 1')).toBeTruthy()
    expect(within(panel).getAllByText('€45')).toHaveLength(2)
  })

  it('carries a first Filling’s Surcharge from the start', () => {
    renderForm({ offer: { ...cheesecake, fillings: [...cheesecake.fillings].reverse() } })

    const panel = estimatePanel()

    expect(within(panel).getByText('Salted Caramel × 1')).toBeTruthy()
    expect(within(panel).getByText('€47.50')).toBeTruthy()
  })

  it('follows the Size, the quantity and a surcharging Filling', () => {
    renderForm()

    fireEvent.click(screen.getByLabelText('Large'))
    fillIn('How many', '2')
    fireEvent.click(screen.getByLabelText(/Salted Caramel/))

    const panel = estimatePanel()

    expect(within(panel).getByText('Large × 2')).toBeTruthy()
    expect(within(panel).getByText('€125')).toBeTruthy()
    expect(within(panel).getByText('Salted Caramel × 2')).toBeTruthy()
    expect(within(panel).getByText('€5')).toBeTruthy()
    expect(within(panel).getByText('€130')).toBeTruthy()
  })

  it('never calls the figure a price, a total or a quote', () => {
    renderForm()

    expect(estimatePanel().textContent).not.toMatch(/price\b|total|quote/i)
  })

  it('holds the last figure while the quantity is being retyped', () => {
    renderForm()

    fillIn('How many', '3')
    fillIn('How many', '')

    expect(within(estimatePanel()).getByText('Small × 3')).toBeTruthy()
  })

  it('asks for no Sponge or Filling on an Item that is not configurable', () => {
    renderForm({ offer: { ...cheesecake, configurable: false, sponges: [], fillings: [] } })

    expect(screen.queryByRole('group', { name: 'Sponge' })).toBeNull()
    expect(screen.queryByRole('group', { name: 'Filling' })).toBeNull()
  })
})

describe('EnquiryForm — telling the customer what is wrong', () => {
  it('names every problem before anything is sent', async () => {
    const { submit } = renderForm()

    await send()

    expect(submit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toMatch('A few details need another look.')
    expect(screen.getByLabelText('Your name').getAttribute('aria-invalid')).toBe('true')
    // Name, email and the date are typed; the choices start made, so none is missing.
    expect(screen.getAllByText('Please fill this in.')).toHaveLength(3)
    expect(screen.queryByText('Please choose one of the options.')).toBeNull()
  })

  it('moves focus to the first field to fix, in the order they appear', async () => {
    renderForm()

    fillIn('How many', '0')
    await send()

    expect(document.activeElement).toBe(screen.getByLabelText('How many'))

    fillIn('How many', '1')
    await send()

    // The choices and quantity are made, so the date is the first thing missing.
    expect(document.activeElement).toBe(screen.getByLabelText(/Pickup date/))
  })

  it('asks for a choice the server could not match, as a choice', async () => {
    renderForm({
      submit: async () => ({ status: 'invalid', problems: { sponge: 'required' } }),
    })

    fillWhole()
    await send()

    expect(screen.getByText('Please choose one of the options.')).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByLabelText('Red Velvet'))
  })

  it('says how early a pickup can be, and rejects a date inside the Lead time', () => {
    renderForm()

    expect(screen.getByText('The earliest you can ask for is Thursday 24 September.')).toBeTruthy()
    expect(screen.getByLabelText(/Pickup date/).getAttribute('min')).toBe('2026-09-24')

    fillIn(/Pickup date/, '2026-09-23')
    fireEvent.blur(screen.getByLabelText(/Pickup date/))

    expect(
      screen.getByText('That is too soon. The earliest is Thursday 24 September.'),
    ).toBeTruthy()
  })

  it('shows the Closed until notice, and rejects a date before it', () => {
    renderForm({
      closedUntil: '2026-10-05T12:00:00.000Z',
      closedNotice: 'On holiday — back soon!',
    })

    expect(screen.getByText('On holiday — back soon!')).toBeTruthy()
    expect(screen.getByText('Jana is closed until Monday 5 October.')).toBeTruthy()
    expect(screen.getByLabelText(/Pickup date/).getAttribute('min')).toBe('2026-10-05')

    fillIn(/Pickup date/, '2026-10-01')
    fireEvent.blur(screen.getByLabelText(/Pickup date/))

    expect(
      screen.getByText('Jana is closed until Monday 5 October. Choose that day or later.'),
    ).toBeTruthy()
  })

  it('shows no notice once the Closed until date has passed', () => {
    renderForm({ closedUntil: '2026-09-01T12:00:00.000Z', closedNotice: 'On holiday' })

    expect(screen.queryByText('On holiday')).toBeNull()
  })
})

describe('EnquiryForm — sending', () => {
  it('sends the Enquiry for this Item, in this locale, and hands on the receipt', async () => {
    const { submit, onSent } = renderForm()

    fillWhole()
    fillIn('Special requests', 'Happy 40th, Marco')
    await send()

    expect(submit).toHaveBeenCalledWith(
      {
        enquiryType: 'item',
        locale: 'en',
        item: 10,
        size: 'large',
        quantity: '2',
        sponge: '3',
        filling: '2',
        requestedPickupDate: '2026-09-26',
        specialRequests: 'Happy 40th, Marco',
        name: 'Sanne de Vries',
        email: 'sanne@example.nl',
        phone: '',
        website: '',
      },
      null,
    )
    expect(onSent).toHaveBeenCalledWith(receipt)
  })

  it('shows the problems the server names', async () => {
    const { onSent } = renderForm({
      submit: async () => ({ status: 'invalid', problems: { email: 'invalidEmail' } }),
    })

    fillWhole()
    await send()

    expect(onSent).not.toHaveBeenCalled()
    expect(screen.getByText('This does not look like an email address.')).toBeTruthy()
  })

  it('owns a failure on our side, keeps what was typed, and offers a direct route', async () => {
    const { onSent } = renderForm({ submit: async () => ({ status: 'failed' }) })

    fillWhole()
    await send()

    expect(onSent).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toMatch('The problem is on our side')
    expect(
      screen.getByRole('link', { name: 'Or get in touch directly' }).getAttribute('href'),
    ).toBe('/contact')
    expect((screen.getByLabelText('Your name') as HTMLInputElement).value).toBe('Sanne de Vries')
  })

  it('carries a honeypot no person sees', () => {
    renderForm()

    const honeypot = document.querySelector('input[name="website"]')

    expect(honeypot?.getAttribute('tabindex')).toBe('-1')
    expect(honeypot?.closest('[aria-hidden="true"]')).toBeTruthy()
  })
})

describe('EnquiryForm — the Inspiration photo', () => {
  const photoFile = new File([new Uint8Array(8_000_000)], 'IMG_2041.HEIC', { type: 'image/heic' })
  const downscaled = new Blob([new Uint8Array(900_000)], { type: 'image/jpeg' })

  const attach = async (file: File) => {
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Inspiration photo/), { target: { files: [file] } })
    })
  }

  it('sends the photo as downscaled in the browser, never the file as chosen', async () => {
    const downscale = vi.fn(async () => downscaled)
    const { submit } = renderForm({ downscale })

    fillWhole()
    await attach(photoFile)
    await send()

    expect(downscale).toHaveBeenCalledWith(photoFile)
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ item: 10 }), downscaled)
  })

  it('says so when a chosen file cannot be read as a photo, and sends none', async () => {
    const { submit } = renderForm({
      downscale: async () => {
        throw new Error('The source image could not be decoded.')
      },
    })

    fillWhole()
    await attach(photoFile)

    expect(
      screen.getByText('This does not look like a photo. Please choose a JPEG or PNG.'),
    ).toBeTruthy()

    await send()

    expect(submit).not.toHaveBeenCalled()
  })

  it('refuses a photo still over 5 MB once downscaled', async () => {
    const { submit } = renderForm({
      downscale: async () => new Blob([new Uint8Array(5 * 1024 * 1024 + 1)]),
    })

    fillWhole()
    await attach(photoFile)
    await send()

    expect(screen.getByText('This photo is too large. Please choose a smaller one.')).toBeTruthy()
    expect(submit).not.toHaveBeenCalled()
  })

  it('lets a chosen photo be taken off again', async () => {
    const { submit } = renderForm({ downscale: async () => downscaled })

    fillWhole()
    await attach(photoFile)
    fireEvent.click(screen.getByRole('button', { name: 'Remove photo' }))
    await send()

    expect(submit).toHaveBeenCalledWith(expect.anything(), null)
  })

  it('shows the problem the server names for the photo', async () => {
    renderForm({
      downscale: async () => downscaled,
      submit: async () => ({ status: 'invalid', problems: { photo: 'notAnImage' } }),
    })

    fillWhole()
    await attach(photoFile)
    await send()

    expect(
      screen.getByText('This does not look like a photo. Please choose a JPEG or PNG.'),
    ).toBeTruthy()
  })
})
