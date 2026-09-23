import { randomUUID } from 'node:crypto'

import { del, get, list, put } from '@vercel/blob'
import sharp from 'sharp'

import { PHOTO_LONG_EDGE } from '@/domain/inspiration-photo'

/**
 * Where Inspiration photos are kept: a private Blob store of their own, apart from Media's
 * (ADR-0006) — different access, lifetime and trust — so a stranger's upload can never be
 * one misclick away from the illustrated menu.
 *
 * Its token is its own variable. `BLOB_READ_WRITE_TOKEN` belongs to the Media store, and
 * `@vercel/blob` reads that one by default, so every call here passes this token explicitly.
 */
const token = () => {
  const value = process.env.INSPIRATION_BLOB_READ_WRITE_TOKEN

  if (!value) {
    throw new Error('INSPIRATION_BLOB_READ_WRITE_TOKEN is not set.')
  }

  return value
}

/**
 * Decoded and encoded again, so what is kept is not the sender's bytes. `rotate()` applies
 * the EXIF orientation before sharp drops the metadata — GPS coordinates included, which on
 * a phone photo are the customer's home. The pixel limit refuses a decompression bomb.
 */
export const reencodePhoto = async (photo: Uint8Array): Promise<Uint8Array> =>
  new Uint8Array(
    await sharp(photo, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({
        width: PHOTO_LONG_EDGE,
        height: PHOTO_LONG_EDGE,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer(),
  )

const PREFIX = 'inspiration/'

/** Stores a re-encoded photo under a random name, and returns its pathname. */
export const putPhoto = async (photo: Uint8Array): Promise<string> => {
  const { pathname } = await put(`${PREFIX}${randomUUID()}.jpg`, Buffer.from(photo), {
    access: 'private',
    contentType: 'image/jpeg',
    addRandomSuffix: false,
    token: token(),
  })

  return pathname
}

export const deletePhoto = async (pathname: string): Promise<void> => {
  await del(pathname, { token: token() })
}

/** The photo's bytes as a stream, or `null` when it is gone. */
export const readPhoto = async (pathname: string) => {
  const result = await get(pathname, { access: 'private', token: token() })

  return result && result.statusCode === 200 ? result.stream : null
}

/** Every photo in the store, with when it was stored, a page of the store at a time. */
export async function* listPhotos(): AsyncGenerator<{ pathname: string; uploadedAt: Date }> {
  let cursor: string | undefined

  do {
    const page = await list({ prefix: PREFIX, token: token(), ...(cursor ? { cursor } : {}) })

    yield* page.blobs.map(({ pathname, uploadedAt }) => ({ pathname, uploadedAt }))
    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)
}
