import { describe, expect, it, vi } from 'vitest'

import type { ItemOffer } from './enquiry'
import type { EnquiryEmail } from './enquiry-email'
import {
  HONEYPOT_FIELD,
  httpReply,
  parseReceipt,
  submitEnquiry,
  type EnquiryContext,
  type SubmissionData,
  type SubmitDependencies,
} from './submit-enquiry'

const cheesecake: ItemOffer = {
  id: 10,
  title: 'Burnt Basque Cheesecake',
  sizes: [{ id: 'large', label: 'Large', price: 62.5 }],
  configurable: true,
  sponges: [{ id: 3, name: 'Red Velvet' }],
  fillings: [{ id: 2, name: 'Salted Caramel', surcharge: 2.5 }],
}

const context: EnquiryContext = {
  item: cheesecake,
  leadTime: { days: 3, cutoff: { hour: 17, minute: 0 } },
  closedUntil: null,
}

const enquiry = {
  enquiryType: 'item',
  locale: 'nl',
  item: 10,
  name: 'Sanne de Vries',
  email: 'sanne@example.nl',
  size: 'large',
  quantity: '2',
  sponge: '3',
  filling: '2',
  requestedPickupDate: '2026-09-26',
  specialRequests: 'Happy 40th, Marco',
  [HONEYPOT_FIELD]: '',
}

// 21 September, 09:00 in Amsterdam.
const now = new Date('2026-09-21T07:00:00Z')

const reference = () => 'K7MQ-3XTP'

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
const REENCODED = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43])

type Overrides = Partial<
  Pick<SubmitDependencies, 'load' | 'isBot' | 'reencode' | 'store' | 'send' | 'recordDelivery'>
>

const setup = (overrides: Overrides = {}) => {
  const deps = {
    now,
    reference,
    jana: 'jana@thuisbakery.com',
    isBot: vi.fn(overrides.isBot ?? (async () => false)),
    load: vi.fn(overrides.load ?? (async () => context)),
    reencode: vi.fn(overrides.reencode ?? (async () => REENCODED)),
    store: vi.fn(overrides.store ?? (async () => {})),
    send: vi.fn(overrides.send ?? (async (email: EnquiryEmail) => `id-for-${email.to}`)),
    recordDelivery: vi.fn(overrides.recordDelivery ?? (async () => {})),
    report: vi.fn(),
  } satisfies SubmitDependencies

  return {
    ...deps,
    submit: (body: unknown, photo: Uint8Array | null = null) =>
      submitEnquiry({ body, photo }, deps),
  }
}

describe('submitEnquiry', () => {
  it('stores the Enquiry with its Estimate as a snapshot, and returns the receipt', async () => {
    const { submit, store, load } = setup()

    const outcome = await submit(enquiry)

    expect(load).toHaveBeenCalledWith({ item: 10, locale: 'nl' })
    expect(store).toHaveBeenCalledWith(
      {
        reference: 'K7MQ-3XTP',
        enquiryType: 'item',
        locale: 'nl',
        name: 'Sanne de Vries',
        email: 'sanne@example.nl',
        phone: null,
        item: 10,
        itemTitle: 'Burnt Basque Cheesecake',
        size: 'Large',
        quantity: 2,
        sponge: 'Red Velvet',
        filling: 'Salted Caramel',
        requestedPickupDate: '2026-09-26T12:00:00.000Z',
        specialRequests: 'Happy 40th, Marco',
        message: null,
        estimate: {
          lines: [
            { label: 'Large', unitAmount: 62.5, quantity: 2, amount: 125 },
            { label: 'Salted Caramel', unitAmount: 2.5, quantity: 2, amount: 5 },
          ],
          total: 130,
          currency: 'EUR',
          provisional: true,
        },
      } satisfies SubmissionData,
      null,
    )

    expect(outcome).toEqual({
      status: 'accepted',
      receipt: {
        reference: 'K7MQ-3XTP',
        enquiryType: 'item',
        itemTitle: 'Burnt Basque Cheesecake',
        size: 'Large',
        quantity: 2,
        sponge: 'Red Velvet',
        filling: 'Salted Caramel',
        requestedPickupDate: '2026-09-26',
        specialRequests: 'Happy 40th, Marco',
        message: null,
        estimate: expect.objectContaining({ total: 130, provisional: true }),
        leadTimeDays: 3,
      },
    })
  })

  it('prices from the Item as stored, never from figures the browser sends', async () => {
    const { submit, store } = setup()

    await submit({ ...enquiry, estimate: { total: 1, lines: [] }, price: 1 })

    expect(store.mock.calls[0]?.[0].estimate?.total).toBe(130)
  })

  it('stores nothing and pretends to accept when the honeypot is filled', async () => {
    const { submit, store, load } = setup()

    expect(await submit({ ...enquiry, [HONEYPOT_FIELD]: 'https://spam.example' })).toEqual({
      status: 'ignored',
    })
    expect(load).not.toHaveBeenCalled()
    expect(store).not.toHaveBeenCalled()
  })

  it('stores nothing and names the problems when the Enquiry is invalid', async () => {
    const { submit, store } = setup()

    expect(await submit({ ...enquiry, email: '', requestedPickupDate: '2026-09-22' })).toEqual({
      status: 'invalid',
      problems: { email: 'required', requestedPickupDate: 'tooSoon' },
    })
    expect(store).not.toHaveBeenCalled()
  })

  it('judges the Lead time from the moment of arrival in Amsterdam', async () => {
    const deps = setup()

    // 22:30 UTC on the 23rd is 00:30 on the 24th in Amsterdam: the 26th is now too soon.
    const late = await submitEnquiry(
      { body: enquiry, photo: null },
      { ...deps, now: new Date('2026-09-23T22:30:00Z') },
    )

    expect(late).toEqual({ status: 'invalid', problems: { requestedPickupDate: 'tooSoon' } })
  })

  it('rejects a body that is not an Enquiry at all', async () => {
    const { submit, store } = setup()

    for (const body of [null, 'hello', [enquiry], 42]) {
      expect(await submit(body)).toEqual({
        status: 'invalid',
        problems: { enquiryType: 'unknownChoice' },
      })
    }

    expect(store).not.toHaveBeenCalled()
  })

  it('stores an unknown locale as English, the site’s default', async () => {
    const { submit, store } = setup()

    await submit({ ...enquiry, locale: 'de' })

    expect(store.mock.calls[0]?.[0].locale).toBe('en')
  })

  it('tells the customer it failed when the Submission cannot be stored', async () => {
    const { submit, send } = setup({
      store: async () => {
        throw new Error('connection refused')
      },
    })

    expect(await submit(enquiry)).toEqual({
      status: 'failed',
      error: new Error('connection refused'),
    })
    expect(send).not.toHaveBeenCalled()
  })

  it('tells the customer it failed when the Item cannot be read', async () => {
    const { submit, store } = setup({
      load: async () => {
        throw new Error('connection refused')
      },
    })

    expect(await submit(enquiry)).toEqual({
      status: 'failed',
      error: new Error('connection refused'),
    })
    expect(store).not.toHaveBeenCalled()
  })

  it('stores a Contact Enquiry with no Item and no Estimate', async () => {
    const { submit, store, load } = setup({
      load: async () => ({ ...context, item: null }),
    })

    const outcome = await submit({
      enquiryType: 'contact',
      locale: 'en',
      name: 'Sanne',
      email: 'sanne@example.nl',
      message: 'Is there parking?',
    })

    // What they wrote is on their receipt: it is all a Contact Enquiry sends.
    expect(outcome).toEqual({
      status: 'accepted',
      receipt: expect.objectContaining({ enquiryType: 'contact', message: 'Is there parking?' }),
    })
    expect(load).toHaveBeenCalledWith({ item: null, locale: 'en' })
    expect(store).toHaveBeenCalledWith(
      expect.objectContaining({
        enquiryType: 'contact',
        item: null,
        estimate: null,
        requestedPickupDate: null,
        message: 'Is there parking?',
      }),
      null,
    )
  })

  describe('delivery', () => {
    it('emails Jana and the customer, each answerable straight to the other', async () => {
      const { submit, send } = setup()

      await submit(enquiry)

      expect(send).toHaveBeenCalledTimes(2)
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'jana@thuisbakery.com', replyTo: 'sanne@example.nl' }),
      )
      expect(send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'sanne@example.nl', replyTo: 'jana@thuisbakery.com' }),
      )
    })

    it('sends only after the Submission is stored', async () => {
      const { submit, store, send } = setup()

      await submit(enquiry)

      expect(store.mock.invocationCallOrder[0]).toBeLessThan(
        Math.min(...send.mock.invocationCallOrder),
      )
    })

    it('records each email as sent, with the id its webhook will name it by', async () => {
      const { submit, recordDelivery } = setup()

      await submit(enquiry)

      expect(recordDelivery).toHaveBeenCalledWith('K7MQ-3XTP', {
        toJana: { status: 'sent', emailId: 'id-for-jana@thuisbakery.com' },
        toCustomer: { status: 'sent', emailId: 'id-for-sanne@example.nl' },
      })
    })

    it('still tells the customer it worked when the email provider fails', async () => {
      const { submit, recordDelivery, report } = setup({
        send: async () => {
          throw new Error('Error sending email: 429 daily_quota_exceeded')
        },
      })

      const outcome = await submit(enquiry)

      expect(outcome).toEqual(expect.objectContaining({ status: 'accepted' }))
      expect(httpReply(outcome).status).toBe(201)
      expect(recordDelivery).toHaveBeenCalledWith('K7MQ-3XTP', {
        toJana: { status: 'not-sent', emailId: null },
        toCustomer: { status: 'not-sent', emailId: null },
      })
      expect(report).toHaveBeenCalledWith(
        expect.any(String),
        new Error('Error sending email: 429 daily_quota_exceeded'),
      )
    })

    it('sends the other email when only one fails', async () => {
      const { submit, recordDelivery } = setup({
        send: async (email) => {
          if (email.to === 'sanne@example.nl') {
            throw new Error('invalid recipient')
          }

          return 'jana-email'
        },
      })

      await submit(enquiry)

      expect(recordDelivery).toHaveBeenCalledWith('K7MQ-3XTP', {
        toJana: { status: 'sent', emailId: 'jana-email' },
        toCustomer: { status: 'not-sent', emailId: null },
      })
    })

    it('still tells the customer it worked when the Delivery status cannot be written', async () => {
      const { submit, report } = setup({
        recordDelivery: async () => {
          throw new Error('connection reset')
        },
      })

      expect(await submit(enquiry)).toEqual(expect.objectContaining({ status: 'accepted' }))
      expect(report).toHaveBeenCalledWith(expect.any(String), new Error('connection reset'))
    })

    it('sends nothing for a bot caught by the honeypot', async () => {
      const { submit, send } = setup()

      await submit({ ...enquiry, [HONEYPOT_FIELD]: 'https://spam.example' })

      expect(send).not.toHaveBeenCalled()
    })

    it('sends nothing for an invalid Enquiry', async () => {
      const { submit, send } = setup()

      await submit({ ...enquiry, email: '' })

      expect(send).not.toHaveBeenCalled()
    })
  })

  describe('bot check', () => {
    it('stores and sends nothing when BotID says it is a bot', async () => {
      const { submit, load, store, send } = setup({ isBot: async () => true })

      const outcome = await submit(enquiry)

      expect(outcome).toEqual({ status: 'refused' })
      expect(load).not.toHaveBeenCalled()
      expect(store).not.toHaveBeenCalled()
      expect(send).not.toHaveBeenCalled()
    })

    it('refuses a bot openly, so a person misjudged as one is told and can get in touch', () => {
      expect(httpReply({ status: 'refused' })).toEqual({ status: 403, body: { status: 'failed' } })
    })

    it('lets the Enquiry through when the bot check itself fails, and says so', async () => {
      const { submit, store, report } = setup({
        isBot: async () => {
          throw new Error('BotID unavailable')
        },
      })

      expect(await submit(enquiry)).toEqual(expect.objectContaining({ status: 'accepted' }))
      expect(store).toHaveBeenCalled()
      expect(report).toHaveBeenCalledWith(expect.any(String), new Error('BotID unavailable'))
    })
  })

  describe('Inspiration photo', () => {
    it('keeps no photo on a Contact Enquiry, whose form offers none', async () => {
      const { submit, reencode, store } = setup({
        load: async () => ({ ...context, item: null }),
      })

      await submit(
        {
          enquiryType: 'contact',
          locale: 'en',
          name: 'Sanne',
          email: 'sanne@example.nl',
          message: 'Is there parking?',
        },
        JPEG,
      )

      expect(reencode).not.toHaveBeenCalled()
      expect(store).toHaveBeenCalledWith(expect.objectContaining({ enquiryType: 'contact' }), null)
    })

    it('stores the re-encoded photo, never the bytes that were sent', async () => {
      const { submit, reencode, store } = setup()

      await submit(enquiry, JPEG)

      expect(reencode).toHaveBeenCalledWith(JPEG)
      expect(store).toHaveBeenCalledWith(
        expect.objectContaining({ reference: 'K7MQ-3XTP' }),
        REENCODED,
      )
    })

    it('judges a photo by its bytes, and rejects what is not an image', async () => {
      const { submit, reencode, store } = setup()

      const outcome = await submit(enquiry, new TextEncoder().encode('<!doctype html>'))

      expect(outcome).toEqual({ status: 'invalid', problems: { photo: 'notAnImage' } })
      expect(reencode).not.toHaveBeenCalled()
      expect(store).not.toHaveBeenCalled()
    })

    it('reports a photo problem alongside the form’s own', async () => {
      const { submit } = setup()

      expect(await submit({ ...enquiry, email: '' }, new Uint8Array(10))).toEqual({
        status: 'invalid',
        problems: { email: 'required', photo: 'notAnImage' },
      })
    })

    it('rejects a photo over 5 MB', async () => {
      const { submit, store } = setup()
      const large = new Uint8Array(5 * 1024 * 1024 + 1)
      large.set(JPEG)

      expect(await submit(enquiry, large)).toEqual({
        status: 'invalid',
        problems: { photo: 'tooLarge' },
      })
      expect(store).not.toHaveBeenCalled()
    })

    it('rejects a photo that looks like an image but will not decode', async () => {
      const { submit, store } = setup({
        reencode: async () => {
          throw new Error('Input buffer contains unsupported image format')
        },
      })

      expect(await submit(enquiry, JPEG)).toEqual({
        status: 'invalid',
        problems: { photo: 'notAnImage' },
      })
      expect(store).not.toHaveBeenCalled()
    })

    it('stores no photo when none was attached', async () => {
      const { submit, reencode, store } = setup()

      await submit(enquiry)

      expect(reencode).not.toHaveBeenCalled()
      expect(store).toHaveBeenCalledWith(expect.anything(), null)
    })
  })
})

describe('httpReply', () => {
  const receipt = {
    reference: 'K7MQ-3XTP',
    enquiryType: 'contact',
    itemTitle: null,
    size: null,
    quantity: null,
    sponge: null,
    filling: null,
    requestedPickupDate: null,
    specialRequests: null,
    message: null,
    estimate: null,
    leadTimeDays: null,
  } as const

  it('answers an accepted Enquiry with 201 and its receipt', () => {
    expect(httpReply({ status: 'accepted', receipt })).toEqual({
      status: 201,
      body: { status: 'accepted', receipt },
    })
  })

  it('answers a bot exactly as it would a customer, minus a receipt it could learn from', () => {
    expect(httpReply({ status: 'ignored' })).toEqual({
      status: 201,
      body: { status: 'accepted', receipt: null },
    })
  })

  it('answers an invalid Enquiry with 422 and the problems', () => {
    expect(httpReply({ status: 'invalid', problems: { email: 'required' } })).toEqual({
      status: 422,
      body: { status: 'invalid', problems: { email: 'required' } },
    })
  })

  it('answers our own failure with 500, and never passes the error on to the customer', () => {
    expect(httpReply({ status: 'failed', error: new Error('password in a stack') })).toEqual({
      status: 500,
      body: { status: 'failed' },
    })
  })
})

describe('parseReceipt', () => {
  const receipt = {
    reference: 'K7MQ-3XTP',
    enquiryType: 'item',
    itemTitle: 'Burnt Basque Cheesecake',
    size: 'Large',
    quantity: 2,
    sponge: null,
    filling: null,
    requestedPickupDate: '2026-09-26',
    specialRequests: null,
    message: null,
    estimate: {
      lines: [{ label: 'Large', unitAmount: 62.5, quantity: 2, amount: 125 }],
      total: 125,
      currency: 'EUR',
      provisional: true,
    },
    leadTimeDays: 3,
  }

  it('reads back a receipt the form kept', () => {
    expect(parseReceipt(JSON.stringify(receipt))).toEqual(receipt)
  })

  it.each([
    ['nothing kept', null],
    ['not JSON', '{'],
    ['not a receipt', JSON.stringify({ hello: 'world' })],
    [
      'an Estimate that is not provisional',
      JSON.stringify({ ...receipt, estimate: { ...receipt.estimate, provisional: false } }),
    ],
  ])('is null for %s', (_, value) => {
    expect(parseReceipt(value)).toBeNull()
  })
})
