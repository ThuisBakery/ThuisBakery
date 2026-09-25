import type { ReactNode } from 'react'

import { Photograph } from '@/components/site/Photograph'
import {
  PHOTO_FRAME,
  ROW_LINK,
  TILE,
  TILE_HEADING,
  TILE_PHOTOGRAPH,
} from '@/components/site/pressable'
import { Reveal } from '@/components/site/Reveal'
import { categoryPrice, itemPrice, menuSpans, type MenuSpan } from '@/domain/menu'
import { itemPath, type Locale } from '@/domain/routes'
import type { Category, Item } from '@/payload-types'

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
 * tagline, Jana's note and her price. Not a gallery beside a menu — one thing.
 *
 * What holds it off the competitors' product grids: unequal cells (`menuSpans`, still
 * binding under ADR-0007), an entry with somewhere to go that is one pressable tile and an
 * Item row that is one link (ADR-0007), and the name at menu-card scale in the display
 * face, never shrunk to a product label.
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
  /** 2 on a catalogue page, where each Category is a section; 3 under a heading of its own. */
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
    <div className={PHOTO_FRAME}>
      <Photograph
        media={category.photograph}
        sizes={SPAN_SIZES[span]}
        preload={preload}
        className={`aspect-[4/3] w-full object-cover ${TILE_PHOTOGRAPH} ${
          band ? 'md:aspect-auto md:h-[46vh]' : 'md:aspect-auto md:h-[54vh]'
        }`}
      />
    </div>
  )

  const words = (
    <div className={band ? '' : 'pt-5'}>
      <div className="flex items-baseline justify-between gap-x-4">
        <Heading
          className={`min-w-0 font-display text-[34px] leading-tight font-semibold ${href ? TILE_HEADING : ''}`}
        >
          {category.name}
        </Heading>
        {price ? (
          <p className="shrink-0 font-sans text-sm tracking-wide whitespace-nowrap tabular-nums">
            {price}
          </p>
        ) : null}
      </div>
      <p className="mt-1.5 font-display text-lg leading-snug text-ink-muted">{category.tagline}</p>
      {category.note ? (
        <p className="mt-0.5 text-[15px] leading-[1.4] text-ink-muted">{category.note}</p>
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
    <a href={href} className={TILE}>
      {content}
    </a>
  ) : (
    <div className="group">{content}</div>
  )
}

/**
 * A Category's Items, typeset as the card sets Specialty and Nibbles: the name, and its price
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
      const row = itemPrice(item.sizes, locale)

      return (
        <li key={item.id} className="border-b border-rule">
          <a href={itemPath(category.catalogue, locale, item.slug)} className={ROW_LINK}>
            <span className="font-display text-xl leading-snug">{item.title}</span>
            {row ? (
              <span className="shrink-0 text-right font-sans text-sm tracking-wide tabular-nums">
                {row.price}
                {row.size ? <span className="text-ink-muted"> · {row.size}</span> : null}
              </span>
            ) : null}
          </a>
        </li>
      )
    })}
  </ul>
)
