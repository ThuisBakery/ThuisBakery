import { describe, expect, it } from 'vitest'

import { customOrderMessage } from './custom-order'
import { CUSTOM_ORDER_STEP_FIELDS, CUSTOM_ORDER_STEPS, stepOwning } from './enquiry-steps'

describe('the Custom order steps', () => {
  it('steps through Idea, When, Photo and You', () => {
    expect(CUSTOM_ORDER_STEPS).toEqual(['idea', 'when', 'photo', 'you'])
  })

  it('sends a problem with the words to Idea, with the date to When, with the photo to Photo', () => {
    const owner = (problems: Parameters<typeof stepOwning>[2]) =>
      stepOwning(CUSTOM_ORDER_STEPS, CUSTOM_ORDER_STEP_FIELDS, problems)

    expect(owner({ message: 'tooLong', email: 'invalidEmail' })).toBe('idea')
    expect(owner({ requestedPickupDate: 'tooSoon' })).toBe('when')
    expect(owner({ photo: 'notAnImage' })).toBe('photo')
    expect(owner({ email: 'invalidEmail' })).toBe('you')
  })
})

describe('customOrderMessage', () => {
  it('writes the Occasion and how many people above the customer’s own words', () => {
    expect(
      customOrderMessage('en', {
        occasion: 'birthday',
        people: 20,
        idea: 'Two tiers, dried flowers, not too sweet.',
      }),
    ).toBe('For: Birthday\nAbout 20 people\n\nTwo tiers, dried flowers, not too sweet.')
  })

  it('writes them in the customer’s language', () => {
    expect(
      customOrderMessage('nl', { occasion: 'wedding', people: 60, idea: 'Drie lagen, wit.' }),
    ).toBe('Voor: Bruiloft\nOngeveer 60 personen\n\nDrie lagen, wit.')
  })

  it('leaves out an Occasion that was not chosen', () => {
    expect(customOrderMessage('en', { occasion: '', people: 12, idea: 'A fox.' })).toBe(
      'About 12 people\n\nA fox.',
    )
  })

  it('is empty without the customer’s own words: a head count alone describes no cake', () => {
    expect(customOrderMessage('en', { occasion: 'birthday', people: 12, idea: '  \n ' })).toBe('')
  })
})
