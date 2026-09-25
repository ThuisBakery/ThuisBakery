'use client'

import { Dialog as SheetPrimitive } from 'radix-ui'
import type { ComponentProps } from 'react'

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

export const SheetContent = ({
  className,
  overlayClassName,
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> & { overlayClassName?: string }) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn('fixed inset-0 z-50', overlayClassName)}
    />
    <SheetPrimitive.Content
      data-slot="sheet-content"
      // No description element: the nav inside is its own description.
      aria-describedby={undefined}
      className={cn('fixed z-50', className)}
      {...props}
    />
  </SheetPrimitive.Portal>
)
