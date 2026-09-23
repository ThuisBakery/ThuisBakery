import { describe, expect, it } from 'vitest'

import { hoursLines, instagramLink, openingHours, phoneLink, priceRange } from './contact'

describe('openingHours', () => {
  it('keeps each row with days and two times, the days in week order', () => {
    expect(
      openingHours([
        { days: ['Saturday', 'Friday'], opens: '10:00', closes: '16:00' },
        { days: ['Sunday'], opens: ' 11:00 ', closes: '13:00' },
      ]),
    ).toEqual([
      { days: ['Friday', 'Saturday'], opens: '10:00', closes: '16:00' },
      { days: ['Sunday'], opens: '11:00', closes: '13:00' },
    ])
  })

  it('drops a row with no days, a time that does not parse, or a close before it opens', () => {
    expect(
      openingHours([
        { days: [], opens: '10:00', closes: '16:00' },
        { days: null, opens: '10:00', closes: '16:00' },
        { days: ['Monday'], opens: '10', closes: '16:00' },
        { days: ['Tuesday'], opens: '16:00', closes: '10:00' },
        { days: ['Wednesday', 'Someday'], opens: '09:30', closes: '12:00' },
      ]),
    ).toEqual([{ days: ['Wednesday'], opens: '09:30', closes: '12:00' }])
  })

  it('is empty when none are set', () => {
    expect(openingHours(null)).toEqual([])
  })
})

describe('hoursLines', () => {
  it('names the days in the page’s language, a run of three or more as a range', () => {
    expect(
      hoursLines(
        [
          { days: ['Tuesday', 'Wednesday', 'Thursday'], opens: '09:00', closes: '17:00' },
          { days: ['Friday', 'Sunday'], opens: '10:00', closes: '14:30' },
        ],
        'en',
      ),
    ).toEqual([
      { days: 'Tuesday – Thursday', hours: '09:00 – 17:00' },
      { days: 'Friday, Sunday', hours: '10:00 – 14:30' },
    ])

    expect(hoursLines([{ days: ['Saturday'], opens: '10:00', closes: '16:00' }], 'nl')).toEqual([
      { days: 'zaterdag', hours: '10:00 – 16:00' },
    ])
  })
})

describe('priceRange', () => {
  it('runs from the cheapest Size to the dearest', () => {
    expect(priceRange([29, 3.5, 110, 45], 'en')).toBe('€3.50 – €110')
    expect(priceRange([29, 3.5, 110], 'nl')).toBe('€3,50 – €110')
  })

  it('is one figure when every price is the same, and nothing with no prices', () => {
    expect(priceRange([25, 25], 'en')).toBe('€25')
    expect(priceRange([], 'en')).toBeNull()
  })
})

describe('instagramLink', () => {
  it('links a handle however Jana typed it', () => {
    const link = { href: 'https://www.instagram.com/thuisbakery/', label: '@thuisbakery' }

    expect(instagramLink('thuisbakery')).toEqual(link)
    expect(instagramLink(' @thuisbakery ')).toEqual(link)
    expect(instagramLink('https://www.instagram.com/thuisbakery/')).toEqual(link)
  })

  it('is nothing when there is no handle, or one Instagram could not have', () => {
    expect(instagramLink('')).toBeNull()
    expect(instagramLink(null)).toBeNull()
    expect(instagramLink('thuis bakery')).toBeNull()
  })
})

describe('phoneLink', () => {
  it('prints the number as Jana wrote it, and dials it without the spacing', () => {
    expect(phoneLink(' +31 6 1234 5678 ')).toEqual({
      href: 'tel:+31612345678',
      label: '+31 6 1234 5678',
    })
    expect(phoneLink('06-12345678')).toEqual({ href: 'tel:0612345678', label: '06-12345678' })
  })

  it('is nothing when there is no number to dial', () => {
    expect(phoneLink(null)).toBeNull()
    expect(phoneLink('  ')).toBeNull()
    expect(phoneLink('call me')).toBeNull()
  })
})
