'use client'

import { createContext, use, useRef, useState, type ReactNode } from 'react'

import { EnquiryForm, type CatalogueLink } from '@/components/enquiry/EnquiryForm'
import type { ItemOffer } from '@/domain/enquiry'
import type { StoredLeadTime } from '@/domain/lead-time'
import type { Locale } from '@/domain/routes'

/** Opens the sheet, remembering which button did, so focus can go back to it. */
const OpenEnquiry = createContext<((opener: HTMLElement) => void) | null>(null)

/**
 * The Item page's Enquiry: the stepped sheet over the page (ADR-0007). The page has more
 * than one **Ask Jana for this cake** (the details column's, and the phone's sticky bar), so
 * the sheet sits around the page and each button reaches it through context.
 *
 * It takes the same offer and sends the same Enquiry the page always has.
 */
export const ItemEnquiry = ({
  locale,
  offer,
  leadTime,
  closedUntil,
  closedNotice,
  contactPath,
  catalogue,
  children,
}: {
  locale: Locale
  offer: ItemOffer
  leadTime: StoredLeadTime | null
  closedUntil: string | null | undefined
  closedNotice: string | null | undefined
  contactPath: string
  /** The catalogue the Item is from: where the confirmation leads back to. */
  catalogue: CatalogueLink
  /** The page, with its **Ask Jana for this cake** buttons somewhere inside. */
  children: ReactNode
}) => {
  const [open, setOpen] = useState(false)
  const opener = useRef<HTMLElement | null>(null)

  const openFrom = (button: HTMLElement) => {
    opener.current = button
    setOpen(true)
  }

  return (
    <OpenEnquiry value={openFrom}>
      {children}
      <EnquiryForm
        locale={locale}
        offer={offer}
        leadTime={leadTime}
        closedUntil={closedUntil}
        closedNotice={closedNotice}
        contactPath={contactPath}
        catalogue={catalogue}
        open={open}
        onOpenChange={setOpen}
        returnFocus={opener}
      />
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
