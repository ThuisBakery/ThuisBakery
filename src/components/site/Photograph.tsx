import Image from 'next/image'

import type { Media } from '@/payload-types'

/**
 * A photograph from Media at its real dimensions, cropped around the focal point Jana set
 * on it. Lazy unless it is the page's LCP.
 */
export const Photograph = ({
  media,
  sizes,
  preload,
  className,
}: {
  media: number | Media | null | undefined
  sizes: string
  preload: boolean
  className: string
}) => {
  if (!media || typeof media === 'number' || !media.url) {
    // Unpopulated or missing: hold the space rather than collapse the cell.
    return <div className={className} aria-hidden="true" />
  }

  return (
    <Image
      src={media.url}
      alt={media.alt ?? ''}
      width={media.width ?? 1600}
      height={media.height ?? 1200}
      sizes={sizes}
      preload={preload}
      className={className}
      style={{ objectPosition: `${media.focalX ?? 50}% ${media.focalY ?? 50}%` }}
    />
  )
}
