'use client'

import { useDocumentInfo, useField } from '@payloadcms/ui'

/**
 * A Submission's Inspiration photo in the admin. The photo is private (ADR-0006), so it is
 * shown through `/next/inspiration/<id>`, which answers a logged-in user only — never from
 * Blob directly.
 */
export const InspirationPhotoField = ({ path }: { path: string }) => {
  const { id } = useDocumentInfo()
  const { value } = useField<string | null>({ path })

  if (!value || id === undefined) {
    return null
  }

  const src = `/next/inspiration/${id}`

  return (
    <div className="field-type">
      <span className="field-label">Inspiration photo</span>
      <a href={src} target="_blank" rel="noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element -- private, and never optimised */}
        <img
          src={src}
          alt="The customer’s Inspiration photo"
          style={{ maxWidth: '100%', maxHeight: 480 }}
        />
      </a>
    </div>
  )
}
