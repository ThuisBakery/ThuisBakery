import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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

/** Sold as described: no Sponge or Filling to choose. */
const soldAsDescribed: ItemOffer = {
  ...cheesecake,
  configurable: false,
  sponges: [],
  fillings: [],
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

  render(
    <EnquiryForm
      locale="en"
      offer={cheesecake}
      leadTime={{ days: 3, timeOfDay: '17:00' }}
      closedUntil={null}
      closedNotice={null}
      contactPath="/contact"
      catalogue={{ name: 'Cakes', path: '/cakes' }}
      open
      onOpenChange={() => {}}
      returnFocus={{ current: null }}
      submit={submit}
      {...overrides}
    />,
  )

  return { submit }
}

/** The sheet, named by the step it is on. */
const sheetOn = (title: string) => screen.getByRole('dialog', { name: title })

/** The step the progress indicator marks as current, as assistive technology reads it. */
const currentStep = () =>
  within(screen.getByRole('list', { name: 'Steps' }))
    .getAllByRole('listitem')
    .find((step) => step.getAttribute('aria-current') === 'step')?.textContent

const stepNames = () =>
  within(screen.getByRole('list', { name: 'Steps' }))
    .getAllByRole('listitem')
    .map((step) => step.textContent)

const estimatePanel = () => screen.getByRole('region', { name: /Estimate/ })

/** Which option in a named radio group is checked. */
const checkedIn = (group: string) =>
  within(screen.getByRole('group', { name: group }))
    .getAllByRole('radio')
    .filter((radio) => (radio as HTMLInputElement).checked)
    .map((radio) => radio.getAttribute('value'))

const press = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))

const next = async () => {
  await act(async () => {
    press('Next')
  })
}

const back = () => press('Back')

const howMany = () =>
  within(screen.getByRole('group', { name: 'How many' })).getByRole('status').textContent

const day = (name: string) => screen.getByRole('radio', { name }) as HTMLInputElement

const fillIn = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

/** Size, Flavour and Date chosen, arriving on You. */
const chooseUpToYou = async () => {
  fireEvent.click(screen.getByLabelText('Large'))
  press('One more')
  await next()
  fireEvent.click(screen.getByLabelText('Red Velvet'))
  fireEvent.click(screen.getByLabelText(/Salted Caramel/))
  await next()
  fireEvent.click(day('Saturday 26 September'))
  await next()
}

/** The whole Enquiry, on the last step and ready to send. */
const fillWhole = async () => {
  await chooseUpToYou()
  fillIn('Your name', 'Sanne de Vries')
  fillIn('Email', 'sanne@example.nl')
}

const send = async () => {
  await act(async () => {
    press('Send to Jana')
  })
}

describe('EnquiryForm — the steps', () => {
  it('steps a Configurable Item through Size, Flavour, Date and You', async () => {
    renderForm()

    expect(stepNames()).toEqual(['Size', 'Flavour', 'Date', 'You'])
    expect(sheetOn('Choose a size')).toBeTruthy()
    expect(currentStep()).toBe('Size')
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull()

    await next()
    expect(sheetOn('Choose your flavours')).toBeTruthy()
    expect(currentStep()).toBe('Flavour')

    await next()
    expect(sheetOn('When do you need it?')).toBeTruthy()
    expect(currentStep()).toBe('Date')
    fireEvent.click(day('Saturday 26 September'))

    await next()
    expect(sheetOn('Where should Jana reply?')).toBeTruthy()
    expect(currentStep()).toBe('You')
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Send to Jana' })).toBeTruthy()
  })

  it('names the Item above the step', () => {
    renderForm()

    expect(within(sheetOn('Choose a size')).getByText('Burnt Basque Cheesecake')).toBeTruthy()
  })

  it('moves focus to the new step’s title, so it is announced', async () => {
    renderForm()

    await next()

    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('heading', { name: 'Choose your flavours' }),
      ),
    )
  })

  it('skips Flavour for an Item that is not Configurable', async () => {
    renderForm({ offer: soldAsDescribed })

    expect(stepNames()).toEqual(['Size', 'Date', 'You'])

    await next()

    expect(sheetOn('When do you need it?')).toBeTruthy()
    expect(screen.queryByRole('group', { name: 'Sponge' })).toBeNull()
    expect(screen.queryByRole('group', { name: 'Filling' })).toBeNull()
  })

  it('arrives on Size with a single Size already chosen, asking only how many', () => {
    renderForm({
      offer: { ...cheesecake, sizes: [{ id: 'whole', label: 'Whole', price: 40 }] },
    })

    const sizes = within(screen.getByRole('group', { name: 'Size' }))

    expect(sheetOn('How many?')).toBeTruthy()
    expect(currentStep()).toBe('Size')
    expect(sizes.getAllByRole('radio')).toHaveLength(1)
    expect(checkedIn('Size')).toEqual(['whole'])
    expect(sizes.getByText('€40')).toBeTruthy()
  })

  it('keeps every choice going Back', async () => {
    renderForm()

    fireEvent.click(screen.getByLabelText('Large'))
    press('One more')
    await next()
    fireEvent.click(screen.getByLabelText('Red Velvet'))
    await next()
    fireEvent.click(day('Saturday 26 September'))
    await next()
    fillIn('Your name', 'Sanne de Vries')

    back()
    expect(sheetOn('When do you need it?')).toBeTruthy()
    expect(day('Saturday 26 September').checked).toBe(true)

    back()
    expect(checkedIn('Sponge')).toEqual(['3'])

    back()
    expect(checkedIn('Size')).toEqual(['large'])
    expect(howMany()).toBe('2')

    await next()
    await next()
    await next()
    expect((screen.getByLabelText('Your name') as HTMLInputElement).value).toBe('Sanne de Vries')
  })
})

describe('EnquiryForm — the choices', () => {
  it('starts on the first Size, Sponge and Filling, in Jana’s order', async () => {
    renderForm()

    expect(checkedIn('Size')).toEqual(['small'])

    await next()

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

  it('shows a Filling’s Surcharge on its chip', async () => {
    renderForm()

    await next()

    expect(within(screen.getByRole('group', { name: 'Filling' })).getByText('+€2.50')).toBeTruthy()
  })
})

describe('EnquiryForm — how many', () => {
  it('is a stepper from 1, with no field to type in', () => {
    renderForm()

    expect(howMany()).toBe('1')
    expect(screen.queryByRole('spinbutton')).toBeNull()
    expect(screen.queryByRole('textbox')).toBeNull()

    press('One fewer')
    expect(howMany()).toBe('1')

    press('One more')
    press('One more')
    expect(howMany()).toBe('3')

    press('One fewer')
    expect(howMany()).toBe('2')
  })
})

describe('EnquiryForm — the pinned Estimate', () => {
  it('starts from the first Size, one of it, and is labelled as a provisional Estimate', () => {
    renderForm()

    const panel = estimatePanel()

    expect(within(panel).getByText('Provisional')).toBeTruthy()
    expect(within(panel).getByText('Small × 1')).toBeTruthy()
    expect(within(panel).getByText('€45')).toBeTruthy()
  })

  it('carries a first Filling’s Surcharge from the start', () => {
    renderForm({ offer: { ...cheesecake, fillings: [...cheesecake.fillings].reverse() } })

    const panel = estimatePanel()

    expect(within(panel).getByText('Salted Caramel × 1')).toBeTruthy()
    expect(within(panel).getByText('€47.50')).toBeTruthy()
  })

  it('follows the Size, the quantity and a surcharging Filling, on every step', async () => {
    renderForm()

    fireEvent.click(screen.getByLabelText('Large'))
    press('One more')
    expect(within(estimatePanel()).getByText('Large × 2')).toBeTruthy()
    expect(within(estimatePanel()).getByText('€125')).toBeTruthy()

    await next()
    fireEvent.click(screen.getByLabelText(/Salted Caramel/))
    expect(within(estimatePanel()).getByText('Salted Caramel × 2')).toBeTruthy()
    expect(within(estimatePanel()).getByText('€130')).toBeTruthy()

    await next()
    expect(within(estimatePanel()).getByText('€130')).toBeTruthy()

    fireEvent.click(day('Saturday 26 September'))
    await next()
    expect(within(estimatePanel()).getByText('€130')).toBeTruthy()
  })

  it('never calls the figure a price, a total or a quote', () => {
    renderForm()

    expect(estimatePanel().textContent).not.toMatch(/price\b|total|quote/i)
  })
})

describe('EnquiryForm — Next checks the step it is on', () => {
  it('names a missing date, focuses the calendar and stays on the step', async () => {
    renderForm()

    await next()
    await next()
    await next()

    expect(sheetOn('When do you need it?')).toBeTruthy()
    expect(screen.getByText('Please choose a date.')).toBeTruthy()
    // The first day that can be chosen: the Lead time blocks the days before it.
    await waitFor(() => expect(document.activeElement).toBe(day('Thursday 24 September')))
  })

  it('names every problem on the last step before anything is sent, and focuses the first', async () => {
    const { submit } = renderForm()

    await chooseUpToYou()
    await send()

    expect(submit).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Your name').getAttribute('aria-invalid')).toBe('true')
    expect(screen.getAllByText('Please fill this in.')).toHaveLength(2)
    expect(document.activeElement).toBe(screen.getByLabelText('Your name'))
  })

  it('focuses the first field to fix, in the order they appear', async () => {
    renderForm()

    await chooseUpToYou()
    fillIn('Your name', 'Sanne de Vries')
    fillIn('Email', 'sanne@')
    await send()

    expect(document.activeElement).toBe(screen.getByLabelText('Email'))
    expect(screen.getByText('This does not look like an email address.')).toBeTruthy()
  })

  it('says nothing about a step before Next is pressed on it', async () => {
    renderForm()

    await chooseUpToYou()

    expect(screen.queryByText('Please fill this in.')).toBeNull()
  })
})

describe('EnquiryForm — the Requested pickup date', () => {
  it('blocks the days inside the Lead time, and says how early a pickup can be', async () => {
    renderForm()

    await next()
    await next()

    expect(screen.getByText('The earliest you can ask for is Thursday 24 September.')).toBeTruthy()
    expect(day('Monday 21 September').disabled).toBe(true)
    expect(day('Wednesday 23 September').disabled).toBe(true)
    expect(day('Thursday 24 September').disabled).toBe(false)
  })

  it('shows the Closed until notice, and blocks the days before it', async () => {
    renderForm({
      closedUntil: '2026-10-05T12:00:00.000Z',
      closedNotice: 'On holiday — back soon!',
    })

    await next()
    await next()

    expect(screen.getByText('On holiday — back soon!')).toBeTruthy()
    expect(screen.getByText('Jana is closed until Monday 5 October.')).toBeTruthy()
    // It opens on the month of the earliest day that can be asked for.
    expect(day('Sunday 4 October').disabled).toBe(true)
    expect(day('Monday 5 October').disabled).toBe(false)
  })

  it('pages between months, never back before the earliest', async () => {
    renderForm()

    await next()
    await next()

    press('Previous month')
    expect(screen.getByText('September 2026')).toBeTruthy()

    press('Next month')
    expect(screen.getByText('October 2026')).toBeTruthy()
    fireEvent.click(day('Friday 2 October'))

    press('Previous month')
    expect(screen.getByText('September 2026')).toBeTruthy()
  })

  it('shows no notice once the Closed until date has passed', async () => {
    renderForm({ closedUntil: '2026-09-01T12:00:00.000Z', closedNotice: 'On holiday' })

    await next()
    await next()

    expect(screen.queryByText('On holiday')).toBeNull()
  })
})

describe('EnquiryForm — sending', () => {
  it('sends the Enquiry for this Item, in this locale, as it always has', async () => {
    const { submit } = renderForm()

    await fillWhole()
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
  })

  it('confirms in the sheet, with when to expect a reply and a summary of what was asked', async () => {
    renderForm()

    await fillWhole()
    await send()

    const sheet = within(sheetOn('Sent to Jana'))

    expect(screen.queryByRole('list', { name: 'Steps' })).toBeNull()
    expect(sheet.getByText('Expect her reply within 3 days.')).toBeTruthy()
    expect(sheet.getByText(/by email to sanne@example.nl/)).toBeTruthy()
    expect(sheet.getByText('Reference K7MQ-3XTP')).toBeTruthy()

    const summary = within(sheet.getByRole('region', { name: 'What you sent' }))
    expect(summary.getByText('Burnt Basque Cheesecake')).toBeTruthy()
    expect(summary.getByText('Large × 2')).toBeTruthy()
    expect(summary.getByText('Red Velvet')).toBeTruthy()
    expect(summary.getByText('Salted Caramel')).toBeTruthy()
    expect(summary.getByText('Saturday 26 September')).toBeTruthy()

    const estimate = within(sheet.getByRole('region', { name: /Estimate/ }))
    expect(estimate.getByText('Provisional')).toBeTruthy()
    expect(estimate.getAllByText('€130')).toHaveLength(1)

    expect(sheet.getByRole('link', { name: 'Back to the cakes' }).getAttribute('href')).toBe(
      '/cakes',
    )
  })

  it('moves focus to the confirmation’s title, so it is announced', async () => {
    renderForm()

    await fillWhole()
    await send()

    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Sent to Jana' })),
    )
  })

  it('treats a problem no step can fix as a failure on our side', async () => {
    renderForm({
      submit: async () => ({ status: 'invalid', problems: { item: 'unknownChoice' } }),
    })

    await fillWhole()
    await send()

    expect(screen.getByRole('alert').textContent).toMatch('The problem is on our side')
    expect((screen.getByLabelText('Your name') as HTMLInputElement).value).toBe('Sanne de Vries')
  })

  it('confirms from what was chosen even when no receipt comes back', async () => {
    renderForm({ submit: async () => ({ status: 'accepted', receipt: null }) })

    await fillWhole()
    await send()

    const sheet = within(sheetOn('Sent to Jana'))
    expect(sheet.getByText('Expect her reply within 3 days.')).toBeTruthy()
    expect(
      within(sheet.getByRole('region', { name: 'What you sent' })).getByText('Large × 2'),
    ).toBeTruthy()
    expect(sheet.queryByText(/Reference/)).toBeNull()
  })

  it('opens the step that owns a problem the server names, with its message', async () => {
    renderForm({
      submit: async () => ({ status: 'invalid', problems: { requestedPickupDate: 'tooSoon' } }),
    })

    await fillWhole()
    await send()

    expect(sheetOn('When do you need it?')).toBeTruthy()
    expect(
      screen.getByText('That is too soon. The earliest is Thursday 24 September.'),
    ).toBeTruthy()
    await waitFor(() => expect(document.activeElement).toBe(day('Saturday 26 September')))
  })

  it('asks again for a choice the server could not match, as a choice', async () => {
    renderForm({
      submit: async () => ({ status: 'invalid', problems: { sponge: 'required' } }),
    })

    await fillWhole()
    await send()

    expect(sheetOn('Choose your flavours')).toBeTruthy()
    expect(screen.getByText('Please choose one of the options.')).toBeTruthy()
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Red Velvet')))
  })

  it('shows a problem the server names on the step it is on', async () => {
    renderForm({
      submit: async () => ({ status: 'invalid', problems: { email: 'invalidEmail' } }),
    })

    await fillWhole()
    await send()

    expect(sheetOn('Where should Jana reply?')).toBeTruthy()
    expect(screen.getByText('This does not look like an email address.')).toBeTruthy()
  })

  it('owns a failure on our side, keeps what was typed, and offers a direct route', async () => {
    renderForm({ submit: async () => ({ status: 'failed' }) })

    await fillWhole()
    await send()

    expect(sheetOn('Where should Jana reply?')).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toMatch('The problem is on our side')
    expect(
      screen.getByRole('link', { name: 'Or get in touch directly' }).getAttribute('href'),
    ).toBe('/contact')
    expect((screen.getByLabelText('Your name') as HTMLInputElement).value).toBe('Sanne de Vries')

    back()
    expect(day('Saturday 26 September').checked).toBe(true)
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

    await fillWhole()
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

    await fillWhole()
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

    await fillWhole()
    await attach(photoFile)
    await send()

    expect(screen.getByText('This photo is too large. Please choose a smaller one.')).toBeTruthy()
    expect(submit).not.toHaveBeenCalled()
  })

  it('lets a chosen photo be taken off again', async () => {
    const { submit } = renderForm({ downscale: async () => downscaled })

    await fillWhole()
    await attach(photoFile)
    press('Remove photo')
    await send()

    expect(submit).toHaveBeenCalledWith(expect.anything(), null)
  })

  it('shows the problem the server names for the photo', async () => {
    renderForm({
      downscale: async () => downscaled,
      submit: async () => ({ status: 'invalid', problems: { photo: 'notAnImage' } }),
    })

    await fillWhole()
    await attach(photoFile)
    await send()

    expect(
      screen.getByText('This does not look like a photo. Please choose a JPEG or PNG.'),
    ).toBeTruthy()
  })
})
