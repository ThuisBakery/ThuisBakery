import { describe, expect, it, vi } from 'vitest'

import type { ItemOffer } from './enquiry'
import {
  HONEYPOT_FIELD,
  httpReply,
  parseReceipt,
  submitEnquiry,
  type EnquiryContext,
  type SubmissionData,
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

const setup = (overrides: { load?: () => Promise<EnquiryContext> } = {}) => {
  const store = vi.fn(async (_: SubmissionData) => ({ id: 481 }))
  const load = vi.fn(overrides.load ?? (async () => context))

  return {
    store,
    load,
    submit: (raw: unknown) => submitEnquiry(raw, { now, load, store }),
  }
}

describe('submitEnquiry', () => {
  it('stores the Enquiry with its Estimate as a snapshot, and returns the receipt', async () => {
    const { submit, store, load } = setup()

    const outcome = await submit(enquiry)

    expect(load).toHaveBeenCalledWith({ item: 10, locale: 'nl' })
    expect(store).toHaveBeenCalledWith({
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
    } satisfies SubmissionData)

    expect(outcome).toEqual({
      status: 'accepted',
      receipt: {
        reference: 481,
        enquiryType: 'item',
        itemTitle: 'Burnt Basque Cheesecake',
        size: 'Large',
        quantity: 2,
        sponge: 'Red Velvet',
        filling: 'Salted Caramel',
        requestedPickupDate: '2026-09-26',
        specialRequests: 'Happy 40th, Marco',
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
    const { store, load } = setup()

    // 22:30 UTC on the 23rd is 00:30 on the 24th in Amsterdam: the 26th is now too soon.
    const late = await submitEnquiry(enquiry, {
      now: new Date('2026-09-23T22:30:00Z'),
      load,
      store,
    })

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
    const store = async () => {
      throw new Error('connection refused')
    }

    expect(await submitEnquiry(enquiry, { now, load: async () => context, store })).toEqual({
      status: 'failed',
      error: new Error('connection refused'),
    })
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

    await submit({
      enquiryType: 'contact',
      locale: 'en',
      name: 'Sanne',
      email: 'sanne@example.nl',
      message: 'Is there parking?',
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
    )
  })
})

describe('httpReply', () => {
  const receipt = {
    reference: 481,
    enquiryType: 'contact',
    itemTitle: null,
    size: null,
    quantity: null,
    sponge: null,
    filling: null,
    requestedPickupDate: null,
    specialRequests: null,
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
    reference: 481,
    enquiryType: 'item',
    itemTitle: 'Burnt Basque Cheesecake',
    size: 'Large',
    quantity: 2,
    sponge: null,
    filling: null,
    requestedPickupDate: '2026-09-26',
    specialRequests: null,
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
