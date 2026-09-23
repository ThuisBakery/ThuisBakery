import { downscaledSize } from '@/domain/inspiration-photo'

/**
 * The Inspiration photo shrunk in the customer's own browser (ADR-0006): long edge 2000px,
 * re-encoded as JPEG, roughly 1 MB. A camera-roll photo of 8 MB or more then travels through
 * the site's own route, and no public upload endpoint has to exist.
 *
 * `imageOrientation: 'from-image'` bakes the EXIF rotation into the pixels, so a portrait
 * photo stays portrait once the metadata is gone. Throws when the browser cannot decode the
 * file at all; the form reads that as "not a photo".
 */
const TARGET_BYTES = 1.2 * 1024 * 1024
const QUALITIES = [0.82, 0.7, 0.6] as const

const encode = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('The photo could not be encoded.'))),
      'image/jpeg',
      quality,
    ),
  )

export const downscalePhoto = async (file: Blob): Promise<Blob> => {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const { width, height } = downscaledSize(bitmap)
  const canvas = document.createElement('canvas')

  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  let blob = await encode(canvas, QUALITIES[0])

  for (const quality of QUALITIES.slice(1)) {
    if (blob.size <= TARGET_BYTES) {
      break
    }

    blob = await encode(canvas, quality)
  }

  return blob
}
