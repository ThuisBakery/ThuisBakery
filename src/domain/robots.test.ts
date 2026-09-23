import { describe, expect, it } from 'vitest'

import { robots } from './robots'

const origin = 'https://thuisbakery.nl'

const { rules, sitemap } = robots(origin)

/**
 * Whether a Disallow rule covers a path, the way Google reads one: a prefix match, or an
 * exact match when the rule ends in `$`.
 */
const blocks = (rule: string, path: string): boolean =>
  rule.endsWith('$') ? path === rule.slice(0, -1) : path.startsWith(rule)

const blocked = (path: string): boolean => rules.disallow.some((rule) => blocks(rule, path))

describe('robots', () => {
  it('points at the sitemap, fully qualified', () => {
    expect(sitemap).toBe('https://thuisbakery.nl/sitemap.xml')
  })

  it('does not double the slash when the origin carries one', () => {
    expect(robots('https://thuisbakery.nl/').sitemap).toBe('https://thuisbakery.nl/sitemap.xml')
  })

  it('speaks to every crawler', () => {
    expect(rules.userAgent).toBe('*')
  })

  it('blocks the admin, the API and the preview route', () => {
    expect(blocked('/admin')).toBe(true)
    expect(blocked('/admin/collections/items')).toBe(true)
    expect(blocked('/api/items')).toBe(true)
    expect(blocked('/next/preview')).toBe(true)
  })

  it('permits both locale trees', () => {
    for (const path of ['/', '/cakes/apple-pie', '/christmas', '/nl', '/nl/taarten/appeltaart']) {
      expect(blocked(path)).toBe(false)
    }
  })

  it('does not block a marketing page whose slug merely starts like a blocked one', () => {
    expect(blocked('/administration-day')).toBe(false)
    expect(blocked('/nextdoor-bakes')).toBe(false)
  })

  it('leaves Next’s own assets crawlable, which Google needs to render the pages', () => {
    expect(blocked('/_next/static/chunk.js')).toBe(false)
    expect(blocked('/_next/image')).toBe(false)
  })
})
