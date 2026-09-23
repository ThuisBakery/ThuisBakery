import type { EnquiryProblem } from './enquiry'

/**
 * The Inspiration photo's rules (ADR-0006): how far the browser shrinks it before it is sent,
 * and what the route accepts. The declared MIME type is never trusted — a file is judged by
 * its first bytes — and whatever passes is re-encoded server-side before it is stored, so
 * what is kept is never the sender's own bytes.
 */

/** The long edge the browser downscales to. Jana glances at the photo; she does not print it. */
export const PHOTO_LONG_EDGE = 2000

/** The hard ceiling after downscaling. A downscaled photo is roughly 1 MB; this is room, not a target. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024

export type PhotoProblem = Extract<EnquiryProblem, 'tooLarge' | 'notAnImage'>

const startsWith = (bytes: Uint8Array, signature: readonly number[], offset = 0): boolean =>
  bytes.length >= offset + signature.length &&
  signature.every((value, index) => bytes[offset + index] === value)

// "RIFF" at 0 and "WEBP" at 8.
const isWebp = (bytes: Uint8Array): boolean =>
  startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)

/**
 * JPEG, PNG and WebP: what a browser's canvas can produce, and what the server can decode.
 * The browser always sends a JPEG; the other two are room for a browser that does not.
 */
const isImage = (bytes: Uint8Array): boolean =>
  startsWith(bytes, [0xff, 0xd8, 0xff]) ||
  startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) ||
  isWebp(bytes)

/** What is wrong with a photo as sent, or `null` when it may go on to be re-encoded. */
export const photoProblem = (bytes: Uint8Array): PhotoProblem | null => {
  if (bytes.length > MAX_PHOTO_BYTES) {
    return 'tooLarge'
  }

  return isImage(bytes) ? null : 'notAnImage'
}

type Dimensions = { width: number; height: number }

/** A photo's size once its long edge fits `PHOTO_LONG_EDGE`. Never enlarged. */
export const downscaledSize = ({ width, height }: Dimensions): Dimensions => {
  const scale = Math.min(1, PHOTO_LONG_EDGE / Math.max(width, height))

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}
