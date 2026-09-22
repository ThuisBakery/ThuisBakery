import type { GlobalConfig } from 'payload'

import { leadTimeFields } from '@/fields/leadTime'
import { DRAFTS_WITH_AUTOSAVE } from '@/versions'

/**
 * Lead time — how far ahead of a Requested pickup date an Enquiry must arrive, expressed
 * as a number of days *and* a time of day. The pair, never the days alone: "three days"
 * without a time of day does not say whether an Enquiry sent at eleven at night counts as
 * today. See CONTEXT.md and `src/domain/lead-time.ts`, which is where the arithmetic
 * lives.
 *
 * Set here for the whole site, and overridable per Item.
 */
export const LeadTimeGlobal: GlobalConfig = {
  slug: 'lead-time',
  label: 'Lead time',
  versions: {
    drafts: DRAFTS_WITH_AUTOSAVE,
  },
  fields: leadTimeFields({ required: true }),
}
