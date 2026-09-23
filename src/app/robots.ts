import type { MetadataRoute } from 'next'

import { robots as robotsFor } from '@/domain/robots'
import { siteOrigin } from '@/lib/site'

/** `/robots.txt`: the admin blocked, both locale trees permitted, the sitemap named. */
export default function robots(): MetadataRoute.Robots {
  return robotsFor(siteOrigin())
}
