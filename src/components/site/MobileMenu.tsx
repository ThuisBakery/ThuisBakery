'use client'

import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

import type { ResolvedLink } from '@/domain/links'

import { BUTTON, BUTTON_OUTLINE, NAV_LINK } from './pressable'

/**
 * The header navigation below `md`, where four links, a button, the switcher and the
 * wordmark do not fit on one line. A shadcn Sheet for the behaviour — focus trap, Escape,
 * scroll lock — dressed in ADR-0004's palette and ADR-0007's shape and states. No shadcn
 * palette, radii or shadows.
 */
export const MobileMenu = ({
  links,
  callToAction,
  labels,
}: {
  links: ResolvedLink[]
  callToAction: ResolvedLink
  labels: { menu: string; close: string; nav: string }
}) => (
  <Sheet>
    <SheetTrigger className={`${BUTTON_OUTLINE} md:hidden`}>{labels.menu}</SheetTrigger>
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
      <a
        href={callToAction.href}
        aria-current={callToAction.current ? 'page' : undefined}
        className={BUTTON}
      >
        {callToAction.label}
      </a>
    </SheetContent>
  </Sheet>
)
