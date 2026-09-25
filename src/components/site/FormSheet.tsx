'use client'

import type { ReactNode, RefObject } from 'react'

import { Sheet, SheetClose, SheetContent, SheetTitle } from '@/components/ui/sheet'

import { BUTTON_OUTLINE } from './pressable'

/**
 * The sheet a customer fills in over the page they are deciding on (ADR-0007): a bottom
 * sheet on a phone and a right-hand panel from `md` up, over the unstyled Sheet primitive,
 * so the focus trap, Escape, outside-tap, scroll lock and portal are Radix's. Dressed in
 * ADR-0004's palette and ADR-0007's shape.
 *
 * It is only the shell: a header with the title and Close, a body that scrolls on its own,
 * and an optional `footer` pinned beneath it. What it holds stays mounted while it is closed,
 * so closing it to look at the photographs again and reopening it loses nothing.
 *
 * It opens from buttons elsewhere on the page rather than a trigger of its own, so it is
 * told where focus goes back to on closing: `returnFocus`, the button that opened it.
 */
export const FormSheet = ({
  open,
  onOpenChange,
  title,
  closeLabel,
  returnFocus,
  footer,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The sheet's accessible name, and its visible heading. */
  title: string
  closeLabel: string
  /** The control focus returns to on closing: the one that opened it. */
  returnFocus: RefObject<HTMLElement | null>
  /** Pinned below the scrolling body, when a sheet has something that must stay in view. */
  footer?: ReactNode
  children: ReactNode
}) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      keepMounted
      open={open}
      onCloseAutoFocus={(event) => {
        event.preventDefault()
        returnFocus.current?.focus()
      }}
      overlayClassName="bg-ink/40"
      className={[
        'inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-card bg-ground text-ink',
        'md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[min(30rem,100vw)] md:rounded-t-none md:rounded-l-card',
        // It slides in only when motion is welcome; otherwise it is simply there.
        'motion-safe:transition-[translate] motion-safe:duration-300 motion-safe:ease-out',
        'motion-safe:starting:translate-y-full md:motion-safe:starting:translate-x-full md:motion-safe:starting:translate-y-0',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-4 border-b border-rule px-5 pt-4 pb-3 md:px-8 md:pt-6">
        <SheetTitle className="font-display text-[26px] leading-tight font-semibold">
          {title}
        </SheetTitle>
        <SheetClose className={BUTTON_OUTLINE}>{closeLabel}</SheetClose>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 md:px-8">
        {children}
      </div>
      {footer ? (
        <div className="border-t border-rule bg-raised px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-8">
          {footer}
        </div>
      ) : null}
    </SheetContent>
  </Sheet>
)
