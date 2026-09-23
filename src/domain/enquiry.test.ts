import { describe, expect, it } from 'vitest'

import { itemOffer, validateEnquiry, type EnquiryRules, type ItemOffer } from './enquiry'
import { amsterdamArrival } from './pickup-date'

const cheesecake: ItemOffer = {
  id: 10,
  title: 'Burnt Basque Cheesecake',
  sizes: [
    { id: 'small', label: 'Small', price: 45 },
    { id: 'large', label: 'Large', price: 62.5 },
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

const rules: EnquiryRules = {
  // 21 September, 09:00 in Amsterdam: three days by 17:00 makes the 24th the earliest.
  pickup: {
    arrival: amsterdamArrival(new Date('2026-09-21T07:00:00Z')),
    leadTime: { days: 3, cutoff: { hour: 17, minute: 0 } },
    closedUntil: null,
  },
  item: cheesecake,
}

const itemEnquiry = {
  enquiryType: 'item',
  name: 'Sanne de Vries',
  email: 'sanne@example.nl',
  phone: '',
  size: 'large',
  quantity: '2',
  sponge: '3',
  filling: '2',
  requestedPickupDate: '2026-09-26',
  specialRequests: 'Happy 40th, Marco — in gold.',
}

const problemsOf = (raw: Record<string, unknown>, given: EnquiryRules = rules) => {
  const result = validateEnquiry(raw, given)

  return result.ok ? {} : result.problems
}

describe('validateEnquiry — from an Item page', () => {
  it('accepts a whole Enquiry and resolves its choices against the Item', () => {
    const result = validateEnquiry(itemEnquiry, rules)

    expect(result).toEqual({
      ok: true,
      enquiry: {
        enquiryType: 'item',
        contact: { name: 'Sanne de Vries', email: 'sanne@example.nl', phone: null },
        item: cheesecake,
        size: { id: 'large', label: 'Large', price: 62.5 },
        quantity: 2,
        sponge: { id: 3, name: 'Red Velvet' },
        filling: { id: 2, name: 'Salted Caramel', surcharge: 2.5 },
        requestedPickupDate: { year: 2026, month: 9, day: 26 },
        specialRequests: 'Happy 40th, Marco — in gold.',
      },
    })
  })

  it('trims what the customer typed, and treats blank optional fields as absent', () => {
    const result = validateEnquiry(
      { ...itemEnquiry, name: '  Sanne  ', phone: '   ', specialRequests: '  ' },
      rules,
    )

    expect(result.ok && result.enquiry.contact).toEqual({
      name: 'Sanne',
      email: 'sanne@example.nl',
      phone: null,
    })
    expect(
      result.ok && result.enquiry.enquiryType === 'item' && result.enquiry.specialRequests,
    ).toBe(null)
  })

  it('keeps an optional phone number when one is given', () => {
    const result = validateEnquiry({ ...itemEnquiry, phone: '06 1234 5678' }, rules)

    expect(result.ok && result.enquiry.contact.phone).toBe('06 1234 5678')
  })

  it('names every missing required field at once', () => {
    expect(problemsOf({ enquiryType: 'item' })).toEqual({
      name: 'required',
      email: 'required',
      size: 'required',
      quantity: 'required',
      sponge: 'required',
      filling: 'required',
      requestedPickupDate: 'required',
    })
  })

  it('rejects an email address that cannot be one', () => {
    expect(problemsOf({ ...itemEnquiry, email: 'sanne.example.nl' })).toEqual({
      email: 'invalidEmail',
    })
  })

  it.each(['0', '-1', '1.5', 'two', '51'])('rejects a quantity of %s', (quantity) => {
    expect(problemsOf({ ...itemEnquiry, quantity })).toEqual({ quantity: 'invalidQuantity' })
  })

  it('accepts a quantity sent as a number', () => {
    expect(validateEnquiry({ ...itemEnquiry, quantity: 3 }, rules).ok).toBe(true)
  })

  it('rejects a Size, Sponge or Filling this Item does not offer', () => {
    expect(problemsOf({ ...itemEnquiry, size: 'huge', sponge: '2', filling: '9' })).toEqual({
      size: 'unknownChoice',
      sponge: 'unknownChoice',
      filling: 'unknownChoice',
    })
  })

  it('asks for no Sponge or Filling on an Item that is not configurable, and ignores any sent', () => {
    const brownies = { ...cheesecake, configurable: false }
    const result = validateEnquiry(
      { ...itemEnquiry, sponge: '', filling: '99' },
      { ...rules, item: brownies },
    )

    expect(result.ok && result.enquiry.enquiryType === 'item' && result.enquiry.filling).toBe(null)
  })

  it('asks for no Sponge when the Item offers none', () => {
    expect(
      problemsOf(
        { ...itemEnquiry, sponge: '' },
        { ...rules, item: { ...cheesecake, sponges: [] } },
      ),
    ).toEqual({})
  })

  it('rejects the Enquiry when the Item itself is unknown', () => {
    expect(problemsOf(itemEnquiry, { ...rules, item: null })).toEqual({ item: 'unknownChoice' })
  })

  it('rejects a Requested pickup date that is not a date', () => {
    expect(problemsOf({ ...itemEnquiry, requestedPickupDate: '2026-02-30' })).toEqual({
      requestedPickupDate: 'invalidDate',
    })
  })

  it('rejects a Requested pickup date inside the Lead time', () => {
    expect(problemsOf({ ...itemEnquiry, requestedPickupDate: '2026-09-23' })).toEqual({
      requestedPickupDate: 'tooSoon',
    })
  })

  it('rejects a Requested pickup date before Closed until', () => {
    const closed = {
      ...rules,
      pickup: { ...rules.pickup, closedUntil: { year: 2026, month: 10, day: 5 } },
    }

    expect(problemsOf(itemEnquiry, closed)).toEqual({ requestedPickupDate: 'closed' })
  })

  it('caps free text rather than storing a novel', () => {
    expect(problemsOf({ ...itemEnquiry, specialRequests: 'x'.repeat(2001) })).toEqual({
      specialRequests: 'tooLong',
    })
    expect(problemsOf({ ...itemEnquiry, name: 'x'.repeat(201) })).toEqual({ name: 'tooLong' })
  })

  it('treats a value of the wrong type as missing rather than throwing', () => {
    expect(problemsOf({ ...itemEnquiry, name: 42, email: ['a@b.nl'] })).toEqual({
      name: 'required',
      email: 'required',
    })
  })
})

describe('validateEnquiry — Custom order', () => {
  const customOrder = {
    enquiryType: 'custom-order',
    name: 'Sanne de Vries',
    email: 'sanne@example.nl',
    requestedPickupDate: '2026-09-26',
    message: 'A three-tier cake shaped like a windmill.',
  }

  it('accepts a message and a Requested pickup date, with no Item', () => {
    expect(validateEnquiry(customOrder, { ...rules, item: null })).toEqual({
      ok: true,
      enquiry: {
        enquiryType: 'custom-order',
        contact: { name: 'Sanne de Vries', email: 'sanne@example.nl', phone: null },
        requestedPickupDate: { year: 2026, month: 9, day: 26 },
        message: 'A three-tier cake shaped like a windmill.',
      },
    })
  })

  it('requires the message and the date', () => {
    expect(problemsOf({ enquiryType: 'custom-order', name: 'S', email: 's@example.nl' })).toEqual({
      requestedPickupDate: 'required',
      message: 'required',
    })
  })

  it('holds the date to the site-wide Lead time and Closed until', () => {
    expect(problemsOf({ ...customOrder, requestedPickupDate: '2026-09-22' })).toEqual({
      requestedPickupDate: 'tooSoon',
    })
  })
})

describe('validateEnquiry — Contact', () => {
  it('needs a name, an email and a message, and nothing else', () => {
    expect(
      validateEnquiry(
        { enquiryType: 'contact', name: 'S', email: 's@example.nl', message: 'Parking?' },
        { ...rules, item: null },
      ),
    ).toEqual({
      ok: true,
      enquiry: {
        enquiryType: 'contact',
        contact: { name: 'S', email: 's@example.nl', phone: null },
        message: 'Parking?',
      },
    })

    expect(problemsOf({ enquiryType: 'contact' })).toEqual({
      name: 'required',
      email: 'required',
      message: 'required',
    })
  })
})

describe('validateEnquiry — the type itself', () => {
  it('rejects an Enquiry of no known type', () => {
    expect(problemsOf({ ...itemEnquiry, enquiryType: 'order' })).toEqual({
      enquiryType: 'unknownChoice',
    })
  })
})

describe('itemOffer', () => {
  const stamps = { createdAt: '', updatedAt: '' }
  const everySponge = [
    { id: 1, name: 'Chocolate', ...stamps },
    { id: 2, name: 'Vanilla', ...stamps },
  ]
  const everyFilling = [{ id: 7, name: 'Ganache', surcharge: 3, ...stamps }]

  it('offers the Item’s Sizes, keyed by their row ids, and only the names and figures', () => {
    // As Payload returns it: a Size carries more than the offer needs.
    const cheesecakeDocument = {
      id: 10,
      title: 'Cheesecake',
      sizes: [
        { id: 'abc', label: 'Small', price: 45, diameter: 15 },
        { id: null, label: 'Large', price: 62.5 },
      ],
      configurable: true,
      sponges: [everySponge[1]!],
      fillings: [],
    }

    const offer = itemOffer(cheesecakeDocument, everySponge, everyFilling)

    expect(offer).toEqual({
      id: 10,
      title: 'Cheesecake',
      // A row saved without an id falls back to its position, which is still unique.
      sizes: [
        { id: 'abc', label: 'Small', price: 45 },
        { id: '1', label: 'Large', price: 62.5 },
      ],
      configurable: true,
      sponges: [{ id: 2, name: 'Vanilla' }],
      // The Item names no Fillings, so every Filling is offered.
      fillings: [{ id: 7, name: 'Ganache', surcharge: 3 }],
    })
  })

  it('reads an Item’s own choices whether they arrive populated or as bare ids', () => {
    const offer = itemOffer(
      { id: 12, title: 'Layer cake', sizes: [], configurable: true, sponges: [2], fillings: [7] },
      everySponge,
      everyFilling,
    )

    expect(offer.sponges).toEqual([{ id: 2, name: 'Vanilla' }])
    expect(offer.fillings).toEqual([{ id: 7, name: 'Ganache', surcharge: 3 }])
  })

  it('offers no Sponge or Filling on an Item that is not configurable', () => {
    const offer = itemOffer(
      { id: 11, title: 'Brownies', sizes: [{ label: 'Box of 6', price: 12 }], configurable: false },
      everySponge,
      everyFilling,
    )

    expect(offer.sponges).toEqual([])
    expect(offer.fillings).toEqual([])
  })
})
