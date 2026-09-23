import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { About } from '@/payload-types'

import { AboutPage } from './AboutPage'

afterEach(cleanup)

const text = (value: string) => ({
  type: 'text',
  text: value,
  format: 0,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

const paragraph = (value: string) => ({
  type: 'paragraph',
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  textFormat: 0,
  children: [text(value)],
})

const about: About = {
  id: 1,
  heading: 'One kitchen, one pair of hands',
  story: {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: [
        paragraph('Jana started baking for her daughter’s first birthday.'),
        paragraph('Now she bakes for half of Uithoorn.'),
      ],
    },
  },
  photograph: {
    id: 4,
    alt: 'Jana in her kitchen',
    url: 'https://example.public.blob.vercel-storage.com/4.jpg',
    width: 1200,
    height: 1600,
    updatedAt: '2026-09-23T00:00:00.000Z',
    createdAt: '2026-09-23T00:00:00.000Z',
  },
  cakesLabel: 'See what Jana bakes',
}

describe('AboutPage', () => {
  it('tells Jana’s story beside her photograph', () => {
    render(<AboutPage locale="en" about={about} targets={new Map()} />)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'One kitchen, one pair of hands',
    )
    expect(screen.getByText('Now she bakes for half of Uithoorn.')).toBeTruthy()
    expect(screen.getByAltText('Jana in her kitchen')).toBeTruthy()
  })

  it('links to the cakes, in the page’s language (ADR-0003)', () => {
    render(<AboutPage locale="nl" about={about} targets={new Map()} />)

    expect(screen.getByRole('link', { name: 'See what Jana bakes' }).getAttribute('href')).toBe(
      '/nl/taarten',
    )
  })
})
