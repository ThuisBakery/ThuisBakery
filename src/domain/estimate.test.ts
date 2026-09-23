import { describe, expect, it } from 'vitest'

import { estimate } from './estimate'

const large = { label: 'Large', price: 62.5 }

describe('estimate', () => {
  it('prices one Size at its price, provisionally, in euros', () => {
    expect(estimate({ size: large, quantity: 1 })).toEqual({
      lines: [{ label: 'Large', unitAmount: 62.5, quantity: 1, amount: 62.5 }],
      total: 62.5,
      currency: 'EUR',
      provisional: true,
    })
  })

  it('multiplies the Size by the quantity', () => {
    const { lines, total } = estimate({ size: large, quantity: 3 })

    expect(lines).toEqual([{ label: 'Large', unitAmount: 62.5, quantity: 3, amount: 187.5 }])
    expect(total).toBe(187.5)
  })

  it('adds a line for a surcharging Filling, once per item asked for', () => {
    const { lines, total } = estimate({
      size: large,
      quantity: 2,
      filling: { name: 'Salted Caramel', surcharge: 2.5 },
    })

    expect(lines).toEqual([
      { label: 'Large', unitAmount: 62.5, quantity: 2, amount: 125 },
      { label: 'Salted Caramel', unitAmount: 2.5, quantity: 2, amount: 5 },
    ])
    expect(total).toBe(130)
  })

  it.each([null, undefined, 0])('adds no line for a Filling whose Surcharge is %s', (surcharge) => {
    const { lines } = estimate({
      size: large,
      quantity: 1,
      filling: { name: 'Cream Cheese', surcharge },
    })

    expect(lines.map((line) => line.label)).toEqual(['Large'])
  })

  it('adds in cents, so the figure never carries floating-point dust', () => {
    const { lines, total } = estimate({
      size: { label: 'Box', price: 10.1 },
      quantity: 3,
      filling: { name: 'Ganache', surcharge: 0.2 },
    })

    expect(lines.map((line) => line.amount)).toEqual([30.3, 0.6])
    expect(total).toBe(30.9)
  })
})
