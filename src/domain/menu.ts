import type { Catalogue, Locale } from './routes'
import { DICTIONARY } from './dictionary'

/**
 * The illustrated menu's arithmetic and wording (ADR-0004): how a price reads, which cells
 * run wide, and which Categories a catalogue page shows. Plain shapes in, plain values out;
 * the components map Payload documents onto these.
 */

/**
 * A euro amount the way Jana's card sets it: `€29`, `€10.50`. Whole euros carry no
 * decimals. Not `Intl.NumberFormat`, whose Dutch output (`€ 29,00`) is correct but is not
 * her card.
 */
export const formatEuros = (amount: number, locale: Locale): string => {
  const figure = Number.isInteger(amount) ? String(amount) : amount.toFixed(2)

  return `€${locale === 'nl' ? figure.replace('.', ',') : figure}`
}

/** A Category's price as Jana sets it on the card: a figure, and whether it is a floor. */
export type CategoryPrice = {
  price?: number | null
  priceFrom?: boolean | null
}

/**
 * The price line under a Category's name — `€29`, `from €25` — or `null` for a tier the
 * card prices Item by Item (Specialty, Nibbles).
 */
export const categoryPrice = (
  { price, priceFrom }: CategoryPrice,
  locale: Locale,
): string | null => {
  if (price === null || price === undefined) {
    return null
  }

  return priced(price, Boolean(priceFrom), locale)
}

/** A figure, prefixed `from` when it is a floor rather than the price. */
const priced = (amount: number, floor: boolean, locale: Locale): string => {
  const figure = formatEuros(amount, locale)

  return floor ? `${DICTIONARY[locale].priceFrom} ${figure}` : figure
}

/** What a menu row needs of a Size. */
export type PricedSize = { label: string; price: number }

/**
 * An Item's row on the menu: its price and, when it comes one way only, what that one way
 * is — `€10.50 · 6 large cookies`, as the card sets Nibbles. An Item in several Sizes
 * starts from the cheapest; the Item page lists them all.
 */
export const itemPrice = (
  sizes: readonly PricedSize[],
  locale: Locale,
): { price: string; size: string | null } | null => {
  const [only, ...rest] = sizes

  if (!only) {
    return null
  }

  if (rest.length === 0) {
    return { price: formatEuros(only.price, locale), size: only.label }
  }

  const lowest = Math.min(...sizes.map((size) => size.price))
  const varies = sizes.some((size) => size.price !== lowest)

  return { price: priced(lowest, varies, locale), size: null }
}

/** How wide a menu cell runs: 7 or 5 of 12 columns, or the full width as a band. */
export type MenuSpan = 'wide' | 'narrow' | 'band'

/**
 * The unequal cells that keep the menu from reading as a product grid (ADR-0004, binding):
 * rows alternate 7/5 and 5/7, and an odd entry out runs full width as a band.
 */
export const menuSpans = (count: number): MenuSpan[] =>
  Array.from({ length: count }, (_, index): MenuSpan => {
    if (index === count - 1 && count % 2 === 1) {
      return 'band'
    }

    const row = Math.floor(index / 2)
    const first = index % 2 === 0

    return (row % 2 === 0) === first ? 'wide' : 'narrow'
  })

/** What sorting a catalogue needs of a Category. */
export type SectionCategory = { id: number | string; catalogue: string; order: number }

/** What filing an Item needs: its Category, by id or populated. */
export type SectionItem = { category: number | string | { id: number | string } }

/**
 * A catalogue page's sections: the Categories whose `catalogue` is this page, lowest
 * `order` first, each with its own Items in the order given. Which page a Category is on is
 * read from the Category (ADR-0003), so a sixth Category is a content change.
 */
export const catalogueSections = <C extends SectionCategory, I extends SectionItem>(
  catalogue: Catalogue,
  categories: readonly C[],
  items: readonly I[],
): { category: C; items: I[] }[] =>
  categories
    .filter((category) => category.catalogue === catalogue)
    .sort((a, b) => a.order - b.order)
    .map((category) => ({
      category,
      items: items.filter((item) => {
        const id = typeof item.category === 'object' ? item.category.id : item.category

        return id === category.id
      }),
    }))
