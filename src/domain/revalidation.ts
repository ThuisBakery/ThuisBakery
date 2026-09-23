/**
 * Whether a save in the admin changes what customers see, and so whether the static public
 * pages must be rebuilt from fresh content.
 *
 * A document without drafts is live the moment it is saved. One with drafts changes the
 * site only when it is published, edited while published, or unpublished; an autosaved
 * draft — which Jana produces with every pause in typing — changes nothing public.
 */
export const changesPublicSite = (
  doc: Record<string, unknown>,
  previousDoc: Record<string, unknown> | null | undefined,
): boolean => {
  if (doc['_status'] === undefined) {
    return true
  }

  return doc['_status'] === 'published' || previousDoc?.['_status'] === 'published'
}
