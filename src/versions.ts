import type { GlobalConfig } from 'payload'

/**
 * Payload does not export the drafts configuration type on its own, so it is narrowed out
 * of a global's `versions`, which takes the same shape a collection's does.
 */
type Versions = Extract<NonNullable<GlobalConfig['versions']>, { drafts?: unknown }>
type DraftsConfiguration = NonNullable<Versions['drafts']>

/**
 * Drafts plus autosave — the precondition for Live Preview, and the reason Jana's work
 * survives the browser. One definition, used by every collection and global that has a
 * preview, so the autosave policy is one edit rather than four.
 *
 * `schedulePublish` stays off: it needs a job queue this project does not run, and
 * without one a scheduled publish fails silently, which is worse than not offering it.
 */
export const DRAFTS_WITH_AUTOSAVE: DraftsConfiguration = {
  autosave: {
    interval: 375,
  },
  schedulePublish: false,
  // Published is a whole-document state: an Item is Published only once it is complete in
  // both locales. A handover rule Jana applies, not readiness logic derived here.
  localizeStatus: false,
}
