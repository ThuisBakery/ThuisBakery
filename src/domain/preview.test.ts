import { describe, expect, it } from 'vitest'

import { PREVIEW_ROUTE, previewUrl } from './preview'

describe('previewUrl', () => {
  it('carries the collection document’s id rather than a resolved path', () => {
    // The `url` function runs on every autosave, so it must not read the database:
    // resolving the Item's catalogue and slug is the preview route's job, done once.
    const url = new URL(
      previewUrl({ kind: 'collection', slug: 'items', id: 12 }, 'nl'),
      'https://x',
    )

    expect(url.pathname).toBe(PREVIEW_ROUTE)
    expect(Object.fromEntries(url.searchParams)).toEqual({
      kind: 'collection',
      slug: 'items',
      id: '12',
      locale: 'nl',
    })
  })

  it('omits the id for a global, which has none', () => {
    const url = new URL(previewUrl({ kind: 'global', slug: 'lead-time' }, 'en'), 'https://x')

    expect(url.searchParams.has('id')).toBe(false)
    expect(url.searchParams.get('slug')).toBe('lead-time')
  })
})
