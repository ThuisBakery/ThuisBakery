import { describe, expect, it } from 'vitest'

import { changesPublicSite } from './revalidation'

describe('changesPublicSite', () => {
  it('counts every save of a document without drafts, which is always live', () => {
    // A Filling as Payload returns it: no `_status` at all.
    const ganache = { id: 7, name: 'Ganache' }

    expect(changesPublicSite(ganache, { ...ganache, name: 'Ganach' })).toBe(true)
    expect(changesPublicSite(ganache, null)).toBe(true)
  })

  it('counts publishing, and editing what is already published', () => {
    expect(changesPublicSite({ _status: 'published' }, { _status: 'draft' })).toBe(true)
    expect(changesPublicSite({ _status: 'published' }, { _status: 'published' })).toBe(true)
  })

  it('counts unpublishing, which takes something off the site', () => {
    expect(changesPublicSite({ _status: 'draft' }, { _status: 'published' })).toBe(true)
  })

  it('ignores a draft autosave, which customers never see', () => {
    expect(changesPublicSite({ _status: 'draft' }, { _status: 'draft' })).toBe(false)
    expect(changesPublicSite({ _status: 'draft' }, null)).toBe(false)
  })
})
