import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { EnquiryReply, Receipt } from '@/domain/submit-enquiry'

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

const renderForm = (overrides: Partial<Parameters<typeof MessageForm>[0]> = {}) => {
  const submit = vi.fn(
    async (_: Record<string, unknown>, __: Blob | null): Promise<EnquiryReply> => ({
      status: 'accepted',
      receipt,
    }),
  )
  const onSent = vi.fn()

  render(
    <MessageForm
      locale="en"
      enquiryType="custom-order"
      leadTime={{ days: 3, timeOfDay: '17:00' }}
      closedUntil={null}
      closedNotice={null}
      contactHref="/contact"
      submit={submit}
      onSent={onSent}
      {...overrides}
    />,
  )

  return { submit, onSent }
}

const fillIn = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

const send = async (name = 'Send enquiry') => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }))
  })
}

describe('MessageForm — Custom order', () => {
  const fillWhole = () => {
    fillIn(/What you’re imagining/, 'A three-tier cake shaped like a tulip field.')
    fillIn(/Pickup date/, '2026-09-26')
    fillIn('Your name', 'Sanne de Vries')
    fillIn('Email', 'sanne@example.nl')
  }

  it('asks what the customer is imagining, with no Item and no Estimate', () => {
    renderForm()

    expect(screen.getByLabelText(/What you’re imagining/)).toBeTruthy()
    expect(screen.queryByRole('region', { name: /Estimate/ })).toBeNull()
    expect(screen.queryByLabelText('Size')).toBeNull()
    expect(screen.queryByLabelText('How many')).toBeNull()
  })

  it('sends a Custom order Enquiry in this locale, and hands on the receipt', async () => {
    const { submit, onSent } = renderForm()

    fillWhole()
    await send()

    expect(submit).toHaveBeenCalledWith(
      {
        enquiryType: 'custom-order',
        locale: 'en',
        message: 'A three-tier cake shaped like a tulip field.',
        requestedPickupDate: '2026-09-26',
        name: 'Sanne de Vries',
        email: 'sanne@example.nl',
        phone: '',
        website: '',
      },
      null,
    )
    expect(onSent).toHaveBeenCalledWith(receipt)
  })

  it('names every problem before anything is sent', async () => {
    const { submit } = renderForm()

    await send()

    expect(submit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toMatch('A few details need another look.')
    // The message, the date, the name and the email.
    expect(screen.getAllByText('Please fill this in.')).toHaveLength(4)
    expect(document.activeElement).toBe(screen.getByLabelText(/What you’re imagining/))
  })

  it('holds the Requested pickup date to the Lead time and Closed until', () => {
    renderForm({
      closedUntil: '2026-10-05T12:00:00.000Z',
      closedNotice: 'On holiday — back soon!',
    })

    expect(screen.getByText('On holiday — back soon!')).toBeTruthy()
    expect(screen.getByLabelText(/Pickup date/).getAttribute('min')).toBe('2026-10-05')

    fillIn(/Pickup date/, '2026-10-01')
    fireEvent.blur(screen.getByLabelText(/Pickup date/))

    expect(
      screen.getByText('Jana is closed until Monday 5 October. Choose that day or later.'),
    ).toBeTruthy()
  })

  it('rejects a date inside the Lead time', () => {
    renderForm()

    expect(screen.getByText('The earliest you can ask for is Thursday 24 September.')).toBeTruthy()

    fillIn(/Pickup date/, '2026-09-23')
    fireEvent.blur(screen.getByLabelText(/Pickup date/))

    expect(
      screen.getByText('That is too soon. The earliest is Thursday 24 September.'),
    ).toBeTruthy()
  })

  it('sends an Inspiration photo as downscaled in the browser', async () => {
    const photoFile = new File([new Uint8Array(8_000_000)], 'IMG_2041.HEIC', {
      type: 'image/heic',
    })
    const downscaled = new Blob([new Uint8Array(900_000)], { type: 'image/jpeg' })
    const downscale = vi.fn(async () => downscaled)
    const { submit } = renderForm({ downscale })

    fillWhole()
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Inspiration photo/), {
        target: { files: [photoFile] },
      })
    })
    await send()

    expect(downscale).toHaveBeenCalledWith(photoFile)
    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({ enquiryType: 'custom-order' }),
      downscaled,
    )
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

describe('MessageForm — Contact', () => {
  it('asks only for the question and how to reply: no date, no photo', () => {
    renderForm({ enquiryType: 'contact' })

    expect(screen.getByLabelText('Your question')).toBeTruthy()
    expect(screen.queryByLabelText(/Pickup date/)).toBeNull()
    expect(screen.queryByLabelText(/Inspiration photo/)).toBeNull()
  })

  it('sends a Contact Enquiry', async () => {
    const { submit } = renderForm({ enquiryType: 'contact', locale: 'nl' })

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

  it('shows the problems the server names', async () => {
    renderForm({
      enquiryType: 'contact',
      submit: async () => ({ status: 'invalid', problems: { email: 'invalidEmail' } }),
    })

    fillIn('Your question', 'Do you bake gluten-free?')
    fillIn('Your name', 'Sanne de Vries')
    fillIn('Email', 'sanne@example.nl')
    await send('Send message')

    expect(screen.getByText('This does not look like an email address.')).toBeTruthy()
  })
})
