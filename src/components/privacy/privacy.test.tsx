import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { Privacy } from '@/payload-types'

import { PrivacyPage } from './PrivacyPage'

afterEach(cleanup)

const node = (type: string, value: string, extra: Record<string, unknown> = {}) => ({
  type,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  ...extra,
  children: [
    { type: 'text', text: value, format: 0, detail: 0, mode: 'normal', style: '', version: 1 },
  ],
})

const privacy: Privacy = {
  id: 1,
  body: {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        node('heading', 'Email', { tag: 'h2' }),
        node('paragraph', 'Enquiries are emailed through Resend.'),
      ],
    },
  },
  lastUpdated: '2026-09-23T12:00:00.000Z',
}

describe('PrivacyPage', () => {
  it('sets out the policy as Jana wrote it, under the page’s own heading', () => {
    render(<PrivacyPage locale="en" privacy={privacy} targets={new Map()} />)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Privacy')
    expect(screen.getByRole('heading', { level: 2, name: 'Email' })).toBeTruthy()
    expect(screen.getByText('Enquiries are emailed through Resend.')).toBeTruthy()
  })

  it('says when it last changed, in the page’s language', () => {
    render(<PrivacyPage locale="nl" privacy={privacy} targets={new Map()} />)

    expect(screen.getByText('Laatst bijgewerkt op 23 september 2026')).toBeTruthy()
  })
})
