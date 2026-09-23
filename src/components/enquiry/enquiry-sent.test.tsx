import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { Receipt } from '@/domain/submit-enquiry'

import { EnquirySent } from './EnquirySent'

afterEach(cleanup)

const receipt: Receipt = {
  reference: 'K7MQ-3XTP',
  enquiryType: 'item',
  itemTitle: 'Burnt Basque Cheesecake',
  size: 'Large',
  quantity: 2,
  sponge: 'Red Velvet',
  filling: 'Salted Caramel',
  requestedPickupDate: '2026-09-26',
  specialRequests: 'Happy 40th, Marco',
  estimate: {
    lines: [
      { label: 'Large', unitAmount: 62.5, quantity: 2, amount: 125 },
      { label: 'Salted Caramel', unitAmount: 2.5, quantity: 2, amount: 5 },
    ],
    total: 130,
    currency: 'EUR',
    provisional: true,
  },
  leadTimeDays: 5,
}

const renderSent = (kept: Receipt | null, locale: 'en' | 'nl' = 'en') =>
  render(
    <EnquirySent
      locale={locale}
      siteLeadTimeDays={3}
      contactPath={locale === 'en' ? '/contact' : '/nl/contact'}
      readReceipt={() => (kept ? JSON.stringify(kept) : null)}
    />,
  )

describe('EnquirySent', () => {
  it('says what happens next, and that nothing is booked until Jana replies', () => {
    renderSent(null)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Thank you. Jana has your enquiry.',
    )
    expect(screen.getByText(/Nothing is booked until she does/)).toBeTruthy()
  })

  it('says by when to expect a reply, from the Lead time the Enquiry was held to', () => {
    renderSent(receipt)

    expect(screen.getByText('Expect her reply within 5 days.')).toBeTruthy()
  })

  it('falls back to the site-wide Lead time without a receipt', () => {
    renderSent(null)

    expect(screen.getByText('Expect her reply within 3 days.')).toBeTruthy()
  })

  it('says how to follow up directly if nothing arrives', () => {
    renderSent(null)

    expect(screen.getByText(/Heard nothing by then\?/)).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Contact' }).getAttribute('href')).toBe('/contact')
  })

  it('shows back what was sent, with its reference and the provisional Estimate', () => {
    renderSent(receipt)

    const sent = screen.getByRole('region', { name: 'What you sent' })

    expect(within(sent).getByText('Reference K7MQ-3XTP')).toBeTruthy()
    expect(within(sent).getByText('Burnt Basque Cheesecake')).toBeTruthy()
    // Once as what was asked for, once as the Estimate's line.
    expect(within(sent).getAllByText('Large × 2')).toHaveLength(2)
    expect(within(sent).getByText('Red Velvet')).toBeTruthy()
    expect(within(sent).getByText('Saturday 26 September')).toBeTruthy()
    expect(within(sent).getByText('Happy 40th, Marco')).toBeTruthy()

    const estimate = within(sent).getByRole('region', { name: /Estimate/ })
    expect(within(estimate).getByText('Provisional')).toBeTruthy()
    expect(within(estimate).getByText('€130')).toBeTruthy()
  })

  it('shows no receipt when none was kept', () => {
    renderSent(null)

    expect(screen.queryByRole('region', { name: 'What you sent' })).toBeNull()
  })

  it('speaks Dutch on the Dutch page', () => {
    renderSent(receipt, 'nl')

    expect(screen.getByText('Je hoort binnen 5 dagen van haar.')).toBeTruthy()
    expect(screen.getByText('zaterdag 26 september')).toBeTruthy()
  })
})
