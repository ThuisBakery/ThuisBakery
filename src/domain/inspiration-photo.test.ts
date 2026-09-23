import { describe, expect, it } from 'vitest'

import { MAX_PHOTO_BYTES, downscaledSize, photoProblem } from './inspiration-photo'

const bytes = (...values: number[]) => new Uint8Array(values)

const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10)
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00)
// "RIFF", a size, then "WEBP".
const WEBP = bytes(0x52, 0x49, 0x46, 0x46, 0x10, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50)

describe('photoProblem', () => {
  it.each([
    ['a JPEG', JPEG],
    ['a PNG', PNG],
    ['a WebP', WEBP],
  ])('accepts %s', (_, photo) => {
    expect(photoProblem(photo)).toBeNull()
  })

  it.each([
    ['a PDF', new TextEncoder().encode('%PDF-1.7')],
    ['an HTML page', new TextEncoder().encode('<!doctype html><script>')],
    ['a GIF', new TextEncoder().encode('GIF89a')],
    [
      'a RIFF that is not a WebP',
      bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x41, 0x56, 0x49, 0x20),
    ],
    ['a JPEG cut short', bytes(0xff, 0xd8)],
    ['nothing', bytes()],
  ])('rejects %s, whatever it was declared as', (_, photo) => {
    expect(photoProblem(photo)).toBe('notAnImage')
  })

  it('rejects a photo over 5 MB even when it is a real image', () => {
    const large = new Uint8Array(MAX_PHOTO_BYTES + 1)
    large.set(JPEG)

    expect(MAX_PHOTO_BYTES).toBe(5 * 1024 * 1024)
    expect(photoProblem(large)).toBe('tooLarge')
  })

  it('accepts a photo of exactly 5 MB', () => {
    const limit = new Uint8Array(MAX_PHOTO_BYTES)
    limit.set(JPEG)

    expect(photoProblem(limit)).toBeNull()
  })
})

describe('downscaledSize', () => {
  it('brings a phone photo’s long edge down to 2000px, keeping its shape', () => {
    expect(downscaledSize({ width: 4032, height: 3024 })).toEqual({ width: 2000, height: 1500 })
    expect(downscaledSize({ width: 3024, height: 4032 })).toEqual({ width: 1500, height: 2000 })
  })

  it('never enlarges a photo that is already small enough', () => {
    expect(downscaledSize({ width: 1200, height: 800 })).toEqual({ width: 1200, height: 800 })
  })

  it('rounds to whole pixels, never to nothing', () => {
    expect(downscaledSize({ width: 9000, height: 3 })).toEqual({ width: 2000, height: 1 })
  })
})
