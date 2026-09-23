/**
 * `robots.txt`, per ADR-0002: every crawler may read both locale trees, the admin is
 * blocked, and the sitemap is named.
 *
 * Blocked are the three trees that are Payload's or ours rather than pages: the admin, the
 * REST and GraphQL API, and `next`, where the preview and Enquiry routes live. `_next` is
 * not blocked — Google renders pages, and needs their scripts, styles and images to do it.
 *
 * `/admin` is blocked as itself (`$`, an exact match) and as a directory, not as a bare
 * prefix: a bare `Disallow: /admin` would also hide a marketing page slugged
 * `administration-day`. The reserved-slug list keeps `admin` itself out of editors' hands.
 *
 * The shape is what Next's `MetadataRoute.Robots` takes.
 */
export type Robots = {
  rules: { userAgent: string; allow: string; disallow: string[] }
  sitemap: string
}

const BLOCKED = ['admin', 'api', 'next'] as const

export const robots = (origin: string): Robots => ({
  rules: {
    userAgent: '*',
    allow: '/',
    disallow: BLOCKED.flatMap((segment) => [`/${segment}$`, `/${segment}/`]),
  },
  sitemap: `${origin.replace(/\/+$/, '')}/sitemap.xml`,
})
