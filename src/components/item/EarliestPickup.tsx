'use client'

import { useRequestedPickupCalendar } from '@/components/enquiry/form-parts'
import { DICTIONARY } from '@/domain/dictionary'
import type { StoredLeadTime } from '@/domain/lead-time'
import type { Locale } from '@/domain/routes'

/**
 * The earliest Requested pickup date, beside the Lead time. The page is static, so today is
 * only known in the browser: the built HTML leaves it out, and it appears once the page runs,
 * reckoned exactly as the Enquiry form's date field does.
 */
export const EarliestPickup = ({
  locale,
  leadTime,
  closedUntil,
}: {
  locale: Locale
  leadTime: StoredLeadTime | null
  closedUntil: string | null | undefined
}) => {
  const { earliest, display } = useRequestedPickupCalendar({ locale, leadTime, closedUntil })

  return earliest ? (
    <p className="mt-1 text-sm text-ink-muted">
      {DICTIONARY[locale].enquiry.earliest(display(earliest))}
    </p>
  ) : null
}
