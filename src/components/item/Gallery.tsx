'use client'

import Image from 'next/image'
import { useState } from 'react'

import { Photograph } from '@/components/site/Photograph'
import { PHOTO_FRAME, THUMBNAIL } from '@/components/site/pressable'
import type { Media } from '@/payload-types'

/**
 * An Item's photographs (ADR-0007): one main photograph, and a thumbnail button for each
 * that swaps it in, marked while it is the one shown. One photograph has no thumbnails.
 */
export const Gallery = ({
  photographs,
  label,
}: {
  photographs: Media[]
  /** A thumbnail's accessible name, from its number. */
  label: (number: number) => string
}) => {
  const [shown, setShown] = useState(0)
  const main = photographs[shown] ?? photographs[0]

  return (
    <div className="flex flex-col gap-3">
      <div className={PHOTO_FRAME}>
        <Photograph
          // A new element per photograph, so the old one is not left showing while it loads.
          key={main?.id}
          media={main}
          sizes="(min-width: 768px) 58vw, 100vw"
          preload={shown === 0}
          className="aspect-[3/2] w-full object-cover md:aspect-[4/3] md:max-h-[calc(100svh-12rem)]"
        />
      </div>
      {photographs.length > 1 ? (
        <ul className="flex flex-wrap gap-2">
          {photographs.map((photograph, index) =>
            photograph.url ? (
              <li key={photograph.id}>
                <button
                  type="button"
                  aria-label={label(index + 1)}
                  aria-pressed={index === shown}
                  onClick={() => setShown(index)}
                  className={THUMBNAIL}
                >
                  <Image
                    src={photograph.url}
                    alt=""
                    width={128}
                    height={128}
                    sizes="4.5rem"
                    className="size-full object-cover"
                    style={{
                      objectPosition: `${photograph.focalX ?? 50}% ${photograph.focalY ?? 50}%`,
                    }}
                  />
                </button>
              </li>
            ) : null,
          )}
        </ul>
      ) : null}
    </div>
  )
}
