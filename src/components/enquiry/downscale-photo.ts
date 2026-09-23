import { downscaledSize } from '@/domain/inspiration-photo'

/**
 * The Inspiration photo shrunk in the customer's own browser (ADR-0006): long edge 2000px,
 * re-encoded as JPEG, roughly 1 MB. A camera-roll photo of 8 MB or more then travels through
 * the site's own route, and no public upload endpoint has to exist.
 *
 * Decoded through an `<img>` rather than `createImageBitmap`, which holds the full-resolution
 * bitmap in memory — for a 48-megapixel phone photo, enough for Safari on iOS to give up.
 * Browsers draw an `<img>` to a canvas with its EXIF rotation applied, so a portrait photo
 * stays portrait once the metadata is gone. Throws when the browser cannot decode the file;
 * the form reads that as "not a photo".
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

const decode = async (file: Blob): Promise<HTMLImageElement> => {
  const url = URL.createObjectURL(file)
  const image = new Image()

  try {
    image.src = url
    await image.decode()

    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

export const downscalePhoto = async (file: Blob): Promise<Blob> => {
  const image = await decode(file)
  const { width, height } = downscaledSize({
    width: image.naturalWidth,
    height: image.naturalHeight,
  })
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('The browser offered no canvas to shrink the photo on.')
  }

  canvas.width = width
  canvas.height = height
  context.drawImage(image, 0, 0, width, height)

  let blob = await encode(canvas, QUALITIES[0])

  for (const quality of QUALITIES.slice(1)) {
    if (blob.size <= TARGET_BYTES) {
      break
    }

    blob = await encode(canvas, quality)
  }

  return blob
}
