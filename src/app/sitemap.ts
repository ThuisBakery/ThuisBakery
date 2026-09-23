import type { MetadataRoute } from 'next'

import { sitemapEntries } from '@/domain/sitemap'
import { itemListings } from '@/lib/items'
import { pageListings } from '@/lib/pages'
import { siteOrigin } from '@/lib/site'

/**
 * `/sitemap.xml`: every indexable URL in both locale trees, with hreflang alternates
 * (ADR-0002). Read from the same listings the pages are generated from, so it lists
 * exactly the URLs the site has; what it says is `sitemapEntries`, tested in `src/domain`.
 *
 * Static like the pages, and rebuilt with them when Jana publishes
 * (`src/hooks/revalidateSite.ts`). `proxy.ts` never sees it: its matcher skips paths with
 * a file extension.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [items, pages] = await Promise.all([itemListings(), pageListings()])

  return sitemapEntries({ items, pages }, siteOrigin())
}
