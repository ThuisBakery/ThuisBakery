'use client'

import {
  createContext,
  use,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from 'react'

import type { StoredLeadTime } from '@/domain/lead-time'
import { pagePath, type Locale } from '@/domain/routes'

import { CustomOrderForm } from './CustomOrderForm'

/** Opens the Custom order sheet, remembering what focus goes back to on closing. */
const OpenCustomOrder = createContext<((returnTo: HTMLElement | null) => void) | null>(null)

/**
 * The site-wide host of the Custom order sheet (ADR-0007): a Custom order can start from any
 * page, with no scroll first, so the sheet sits around every page, in the frontend layout,
 * and every **Something custom** control reaches it through context.
 *
 * The layout fetches the Lead time and Closed until once and hands them here, so the When
 * step's calendar is held to them on whichever page the sheet opens from.
 *
 * Once an Enquiry is sent, the sheet shows the confirmation until it is closed; opened again
 * after that, it starts a new Custom order rather than showing the old one.
 */
export const CustomOrderHost = ({
  locale,
  leadTime,
  closedUntil,
  closedNotice,
  children,
}: {
  locale: Locale
  /** The site-wide Lead time; `null` when the global has never been saved. */
  leadTime: StoredLeadTime | null
  /** The Closed until global's date, as stored. */
  closedUntil: string | null | undefined
  /** What Jana wrote to say she is closed, in this locale. */
  closedNotice: string | null | undefined
  children: ReactNode
}) => {
  const [open, setOpen] = useState(false)
  // Which Custom order the sheet holds: a new one once the last was sent and closed.
  const [round, setRound] = useState(0)
  const sent = useRef(false)
  const returnFocus = useRef<HTMLElement | null>(null)

  const openFrom = (returnTo: HTMLElement | null) => {
    returnFocus.current = returnTo

    if (sent.current) {
      sent.current = false
      setRound((current) => current + 1)
    }

    setOpen(true)
  }

  return (
    <OpenCustomOrder value={openFrom}>
      {children}
      <CustomOrderForm
        key={round}
        locale={locale}
        leadTime={leadTime}
        closedUntil={closedUntil}
        closedNotice={closedNotice}
        contactPath={pagePath('contact', locale)}
        open={open}
        onOpenChange={setOpen}
        onSent={() => {
          sent.current = true
        }}
        returnFocus={returnFocus}
      />
    </OpenCustomOrder>
  )
}

/**
 * A **Something custom** control: a real link to the Custom order page, so it works before
 * scripts run and without them. Once they run, inside `CustomOrderHost`, a plain click opens
 * the Custom order sheet in place instead. A click with a modifier key, to open the page in a
 * new tab or window, is left to the browser.
 *
 * Focus goes back to the link on closing, or to `returnFocus` when the link will be gone by
 * then: the header's phone menu closes as the sheet opens.
 */
export const SomethingCustom = ({
  locale,
  className,
  current,
  returnFocus,
  onOpen,
  children,
}: {
  locale: Locale
  className: string
  /** On the Custom order page itself, the link is marked as the current page. */
  current?: boolean
  returnFocus?: RefObject<HTMLElement | null>
  /** Called as the sheet opens in place. */
  onOpen?: () => void
  children: ReactNode
}) => {
  const open = use(OpenCustomOrder)

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const plain =
      event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey

    if (!open || !plain) {
      return
    }

    event.preventDefault()
    onOpen?.()
    open(returnFocus ? returnFocus.current : event.currentTarget)
  }

  return (
    <a
      href={pagePath('customOrder', locale)}
      aria-current={current ? 'page' : undefined}
      onClick={onClick}
      className={className}
    >
      {children}
    </a>
  )
}
