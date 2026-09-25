import { describe, expect, it } from 'vitest'

import { ITEM_STEP_FIELDS, itemEnquirySteps, problemsOn, stepOwning } from './enquiry-steps'

const offer = {
  configurable: true,
  sponges: [{ id: 1, name: 'Chocolate' }],
  fillings: [{ id: 1, name: 'Cream Cheese' }],
}

describe('itemEnquirySteps', () => {
  it('steps a Configurable Item through Size, Flavour, Date and You', () => {
    expect(itemEnquirySteps(offer)).toEqual(['size', 'flavour', 'date', 'you'])
  })

  it('skips Flavour for an Item that is not Configurable', () => {
    expect(itemEnquirySteps({ configurable: false, sponges: [], fillings: [] })).toEqual([
      'size',
      'date',
      'you',
    ])
  })

  it('skips Flavour when a Configurable Item has nothing to choose', () => {
    expect(itemEnquirySteps({ configurable: true, sponges: [], fillings: [] })).toEqual([
      'size',
      'date',
      'you',
    ])
  })
})

describe('stepOwning', () => {
  const steps = ['size', 'flavour', 'date', 'you'] as const

  it('names the first step, in order, that owns a problem', () => {
    expect(
      stepOwning(steps, ITEM_STEP_FIELDS, {
        email: 'invalidEmail',
        requestedPickupDate: 'tooSoon',
      }),
    ).toBe('date')
  })

  it('names no step for a problem no step owns', () => {
    expect(stepOwning(steps, ITEM_STEP_FIELDS, { item: 'unknownChoice' })).toBeNull()
  })
})

describe('problemsOn', () => {
  it('keeps only the problems of the fields given', () => {
    expect(
      problemsOn(ITEM_STEP_FIELDS.you, { name: 'required', requestedPickupDate: 'required' }),
    ).toEqual({ name: 'required' })
  })

  it('is null when those fields have none', () => {
    expect(problemsOn(ITEM_STEP_FIELDS.size, { name: 'required' })).toBeNull()
    expect(problemsOn(ITEM_STEP_FIELDS.size, null)).toBeNull()
  })
})
