import { describe, expect, it } from 'vitest'

import { enquiryEmails, textToHtml, type EmailContext } from './enquiry-email'
import type { SubmissionData } from './submit-enquiry'

const submission: SubmissionData = {
  reference: 'K7MQ-3XTP',
  enquiryType: 'item',
  locale: 'nl',
  name: 'Sanne de Vries',
  email: 'sanne@example.nl',
  phone: '06 1234 5678',
  item: 10,
  itemTitle: 'Burnt Basque Cheesecake',
  size: 'Groot',
  quantity: 2,
  sponge: 'Red Velvet',
  filling: 'Gezouten karamel',
  requestedPickupDate: '2026-09-26T12:00:00.000Z',
  specialRequests: 'Gefeliciteerd Marco!\nIn roze letters, graag.',
  message: null,
  estimate: {
    lines: [
      { label: 'Groot', unitAmount: 62.5, quantity: 2, amount: 125 },
      { label: 'Gezouten karamel', unitAmount: 2.5, quantity: 2, amount: 5 },
    ],
    total: 130,
    currency: 'EUR',
    provisional: true,
  },
}

const context: EmailContext = {
  jana: 'jana@thuisbakery.com',
  leadTimeDays: 3,
  hasPhoto: false,
  today: { year: 2026, month: 9, day: 21 },
}

describe('enquiryEmails', () => {
  it('sends Jana’s copy to Jana, answerable straight to the customer', () => {
    const { toJana } = enquiryEmails(submission, context)

    expect(toJana.to).toBe('jana@thuisbakery.com')
    expect(toJana.replyTo).toBe('sanne@example.nl')
  })

  it('sends the acknowledgement to the customer, answerable straight to Jana', () => {
    const { toCustomer } = enquiryEmails(submission, context)

    expect(toCustomer.to).toBe('sanne@example.nl')
    expect(toCustomer.replyTo).toBe('jana@thuisbakery.com')
  })

  it('writes Jana’s copy in English, whatever language the customer wrote in', () => {
    const { toJana } = enquiryEmails(submission, context)

    expect(toJana.subject).toBe(
      'Enquiry K7MQ-3XTP: Burnt Basque Cheesecake for Saturday 26 September, from Sanne de Vries',
    )
    expect(toJana.text).toContain('Written in Dutch: reply in Dutch.')
    expect(toJana.text).toContain('Size: Groot')
    expect(toJana.text).toContain('How many: 2')
    expect(toJana.text).toContain('Requested pickup date: Saturday 26 September')
    expect(toJana.text).toContain('Phone: 06 1234 5678')
  })

  it('writes the acknowledgement in the customer’s own language', () => {
    const { toCustomer } = enquiryEmails(submission, context)

    expect(toCustomer.subject).toBe('Je vraag aan ThuisBakery (K7MQ-3XTP)')
    expect(toCustomer.text).toContain('Hallo Sanne de Vries,')
    expect(toCustomer.text).toContain('Je hoort binnen 3 dagen van haar.')
    expect(toCustomer.text).toContain('Gevraagde ophaaldatum: zaterdag 26 september')

    const english = enquiryEmails({ ...submission, locale: 'en' }, context).toCustomer

    expect(english.subject).toBe('Your enquiry to ThuisBakery (K7MQ-3XTP)')
    expect(english.text).toContain('Expect her reply within 3 days.')
  })

  it('passes the customer’s own words through verbatim in both, never translated', () => {
    const { toJana, toCustomer } = enquiryEmails(submission, context)

    for (const email of [toJana, toCustomer]) {
      expect(email.text).toContain('Gefeliciteerd Marco!\nIn roze letters, graag.')
    }
  })

  it('shows both the Estimate as the customer saw it, labelled provisional', () => {
    const { toJana, toCustomer } = enquiryEmails(submission, context)

    expect(toJana.text).toContain('Estimate (provisional, as the customer saw it): €130')
    expect(toJana.text).toContain('Groot × 2: €125')
    expect(toJana.text).toContain('Gezouten karamel × 2: €5')
    expect(toCustomer.text).toContain('Indicatie (voorlopig): €130')
  })

  it('tells Jana there is an Inspiration photo, but never attaches it', () => {
    const { toJana, toCustomer } = enquiryEmails(submission, { ...context, hasPhoto: true })

    expect(toJana.text).toContain(
      'There is an Inspiration photo: open Submission K7MQ-3XTP in the admin to see it.',
    )
    expect(toJana).not.toHaveProperty('attachments')
    expect(toCustomer.text).not.toContain('Inspiration photo')
  })

  it('says nothing of a photo when there is none', () => {
    expect(enquiryEmails(submission, context).toJana.text).not.toContain('Inspiration photo')
  })

  it('names a Contact message for what it is, with no Item and no date', () => {
    const { toJana, toCustomer } = enquiryEmails(
      {
        ...submission,
        enquiryType: 'contact',
        locale: 'en',
        item: null,
        itemTitle: null,
        size: null,
        quantity: null,
        sponge: null,
        filling: null,
        requestedPickupDate: null,
        specialRequests: null,
        message: 'Is there parking?',
        estimate: null,
      },
      { ...context, leadTimeDays: null },
    )

    expect(toJana.subject).toBe('Message K7MQ-3XTP from Sanne de Vries')
    expect(toJana.text).toContain('Is there parking?')
    expect(toJana.text).not.toContain('Estimate')
    expect(toCustomer.text).not.toContain('Expect her reply within')
  })

  it('keeps a subject on one line, whatever the customer typed as their name', () => {
    const { toJana } = enquiryEmails({ ...submission, name: 'Sanne\r\nBcc: everyone' }, context)

    expect(toJana.subject).not.toMatch(/[\r\n]/)
  })
})

describe('textToHtml', () => {
  it('escapes everything the customer typed, so nothing in it is markup', () => {
    expect(textToHtml('<img src=x onerror="alert(1)"> & \'more\'')).toContain(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; &#39;more&#39;',
    )
  })

  it('keeps line breaks as they were typed', () => {
    expect(textToHtml('one\ntwo')).toMatch(/white-space:\s*pre-wrap/)
  })
})
