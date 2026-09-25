'use client'

import { useRef, useState } from 'react'

import { SomethingCustom } from '@/components/enquiry/CustomOrderHost'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { ResolvedLink } from '@/domain/links'
import type { Locale } from '@/domain/routes'

import { BUTTON, BUTTON_OUTLINE, NAV_LINK } from './pressable'

/**
 * The header navigation below `md`, where four links, a button, the switcher and the
 * wordmark do not fit on one line. A shadcn Sheet for the behaviour — focus trap, Escape,
 * scroll lock — dressed in ADR-0004's palette and ADR-0007's shape and states. No shadcn
 * palette, radii or shadows.
 *
 * When the button leads to Custom order, it closes the menu and opens the Custom order sheet
 * in place (ADR-0007); closing that sheet gives focus back to the Menu button, since the
 * button inside the menu is gone by then.
 */
export const MobileMenu = ({
  locale,
  links,
  callToAction,
  opensCustomOrder,
  labels,
}: {
  locale: Locale
  links: ResolvedLink[]
  callToAction: ResolvedLink
  /** The button is the link to Custom order. */
  opensCustomOrder: boolean
  labels: { menu: string; close: string; nav: string }
}) => {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger ref={trigger} className={`${BUTTON_OUTLINE} md:hidden`}>
        {labels.menu}
      </SheetTrigger>
      <SheetContent
        className="inset-y-0 right-0 flex w-[min(22rem,85vw)] flex-col gap-10 bg-ground px-6 py-6 text-ink"
        overlayClassName="bg-ink/40"
      >
        <div className="flex items-center justify-between">
          <SheetTitle className="font-display text-2xl">{labels.menu}</SheetTitle>
          <SheetClose className={BUTTON_OUTLINE}>{labels.close}</SheetClose>
        </div>
        <nav aria-label={labels.nav}>
          <ul className="flex flex-col gap-5">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  aria-current={link.current ? 'page' : undefined}
                  className={`font-display text-3xl ${NAV_LINK}`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {opensCustomOrder ? (
          <SomethingCustom
            locale={locale}
            current={callToAction.current}
            returnFocus={trigger}
            onOpen={() => setOpen(false)}
            className={BUTTON}
          >
            {callToAction.label}
          </SomethingCustom>
        ) : (
          <a
            href={callToAction.href}
            aria-current={callToAction.current ? 'page' : undefined}
            className={BUTTON}
          >
            {callToAction.label}
          </a>
        )}
      </SheetContent>
    </Sheet>
  )
}
