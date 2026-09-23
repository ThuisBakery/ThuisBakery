import { describe, expect, it } from 'vitest'

import { isCronRequest } from './cron'

const secret = 'b3f1c2d4e5a6978812345678abcdef00'

describe('isCronRequest', () => {
  it('lets in the bearer token Vercel Cron sends', () => {
    expect(isCronRequest(`Bearer ${secret}`, secret)).toBe(true)
  })

  it.each([
    ['no header', null],
    ['a wrong secret', 'Bearer not-the-secret'],
    ['the secret without its scheme', secret],
    ['the secret with something after it', `Bearer ${secret}x`],
    ['an empty bearer', 'Bearer '],
  ])('turns away %s', (_, authorization) => {
    expect(isCronRequest(authorization, secret)).toBe(false)
  })

  it.each([
    ['unset', undefined],
    ['empty', ''],
  ])('turns everyone away when the secret is %s', (_, unset) => {
    expect(isCronRequest('Bearer ', unset)).toBe(false)
    expect(isCronRequest('Bearer undefined', unset)).toBe(false)
  })
})
