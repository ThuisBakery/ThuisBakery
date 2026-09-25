'use client'

import { Dialog as SheetPrimitive } from 'radix-ui'
import { Activity, type ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/*
 * shadcn/ui's Sheet, kept as an **unstyled primitive**: the Radix Dialog behaviour (focus
 * trap, Escape, scroll lock, portal, ARIA) and the `data-slot` structure, with shadcn's
 * default styling removed. ThuisBakery's look is ADR-0004's palette with ADR-0007's type,
 * corners and states, applied by whoever composes this — never shadcn's palette, radii or
 * shadows.
 */

export const Sheet = (props: ComponentProps<typeof SheetPrimitive.Root>) => (
  <SheetPrimitive.Root data-slot="sheet" {...props} />
)

export const SheetTrigger = (props: ComponentProps<typeof SheetPrimitive.Trigger>) => (
  <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
)

export const SheetClose = (props: ComponentProps<typeof SheetPrimitive.Close>) => (
  <SheetPrimitive.Close data-slot="sheet-close" {...props} />
)

export const SheetTitle = (props: ComponentProps<typeof SheetPrimitive.Title>) => (
  <SheetPrimitive.Title data-slot="sheet-title" {...props} />
)

/**
 * Radix unmounts a closed sheet's content, and whatever was typed into it goes with it. A
 * sheet that holds a form passes `keepMounted` with its `open`: the content then stays
 * mounted while closed, hidden by React's `Activity`, which keeps its state and switches its
 * effects off. So the focus trap, the scroll lock and the hiding of the page behind let go
 * as they would on unmount, and take hold again when it reopens.
 */
type KeepMounted = { keepMounted?: false; open?: never } | { keepMounted: true; open: boolean }

export const SheetContent = ({
  className,
  overlayClassName,
  keepMounted,
  open,
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> & {
  overlayClassName?: string
} & KeepMounted) => {
  const mounted = keepMounted ? ({ forceMount: true } as const) : {}
  const layers = (
    <>
      <SheetPrimitive.Overlay
        data-slot="sheet-overlay"
        {...mounted}
        className={cn('fixed inset-0 z-50', overlayClassName)}
      />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        // No description element: what the sheet holds describes itself.
        aria-describedby={undefined}
        {...mounted}
        className={cn('fixed z-50', className)}
        {...props}
      />
    </>
  )

  return keepMounted ? (
    <SheetPrimitive.Portal forceMount>
      <Activity mode={open ? 'visible' : 'hidden'}>{layers}</Activity>
    </SheetPrimitive.Portal>
  ) : (
    <SheetPrimitive.Portal>{layers}</SheetPrimitive.Portal>
  )
}
