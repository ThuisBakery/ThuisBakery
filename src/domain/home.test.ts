import { describe, expect, it } from 'vitest'

import { fromPrice, leadTimeFact } from './home'

describe('fromPrice', () => {
  it('is the lowest price on the menu, as a starting figure in the page’s language', () => {
    const categories = [{ price: 52 }, { price: 25 }, { price: 29 }]

    expect(fromPrice(categories, 'en')).toBe('From €25')
    expect(fromPrice(categories, 'nl')).toBe('Vanaf €25')
  })

  it('ignores Categories the card prices Item by Item', () => {
    expect(fromPrice([{ price: null }, {}, { price: 49 }], 'en')).toBe('From €49')
  })

  it('is absent when no Category carries a price', () => {
    expect(fromPrice([{ price: null }, {}], 'en')).toBeNull()
    expect(fromPrice([], 'en')).toBeNull()
  })
})

describe('leadTimeFact', () => {
  it('states the days of notice and the time of day that makes a day count, in each locale', () => {
    expect(leadTimeFact({ days: 3, timeOfDay: '17:00' }, 'en')).toEqual({
      title: '3 days’ notice',
      detail: 'Ask before 17:00 and that day counts.',
    })
    expect(leadTimeFact({ days: 3, timeOfDay: '17:00' }, 'nl')).toEqual({
      title: '3 dagen van tevoren',
      detail: 'Vóór 17:00 gevraagd telt die dag mee.',
    })
  })

  it('says one day in the singular', () => {
    expect(leadTimeFact({ days: 1, timeOfDay: '12:00' }, 'en').title).toBe('1 day’s notice')
    expect(leadTimeFact({ days: 1, timeOfDay: '12:00' }, 'nl').title).toBe('1 dag van tevoren')
  })

  it('says same day when no days of notice are needed', () => {
    expect(leadTimeFact({ days: 0, timeOfDay: '10:00' }, 'en').title).toBe('Same-day')
    expect(leadTimeFact({ days: 0, timeOfDay: '10:00' }, 'nl').title).toBe('Dezelfde dag')
  })

  it('leaves out a time of day it cannot read, rather than printing it', () => {
    expect(leadTimeFact({ days: 3, timeOfDay: '5pm' }, 'en').detail).toBeNull()
  })
})
