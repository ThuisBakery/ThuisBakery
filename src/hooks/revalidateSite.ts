import { revalidatePath } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  GlobalAfterChangeHook,
  GlobalConfig,
  Payload,
} from 'payload'

import { changesPublicSite } from '@/domain/revalidation'

/**
 * Rebuilds the public pages when Jana changes what they show.
 *
 * Every public page is static (ADR-0002), so without this an edit in the admin reaches
 * customers only on the next deploy: a Closed until date the Enquiry form never hears of, a
 * price the Estimate disagrees with the server about. This is the pattern Payload's own
 * website template uses — an `afterChange` hook calling `revalidatePath` — and like the
 * template it skips draft autosaves.
 *
 * Every public page at once, rather than working out which pages one document reaches: the
 * Header, Footer, Lead time and cross-contamination statement are on all of them, an Item on
 * its catalogue, its siblings and the homepage. Next rebuilds a page only when it is next
 * visited, so marking all of them costs nothing until someone looks.
 *
 * This hook is a cache signal, not the I/O ADR-0006 forbids in hooks: it sends nothing to
 * anyone, so firing again when Jana edits is exactly right.
 */

/** Every page the catch-all renders, both locales. See `src/app/(frontend)/[locale]`. */
const PUBLIC_PAGES = '/[locale]/[[...segments]]'

/** The sitemap lists those pages, so a page published or unpublished changes it too. */
const SITEMAP = '/sitemap.xml'

const revalidatePublicPages = (payload: Payload, context: Record<string, unknown>): void => {
  // A seed migration or script saves documents outside a Next request, where there is no
  // cache to mark. It sets this flag, as Payload's template does.
  if (context['disableRevalidate']) {
    return
  }

  try {
    revalidatePath(PUBLIC_PAGES, 'page')
    revalidatePath(SITEMAP)
  } catch (error) {
    // Outside a Next request `revalidatePath` throws; the next deploy rebuilds everything.
    payload.logger.warn({ err: error, msg: 'Public pages were not revalidated.' })
  }
}

const afterCollectionChange: CollectionAfterChangeHook = ({ doc, previousDoc, req, context }) => {
  if (changesPublicSite(doc, previousDoc)) {
    revalidatePublicPages(req.payload, context)
  }

  return doc
}

const afterCollectionDelete: CollectionAfterDeleteHook = ({ doc, req, context }) => {
  revalidatePublicPages(req.payload, context)

  return doc
}

const afterGlobalChange: GlobalAfterChangeHook = ({ doc, previousDoc, req, context }) => {
  if (changesPublicSite(doc, previousDoc)) {
    revalidatePublicPages(req.payload, context)
  }

  return doc
}

/** A collection whose content the public pages show, with the revalidation hooks added. */
export const revalidatingCollection = (collection: CollectionConfig): CollectionConfig => ({
  ...collection,
  hooks: {
    ...collection.hooks,
    afterChange: [...(collection.hooks?.afterChange ?? []), afterCollectionChange],
    afterDelete: [...(collection.hooks?.afterDelete ?? []), afterCollectionDelete],
  },
})

/** A global the public pages show, with the revalidation hook added. */
export const revalidatingGlobal = (global: GlobalConfig): GlobalConfig => ({
  ...global,
  hooks: {
    ...global.hooks,
    afterChange: [...(global.hooks?.afterChange ?? []), afterGlobalChange],
  },
})
