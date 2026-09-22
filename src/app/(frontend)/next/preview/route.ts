import configPromise from '@payload-config'
import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { DEFAULT_LOCALE, isCatalogue, isLocale, itemPath } from '@/domain/routes'

/**
 * The Live Preview entry point. Payload's preview iframe lands here; this route enables
 * `draftMode()` and redirects to the document's real public URL, so the preview and the
 * live page are the same rendering path.
 *
 * Two things are deliberate:
 *
 * - **Authentication is Payload's own session**, read from the request cookies. The
 *   iframe is same-origin with the admin, so Jana is already logged in and there is no
 *   preview secret to leak or rotate.
 * - **`fallbackLocale: 'none'`.** Inside an English preview, an untranslated field must
 *   read empty rather than quietly showing the Dutch. That is what tells Jana what is
 *   left to translate, and the whole two-locale handover rule depends on seeing it. The
 *   page fetches behind `draftMode()` must do the same.
 */
export const GET = async (request: Request): Promise<Response> => {
  const params = new URL(request.url).searchParams
  const kind = params.get('kind')
  const slug = params.get('slug')
  const localeParam = params.get('locale')
  const locale = isLocale(localeParam) ? localeParam : DEFAULT_LOCALE

  const payload = await getPayload({ config: configPromise })

  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return new Response('You must be logged in to preview.', { status: 401 })
  }

  // The globals — the cross-contamination statement, Lead time and Closed until — have no
  // page of their own: they render site-wide, so their preview is the site's front page.
  let path = locale === DEFAULT_LOCALE ? '/' : `/${locale}`

  if (kind === 'collection' && slug === 'items') {
    const id = params.get('id')

    if (!id) {
      return new Response('Missing id.', { status: 400 })
    }

    const item = await payload.findByID({
      collection: 'items',
      id,
      locale,
      fallbackLocale: 'none',
      draft: true,
      depth: 1,
      overrideAccess: false,
      user,
    })

    const catalogue =
      typeof item.category === 'object' && item.category !== null
        ? item.category.catalogue
        : undefined

    if (typeof item.slug !== 'string' || item.slug === '' || !isCatalogue(catalogue)) {
      // Silently previewing the front page instead would look like a broken Item rather
      // than an Item with no URL in this locale yet, which is what this usually is.
      return new Response(
        `This Item has no ${locale.toUpperCase()} page yet: it needs a slug and a Category in this locale.`,
        { status: 404 },
      )
    }

    path = itemPath(catalogue, locale, item.slug)
  }

  const draft = await draftMode()
  draft.enable()

  redirect(path)
}
