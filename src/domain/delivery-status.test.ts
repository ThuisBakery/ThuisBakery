import { describe, expect, it } from 'vitest'

import { deliveryEvent, nextDeliveryStatus } from './delivery-status'

const event = (type: string, emailId = '56761188-7520-42d8-8898-ff6fc54ce618') => ({
  type,
  created_at: '2026-09-23T10:00:01.000Z',
  data: { email_id: emailId, to: ['jana@example.nl'], subject: 'Enquiry' },
})

describe('deliveryEvent', () => {
  it.each([
    ['email.sent', 'sent'],
    ['email.delivered', 'delivered'],
    ['email.delivery_delayed', 'delayed'],
    ['email.bounced', 'bounced'],
    ['email.complained', 'complained'],
    ['email.failed', 'failed'],
    ['email.suppressed', 'failed'],
  ])('reads Resend’s %s as %s', (type, status) => {
    expect(deliveryEvent(event(type))).toEqual({
      emailId: '56761188-7520-42d8-8898-ff6fc54ce618',
      status,
    })
  })

  it.each(['email.opened', 'email.clicked', 'email.scheduled', 'domain.updated'])(
    'ignores %s, which says nothing about whether it arrived',
    (type) => {
      expect(deliveryEvent(event(type))).toBeNull()
    },
  )

  it.each([
    ['nothing', null],
    ['no email id', { type: 'email.delivered', data: {} }],
    ['no data', { type: 'email.delivered' }],
    ['not an object', 'email.delivered'],
  ])('is null for %s', (_, body) => {
    expect(deliveryEvent(body)).toBeNull()
  })
})

describe('nextDeliveryStatus', () => {
  it('moves forward as the email travels', () => {
    expect(nextDeliveryStatus('pending', 'sent')).toBe('sent')
    expect(nextDeliveryStatus('sent', 'delayed')).toBe('delayed')
    expect(nextDeliveryStatus('delayed', 'delivered')).toBe('delivered')
  })

  it('never moves back when Resend’s events arrive out of order', () => {
    expect(nextDeliveryStatus('delivered', 'sent')).toBe('delivered')
    expect(nextDeliveryStatus('delivered', 'delayed')).toBe('delivered')
    expect(nextDeliveryStatus('bounced', 'sent')).toBe('bounced')
  })

  it('lets a problem override a delivery, since a complaint only follows one', () => {
    expect(nextDeliveryStatus('delivered', 'complained')).toBe('complained')
  })

  it('keeps the first problem it heard of', () => {
    expect(nextDeliveryStatus('bounced', 'failed')).toBe('bounced')
  })

  it('takes the first word on an email it has no status for yet', () => {
    expect(nextDeliveryStatus(null, 'delivered')).toBe('delivered')
  })
})
