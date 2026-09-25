'use client'

import { createContext, use, useRef, useState, type ReactNode } from 'react'

import { EnquiryForm } from '@/components/enquiry/EnquiryForm'
import { FormSheet } from '@/components/site/FormSheet'
import { DICTIONARY } from '@/domain/dictionary'
import type { ItemOffer } from '@/domain/enquiry'
import type { StoredLeadTime } from '@/domain/lead-time'
import type { Locale } from '@/domain/routes'

/** Opens the sheet, remembering which button did, so focus can go back to it. */
const OpenEnquiry = createContext<((opener: HTMLElement) => void) | null>(null)

/**
 * The Item page's Enquiry: the existing form, in a sheet over the page (ADR-0007). The page
 * has more than one **Ask Jana for this cake** (the details column's, and the phone's sticky
 * bar), so the sheet sits around the page and each button reaches it through context.
 *
 * The form is the one the page always had, taking the same offer and sending the same
 * Enquiry; only where it is shown has changed.
 */
export const ItemEnquiry = ({
  locale,
  offer,
  leadTime,
  closedUntil,
  closedNotice,
  contactPath,
  children,
}: {
  locale: Locale
  offer: ItemOffer
  leadTime: StoredLeadTime | null
  closedUntil: string | null | undefined
  closedNotice: string | null | undefined
  contactPath: string
  /** The page, with its **Ask Jana for this cake** buttons somewhere inside. */
  children: ReactNode
}) => {
  const words = DICTIONARY[locale]
  const [open, setOpen] = useState(false)
  const opener = useRef<HTMLElement | null>(null)

  const openFrom = (button: HTMLElement) => {
    opener.current = button
    setOpen(true)
  }

  return (
    <OpenEnquiry value={openFrom}>
      {children}
      <FormSheet
        open={open}
        onOpenChange={setOpen}
        title={words.enquiry.heading}
        closeLabel={words.close}
        returnFocus={opener}
      >
        <p className="mt-4 leading-relaxed text-ink-muted">{words.enquiry.intro}</p>
        <EnquiryForm
          locale={locale}
          offer={offer}
          leadTime={leadTime}
          closedUntil={closedUntil}
          closedNotice={closedNotice}
          contactPath={contactPath}
        />
      </FormSheet>
    </OpenEnquiry>
  )
}

/** **Ask Jana for this cake**: opens the Enquiry sheet. Only inside `ItemEnquiry`. */
export const AskJana = ({ className, children }: { className: string; children: ReactNode }) => {
  const open = use(OpenEnquiry)

  if (!open) {
    throw new Error('AskJana opens the Enquiry sheet, so it must sit inside ItemEnquiry.')
  }

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={(event) => open(event.currentTarget)}
      className={className}
    >
      {children}
    </button>
  )
}
