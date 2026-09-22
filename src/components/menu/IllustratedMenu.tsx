import Image from 'next/image'
import type { ReactNode } from 'react'

import { categoryPrice, itemPrice, menuSpans, type MenuSpan } from '@/domain/menu'
import { itemPath, type Locale } from '@/domain/routes'
import type { Category, Item, Media } from '@/payload-types'

import { Reveal } from './Reveal'

/** One Category and the Items listed under it. */
export type MenuSection = { category: Category; items: Item[] }

/** The 12-column span each cell takes from `md` up. One column on a phone. */
const SPAN_CLASS: Record<MenuSpan, string> = {
  wide: 'md:col-span-7',
  narrow: 'md:col-span-5',
  band: 'md:col-span-12',
}

/** What each cell's photograph is drawn at, so the browser fetches the right width. */
const SPAN_SIZES: Record<MenuSpan, string> = {
  wide: '(min-width: 768px) 58vw, 100vw',
  narrow: '(min-width: 768px) 42vw, 100vw',
  band: '(min-width: 768px) 62vw, 100vw',
}

/**
 * The illustrated menu (ADR-0004): every Category is a photograph carrying its own name,
 * tagline, Jana's italic note and her price. Not a gallery beside a menu — one thing.
 *
 * Three rules hold it off the competitors' product grids, and are binding: unequal cells
 * (`menuSpans`), no buy buttons anywhere — an entry with somewhere to go is one link, and
 * an Item row is one link — and the name at menu-card scale in her serif, never shrunk to
 * a product label.
 *
 * Built for `/cakes` and `/nibbles`, and reused by the homepage, which passes
 * `categoryHref` to send each entry to its section of the catalogue.
 */
export const IllustratedMenu = ({
  locale,
  sections,
  categoryHref,
  preloadFirst = false,
  headingLevel = 2,
}: {
  locale: Locale
  sections: readonly MenuSection[]
  /** Where an entry leads. Without it the entry is the section itself and its Items lead on. */
  categoryHref?: (category: Category) => string
  /** Preload the first photograph, when the menu is what the page opens on (its LCP). */
  preloadFirst?: boolean
  headingLevel?: 2 | 3
}) => {
  const spans = menuSpans(sections.length)

  return (
    <ul className="grid gap-14 md:grid-cols-12 md:gap-x-8 md:gap-y-20">
      {sections.map(({ category, items }, index) => {
        const span = spans[index] ?? 'band'

        return (
          <Reveal
            as="li"
            key={category.id}
            id={category.slug}
            delay={index % 2 === 1 ? 80 : 0}
            className={`scroll-mt-6 ${SPAN_CLASS[span]}`}
          >
            <Entry
              locale={locale}
              category={category}
              items={items}
              span={span}
              href={categoryHref?.(category)}
              preload={preloadFirst && index === 0}
              headingLevel={headingLevel}
            />
          </Reveal>
        )
      })}
    </ul>
  )
}

const Entry = ({
  locale,
  category,
  items,
  span,
  href,
  preload,
  headingLevel,
}: {
  locale: Locale
  category: Category
  items: Item[]
  span: MenuSpan
  href: string | undefined
  preload: boolean
  headingLevel: 2 | 3
}) => {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  const price = categoryPrice(category, locale)
  const band = span === 'band'

  const photograph = (
    <div className="overflow-hidden bg-raised">
      <Photograph
        media={category.photograph}
        sizes={SPAN_SIZES[span]}
        preload={preload}
        className={`aspect-[4/3] w-full object-cover group-hover:scale-[1.03] motion-safe:transition-transform motion-safe:duration-700 ${
          band ? 'md:aspect-auto md:h-[46vh]' : 'md:aspect-auto md:h-[54vh]'
        }`}
      />
    </div>
  )

  const words = (
    <div className={band ? '' : 'pt-5'}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <Heading className="font-display text-[30px] leading-tight font-semibold md:text-[34px]">
          {category.name}
        </Heading>
        {price ? (
          <p className="font-sans text-sm tracking-wide whitespace-nowrap tabular-nums">{price}</p>
        ) : null}
      </div>
      <p className="mt-1.5 font-display text-lg leading-snug text-ink-muted">{category.tagline}</p>
      {category.note ? (
        <p className="mt-0.5 font-display text-[16px] leading-[1.4] text-ink-muted italic">
          {category.note}
        </p>
      ) : null}
    </div>
  )

  // On a catalogue page the entry is the section, and its Items are the links onward.
  const list =
    !href && items.length > 0 ? (
      <ItemList locale={locale} category={category} items={items} />
    ) : null

  // A band sets its words beside the photograph, so the menu ends on one full-width row.
  const content: ReactNode = band ? (
    <div className="grid items-center gap-6 md:grid-cols-[1.6fr_1fr] md:gap-12">
      {photograph}
      <div>
        {words}
        {list}
      </div>
    </div>
  ) : (
    <>
      {photograph}
      {words}
      {list}
    </>
  )

  return href ? (
    <a href={href} className="group block transition-transform duration-200 active:translate-y-px">
      {content}
    </a>
  ) : (
    <div className="group">{content}</div>
  )
}

/**
 * A tier's Items, typeset as the card sets Specialty and Nibbles: the name, and its price
 * on the same line. Each row is one link to the Item's page — the Item page is where an
 * Enquiry starts (ADR-0003).
 */
const ItemList = ({
  locale,
  category,
  items,
}: {
  locale: Locale
  category: Category
  items: Item[]
}) => (
  <ul className="mt-6 border-t border-rule">
    {items.map((item) => {
      const price = itemPrice(item.sizes, locale)

      return (
        <li key={item.id} className="border-b border-rule">
          <a
            href={itemPath(category.catalogue, locale, item.slug)}
            className="flex min-h-12 items-baseline justify-between gap-4 py-3 transition-colors duration-200 hover:text-accent active:bg-raised"
          >
            <span className="font-display text-xl leading-snug">{item.title}</span>
            {price ? (
              <span className="shrink-0 text-right font-sans text-sm tracking-wide tabular-nums">
                {price.price}
                {price.size ? <span className="text-ink-muted"> · {price.size}</span> : null}
              </span>
            ) : null}
          </a>
        </li>
      )
    })}
  </ul>
)

/**
 * A Category's photograph at its real dimensions, cropped around the focal point Jana set
 * on it. Lazy unless it is the page's LCP.
 */
const Photograph = ({
  media,
  sizes,
  preload,
  className,
}: {
  media: number | Media | null | undefined
  sizes: string
  preload: boolean
  className: string
}) => {
  if (!media || typeof media === 'number' || !media.url) {
    // Unpopulated or missing: hold the space rather than collapse the cell.
    return <div className={className} aria-hidden="true" />
  }

  return (
    <Image
      src={media.url}
      alt={media.alt ?? ''}
      width={media.width ?? 1600}
      height={media.height ?? 1200}
      sizes={sizes}
      preload={preload}
      className={className}
      style={{ objectPosition: `${media.focalX ?? 50}% ${media.focalY ?? 50}%` }}
    />
  )
}
