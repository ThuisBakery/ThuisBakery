import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { EnquiryReply, Receipt } from '@/domain/submit-enquiry'

import { CustomOrderForm } from './CustomOrderForm'
import { MessageForm } from './MessageForm'

const receipt: Receipt = {
  reference: 'K7MQ-3XTP',
  enquiryType: 'custom-order',
  itemTitle: null,
  size: null,
  quantity: null,
  sponge: null,
  filling: null,
  requestedPickupDate: '2026-09-26',
  specialRequests: null,
  message: 'A three-tier cake shaped like a tulip field.',
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

const accepting = () =>
  vi.fn(async (_: Record<string, unknown>, __: Blob | null): Promise<EnquiryReply> => ({
    status: 'accepted',
    receipt,
  }))

const fillIn = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

const press = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))

const send = async (name = 'Send to Jana') => {
  await act(async () => {
    press(name)
  })
}

describe('The Custom order sheet', () => {
  const renderSheet = (overrides: Partial<Parameters<typeof CustomOrderForm>[0]> = {}) => {
    const submit = accepting()
    const onOpenChange = vi.fn()

    render(
      <CustomOrderForm
        locale="en"
        leadTime={{ days: 3, timeOfDay: '17:00' }}
        closedUntil={null}
        closedNotice={null}
        contactPath="/contact"
        open
        onOpenChange={onOpenChange}
        returnFocus={{ current: null }}
        submit={submit}
        {...overrides}
      />,
    )

    return { submit, onOpenChange }
  }

  const sheetOn = (title: string) => screen.getByRole('dialog', { name: title })

  const stepNames = () =>
    within(screen.getByRole('list', { name: 'Steps' }))
      .getAllByRole('listitem')
      .map((step) => step.textContent)

  const currentStep = () =>
    within(screen.getByRole('list', { name: 'Steps' }))
      .getAllByRole('listitem')
      .find((step) => step.getAttribute('aria-current') === 'step')?.textContent

  const next = async (name = 'Next') => {
    await act(async () => {
      press(name)
    })
  }

  const day = (name: string) => screen.getByRole('radio', { name }) as HTMLInputElement

  const howManyPeople = () =>
    within(screen.getByRole('group', { name: 'How many people?' })).getByRole('status').textContent

  const IDEA = 'A three-tier cake shaped like a tulip field.'

  /** Every step filled in as a customer would, arriving on You with it complete. */
  const fillWhole = async () => {
    fireEvent.click(screen.getByLabelText('Birthday'))
    fillIn('What do you have in mind?', IDEA)
    await next()
    fireEvent.click(day('Saturday 26 September'))
    press('More people')
    await next()
    await next()
    fillIn('Your name', 'Sanne de Vries')
    fillIn('Email', 'sanne@example.nl')
  }

  /** Idea and When filled in, arriving on Photo. */
  const upToPhoto = async () => {
    fillIn('What do you have in mind?', IDEA)
    await next()
    fireEvent.click(day('Saturday 26 September'))
    await next()
  }

  it('steps through Idea, When, Photo and You, with no Item and no Estimate', async () => {
    renderSheet()

    expect(stepNames()).toEqual(['Idea', 'When', 'Photo', 'You'])
    expect(within(sheetOn('Tell Jana your idea')).getByText('Something custom')).toBeTruthy()
    expect(currentStep()).toBe('Idea')
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull()
    expect(screen.queryByRole('region', { name: /Estimate/ })).toBeNull()

    fillIn('What do you have in mind?', IDEA)
    await next()
    expect(sheetOn('When, and for how many?')).toBeTruthy()
    expect(currentStep()).toBe('When')
    fireEvent.click(day('Saturday 26 September'))

    await next()
    expect(sheetOn('Got a picture?')).toBeTruthy()
    expect(screen.getByLabelText(/Inspiration photo/)).toBeTruthy()

    await next()
    expect(sheetOn('Where should Jana reply?')).toBeTruthy()
    expect(currentStep()).toBe('You')
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Send to Jana' })).toBeTruthy()
    expect(screen.queryByRole('region', { name: /Estimate/ })).toBeNull()
  })

  it('offers the Occasions as chips, none chosen to start with', () => {
    renderSheet()

    const occasions = within(screen.getByRole('group', { name: 'What is it for?' }))

    expect(occasions.getAllByRole('radio')).toHaveLength(5)
    for (const name of ['Birthday', 'Wedding', 'Baby shower', 'Just because', 'Something else']) {
      expect((occasions.getByLabelText(name) as HTMLInputElement).checked).toBe(false)
    }
  })

  it('asks for the idea in words before moving on, and focuses it', async () => {
    renderSheet()

    fireEvent.click(screen.getByLabelText('Wedding'))
    await next()

    expect(sheetOn('Tell Jana your idea')).toBeTruthy()
    expect(screen.getByText('Please fill this in.')).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByLabelText('What do you have in mind?'))
  })

  it('moves focus to the new step’s title, so it is announced', async () => {
    renderSheet()

    fillIn('What do you have in mind?', IDEA)
    await next()

    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('heading', { name: 'When, and for how many?' }),
      ),
    )
  })

  it('asks roughly how many people with a stepper, two at a time', async () => {
    renderSheet()

    fillIn('What do you have in mind?', IDEA)
    await next()

    expect(howManyPeople()).toBe('12')
    press('More people')
    press('More people')
    expect(howManyPeople()).toBe('16')
    press('Fewer people')
    expect(howManyPeople()).toBe('14')
    expect(screen.queryByRole('spinbutton')).toBeNull()
  })

  it('names a missing date on When and focuses the calendar', async () => {
    renderSheet()

    fillIn('What do you have in mind?', IDEA)
    await next()
    await next()

    expect(sheetOn('When, and for how many?')).toBeTruthy()
    expect(screen.getByText('Please choose a date.')).toBeTruthy()
    await waitFor(() => expect(document.activeElement).toBe(day('Thursday 24 September')))
  })

  it('holds the date to the Lead time: the days inside it cannot be chosen', async () => {
    renderSheet()

    fillIn('What do you have in mind?', IDEA)
    await next()

    expect(screen.getByText('The earliest you can ask for is Thursday 24 September.')).toBeTruthy()
    expect(day('Wednesday 23 September').disabled).toBe(true)
    expect(day('Thursday 24 September').disabled).toBe(false)
  })

  it('holds the date to Closed until, with Jana’s notice', async () => {
    renderSheet({
      closedUntil: '2026-10-05T12:00:00.000Z',
      closedNotice: 'On holiday — back soon!',
    })

    fillIn('What do you have in mind?', IDEA)
    await next()

    expect(screen.getByText('On holiday — back soon!')).toBeTruthy()
    expect(screen.getByText('Jana is closed until Monday 5 October.')).toBeTruthy()
    expect(day('Monday 5 October').disabled).toBe(false)
  })

  it('keeps everything going Back', async () => {
    renderSheet()

    await fillWhole()
    press('Back')
    press('Back')

    expect(sheetOn('When, and for how many?')).toBeTruthy()
    expect(day('Saturday 26 September').checked).toBe(true)
    expect(howManyPeople()).toBe('14')

    press('Back')
    expect((screen.getByLabelText('Birthday') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByLabelText('What do you have in mind?') as HTMLTextAreaElement).value).toBe(
      IDEA,
    )
  })

  it('sends a Custom order Enquiry, with the Occasion and how many people in its message', async () => {
    const { submit } = renderSheet()

    await fillWhole()
    await send()

    expect(submit).toHaveBeenCalledWith(
      {
        enquiryType: 'custom-order',
        locale: 'en',
        message: `For: Birthday\nAbout 14 people\n\n${IDEA}`,
        requestedPickupDate: '2026-09-26',
        name: 'Sanne de Vries',
        email: 'sanne@example.nl',
        phone: '',
        website: '',
      },
      null,
    )
  })

  it('writes the message in the customer’s language', async () => {
    const { submit } = renderSheet({ locale: 'nl' })

    fireEvent.click(screen.getByLabelText('Bruiloft'))
    fillIn('Wat heb je in gedachten?', 'Drie lagen, wit.')
    await next('Volgende')
    fireEvent.click(day('zaterdag 26 september'))
    await next('Volgende')
    await next('Volgende')
    fillIn('Je naam', 'Sanne de Vries')
    fillIn('E-mail', 'sanne@example.nl')
    await send('Stuur naar Jana')

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'nl',
        message: 'Voor: Bruiloft\nOngeveer 12 personen\n\nDrie lagen, wit.',
      }),
      null,
    )
  })

  it('names every problem on You before anything is sent, and focuses the first', async () => {
    const { submit } = renderSheet()

    await upToPhoto()
    await next()
    await send()

    expect(submit).not.toHaveBeenCalled()
    expect(screen.getAllByText('Please fill this in.')).toHaveLength(2)
    expect(document.activeElement).toBe(screen.getByLabelText('Your name'))
  })

  it('confirms in the sheet, with when to expect a reply and what was asked', async () => {
    const { onOpenChange } = renderSheet()

    await fillWhole()
    await send()

    const sheet = within(sheetOn('Sent to Jana'))

    expect(screen.queryByRole('list', { name: 'Steps' })).toBeNull()
    expect(sheet.getByText('Expect her reply within 3 days.')).toBeTruthy()
    expect(sheet.getByText(/by email to sanne@example.nl/)).toBeTruthy()
    expect(sheet.getByText('Reference K7MQ-3XTP')).toBeTruthy()

    const summary = within(sheet.getByRole('region', { name: 'What you sent' }))
    expect(summary.getByText('Birthday')).toBeTruthy()
    expect(summary.getByText('About 14 people')).toBeTruthy()
    expect(summary.getByText('Saturday 26 September')).toBeTruthy()
    expect(summary.getByText(IDEA)).toBeTruthy()
    expect(sheet.queryByRole('region', { name: /Estimate/ })).toBeNull()

    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Sent to Jana' })),
    )

    press('Done')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('opens the step that owns a problem the server names', async () => {
    renderSheet({
      submit: async () => ({ status: 'invalid', problems: { requestedPickupDate: 'tooSoon' } }),
    })

    await fillWhole()
    await send()

    expect(sheetOn('When, and for how many?')).toBeTruthy()
    expect(
      screen.getByText('That is too soon. The earliest is Thursday 24 September.'),
    ).toBeTruthy()
  })

  it('owns a failure on our side, keeps what was typed, and offers a direct route', async () => {
    renderSheet({ submit: async () => ({ status: 'failed' }) })

    await fillWhole()
    await send()

    expect(screen.getByRole('alert').textContent).toMatch('The problem is on our side')
    expect(
      screen.getByRole('link', { name: 'Or get in touch directly' }).getAttribute('href'),
    ).toBe('/contact')
    expect((screen.getByLabelText('Your name') as HTMLInputElement).value).toBe('Sanne de Vries')
  })

  it('sends an Inspiration photo as downscaled in the browser', async () => {
    const photoFile = new File([new Uint8Array(8_000_000)], 'IMG_2041.HEIC', {
      type: 'image/heic',
    })
    const downscaled = new Blob([new Uint8Array(900_000)], { type: 'image/jpeg' })
    const downscale = vi.fn(async () => downscaled)
    const { submit } = renderSheet({ downscale })

    await upToPhoto()
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Inspiration photo/), {
        target: { files: [photoFile] },
      })
    })
    await next()
    fillIn('Your name', 'Sanne de Vries')
    fillIn('Email', 'sanne@example.nl')
    await send()

    expect(downscale).toHaveBeenCalledWith(photoFile)
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ enquiryType: 'custom-order' }),
      downscaled,
    )
  })

  it('stops on Photo when the chosen file cannot be read as one', async () => {
    renderSheet({
      downscale: async () => {
        throw new Error('The source image could not be decoded.')
      },
    })

    await upToPhoto()
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Inspiration photo/), {
        target: { files: [new File(['x'], 'notes.txt', { type: 'text/plain' })] },
      })
    })
    await next()

    expect(sheetOn('Got a picture?')).toBeTruthy()
    expect(
      screen.getByText('This does not look like a photo. Please choose a JPEG or PNG.'),
    ).toBeTruthy()
  })

  it('carries a honeypot no person sees', () => {
    renderSheet()

    const honeypot = document.querySelector('input[name="website"]')

    expect(honeypot?.getAttribute('tabindex')).toBe('-1')
    expect(honeypot?.closest('[aria-hidden="true"]')).toBeTruthy()
  })
})

describe('MessageForm — Contact', () => {
  const renderContact = (overrides: Partial<Parameters<typeof MessageForm>[0]> = {}) => {
    const submit = accepting()
    const onSent = vi.fn()

    render(
      <MessageForm
        locale="en"
        contactHref="/contact"
        submit={submit}
        onSent={onSent}
        {...overrides}
      />,
    )

    return { submit, onSent }
  }

  it('asks only for the question and how to reply: no date, no photo', () => {
    renderContact()

    expect(screen.getByLabelText('Your question')).toBeTruthy()
    expect(screen.queryByLabelText(/Pickup date/)).toBeNull()
    expect(screen.queryByLabelText(/Inspiration photo/)).toBeNull()
  })

  it('sends a Contact Enquiry', async () => {
    const { submit } = renderContact({ locale: 'nl' })

    fillIn('Je vraag', 'Maken jullie ook glutenvrij?')
    fillIn('Je naam', 'Sanne de Vries')
    fillIn('E-mail', 'sanne@example.nl')
    fillIn('Telefoon (optioneel)', '06 12345678')
    await send('Verstuur je bericht')

    expect(submit).toHaveBeenCalledWith(
      {
        enquiryType: 'contact',
        locale: 'nl',
        message: 'Maken jullie ook glutenvrij?',
        name: 'Sanne de Vries',
        email: 'sanne@example.nl',
        phone: '06 12345678',
        website: '',
      },
      null,
    )
  })

  it('names every problem before anything is sent', async () => {
    const { submit } = renderContact()

    await send('Send message')

    expect(submit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toMatch('A few details need another look.')
    expect(screen.getAllByText('Please fill this in.')).toHaveLength(3)
    expect(document.activeElement).toBe(screen.getByLabelText('Your question'))
  })

  it('shows the problems the server names', async () => {
    renderContact({
      submit: async () => ({ status: 'invalid', problems: { email: 'invalidEmail' } }),
    })

    fillIn('Your question', 'Do you bake gluten-free?')
    fillIn('Your name', 'Sanne de Vries')
    fillIn('Email', 'sanne@example.nl')
    await send('Send message')

    expect(screen.getByText('This does not look like an email address.')).toBeTruthy()
  })

  it('owns a failure on our side, keeps what was typed, and offers a direct route', async () => {
    const { onSent } = renderContact({ submit: async () => ({ status: 'failed' }) })

    fillIn('Your question', 'Do you bake gluten-free?')
    fillIn('Your name', 'Sanne de Vries')
    fillIn('Email', 'sanne@example.nl')
    await send('Send message')

    expect(onSent).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toMatch('The problem is on our side')
    expect(
      screen.getByRole('link', { name: 'Or get in touch directly' }).getAttribute('href'),
    ).toBe('/contact')
    expect((screen.getByLabelText('Your name') as HTMLInputElement).value).toBe('Sanne de Vries')
  })

  it('carries a honeypot no person sees', () => {
    renderContact()

    const honeypot = document.querySelector('input[name="website"]')

    expect(honeypot?.getAttribute('tabindex')).toBe('-1')
    expect(honeypot?.closest('[aria-hidden="true"]')).toBeTruthy()
  })
})
