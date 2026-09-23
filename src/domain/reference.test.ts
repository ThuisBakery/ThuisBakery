import { describe, expect, it } from 'vitest'

import { REFERENCE_ALPHABET, enquiryReference } from './reference'

describe('enquiryReference', () => {
  it('is eight characters in two groups, drawn from the random source', () => {
    const picks = [0, 1, 2, 3, 28, 29, 30, 31]
    let call = 0

    expect(enquiryReference(() => picks[call++] ?? 0)).toBe('2345-WXYZ')
  })

  it('asks the random source for indices within the alphabet only', () => {
    const asked: number[] = []

    enquiryReference((max) => {
      asked.push(max)
      return 0
    })

    expect(asked).toEqual(Array(8).fill(REFERENCE_ALPHABET.length))
  })

  it('leaves out the characters that read alike aloud or on a phone', () => {
    expect(REFERENCE_ALPHABET).not.toMatch(/[01IO]/)
  })
})
