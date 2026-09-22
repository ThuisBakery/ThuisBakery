import { describe, expect, it } from 'vitest'

import { alternates } from './alternates'

const origin = 'https://thuisbakery.nl'
const cakes = { en: '/cakes', nl: '/nl/taarten' }

describe('alternates', () => {
  it('self-canonicalises each locale, fully qualified', () => {
    expect(alternates(cakes, 'en', origin).canonical).toBe('https://thuisbakery.nl/cakes')
    expect(alternates(cakes, 'nl', origin).canonical).toBe('https://thuisbakery.nl/nl/taarten')
  })

  it('lists every locale including its own, with x-default on the English page', () => {
    expect(alternates(cakes, 'nl', origin).languages).toEqual({
      en: 'https://thuisbakery.nl/cakes',
      nl: 'https://thuisbakery.nl/nl/taarten',
      'x-default': 'https://thuisbakery.nl/cakes',
    })
  })

  it('is reciprocal: both locales of one page emit the same set', () => {
    expect(alternates(cakes, 'en', origin).languages).toEqual(
      alternates(cakes, 'nl', origin).languages,
    )
  })

  it('puts the English root at the bare origin', () => {
    const home = alternates({ en: '/', nl: '/nl' }, 'nl', origin)

    expect(home.languages['x-default']).toBe('https://thuisbakery.nl/')
    expect(home.canonical).toBe('https://thuisbakery.nl/nl')
  })

  it('does not double the slash when the origin carries one', () => {
    expect(alternates(cakes, 'en', 'https://thuisbakery.nl/').canonical).toBe(
      'https://thuisbakery.nl/cakes',
    )
  })

  it('omits a locale the page has no URL in, rather than pointing at a 404', () => {
    // ADR-0002: an untranslated cake has no Dutch URL, and an alternate pointing at a 404
    // breaks reciprocity for the whole set.
    const englishOnly = alternates({ en: '/cakes/apple-pie' }, 'en', origin)

    expect(englishOnly.languages).toEqual({
      en: 'https://thuisbakery.nl/cakes/apple-pie',
      'x-default': 'https://thuisbakery.nl/cakes/apple-pie',
    })
  })

  it('has no x-default when there is no English page to default to', () => {
    const dutchOnly = alternates({ nl: '/nl/taarten/appeltaart' }, 'nl', origin)

    expect(dutchOnly.languages).toEqual({ nl: 'https://thuisbakery.nl/nl/taarten/appeltaart' })
  })
})
