import type { TextField } from 'payload'

import { RESERVED_SLUGS, isReservedSlug } from '@/domain/routes'

/**
 * A localized, per-locale-unique URL slug that may not take one of the site's own
 * addresses. Items and marketing pages share it: a marketing page sits at the bare root,
 * where a coded segment would shadow it and leave it silently unreachable, so the reserved
 * slugs are rejected here, at validation time (ADR-0003).
 *
 * Postgres scopes a unique index on a localized field to `(value, _locale)` in the
 * `_locales` table, so English and Dutch may each use `appeltaart` without colliding.
 * Payload documents the per-locale behaviour for MongoDB only; this was read out of
 * `@payloadcms/drizzle` rather than assumed.
 */
export const slugField = (description: string): TextField => ({
  name: 'slug',
  type: 'text',
  required: true,
  localized: true,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description,
  },
  validate: (value: string | null | undefined) => {
    if (typeof value !== 'string' || value.trim() === '') {
      return 'A slug is required.'
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
      return 'Use lowercase letters, numbers and hyphens only.'
    }

    if (isReservedSlug(value)) {
      return `“${value}” is one of the site’s own page addresses and cannot be used as a slug. Reserved: ${RESERVED_SLUGS.join(', ')}.`
    }

    return true
  },
})
