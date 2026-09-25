import type { MenuSpan } from '@/domain/menu'

/*
 * How a menu cell of each span is drawn, for the illustrated menu and the Item tiles alike,
 * so the unequal cells (`menuSpans`, ADR-0004) follow one rule wherever the menu is set.
 */

/** The 12-column span each cell takes from `md` up. One column on a phone. */
export const SPAN_CLASS: Record<MenuSpan, string> = {
  wide: 'md:col-span-7',
  narrow: 'md:col-span-5',
  band: 'md:col-span-12',
}

/** What each cell's photograph is drawn at, so the browser fetches the right width. */
export const SPAN_SIZES: Record<MenuSpan, string> = {
  wide: '(min-width: 768px) 58vw, 100vw',
  narrow: '(min-width: 768px) 42vw, 100vw',
  band: '(min-width: 768px) 62vw, 100vw',
}
