import { describe, expect, it } from 'vitest'

import { PREVIEW_ROUTE, globalPreviewPath, previewUrl } from './preview'

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

describe('globalPreviewPath', () => {
  it('previews a page’s own global on that page, in the locale being edited', () => {
    expect(globalPreviewPath('about', 'en')).toBe('/about')
    expect(globalPreviewPath('contact', 'nl')).toBe('/nl/contact')
    expect(globalPreviewPath('custom-order', 'nl')).toBe('/nl/maatwerk')
    expect(globalPreviewPath('privacy', 'en')).toBe('/privacy')
  })

  it('previews a site-wide global on the front page', () => {
    expect(globalPreviewPath('lead-time', 'en')).toBe('/')
    expect(globalPreviewPath('home', 'nl')).toBe('/nl')
  })
})
