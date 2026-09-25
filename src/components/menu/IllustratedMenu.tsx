import { Photograph } from '@/components/site/Photograph'
import { PHOTO_FRAME, ROW_LINK, TILE_PHOTOGRAPH } from '@/components/site/pressable'
import { Reveal } from '@/components/site/Reveal'
import { categoryPrice, itemPrice, menuSpans, type MenuSpan } from '@/domain/menu'
import { itemPath, type Locale } from '@/domain/routes'
import type { Category, Item } from '@/payload-types'

import { SPAN_CLASS, SPAN_SIZES } from './spans'

/** One Category and the Items listed under it. */
export type MenuSection = { category: Category; items: Item[] }

/**
 * The illustrated menu (ADR-0004): every Category is a photograph carrying its own name,
 * tagline, Jana's note and her price, with its Items listed beneath. Not a gallery beside a
 * menu — one thing.
 *
 * What holds it off the competitors' product grids: unequal cells (`menuSpans`, still
 * binding under ADR-0007), an Item row that is one link (ADR-0007), and the name at
 * menu-card scale in the display face, never shrunk to a product label.
 *
 * `/nibbles` only. The cakes are Item tiles (`ItemTiles`, ADR-0007); Nibbles are bought as
 * a quantity and keep the card's layout until that pattern is decided for them.
 */
export const IllustratedMenu = ({
  locale,
  sections,
  preloadFirst = false,
}: {
  locale: Locale
  sections: readonly MenuSection[]
  /** Preload the first photograph, when the menu is what the page opens on (its LCP). */
  preloadFirst?: boolean
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
              preload={preloadFirst && index === 0}
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
  preload,
}: {
  locale: Locale
  category: Category
  items: Item[]
  span: MenuSpan
  preload: boolean
}) => {
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
        <h2 className="min-w-0 font-display text-[34px] leading-tight font-semibold">
          {category.name}
        </h2>
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

  // The entry is the section, and its Items are the links onward.
  const list =
    items.length > 0 ? <ItemList locale={locale} category={category} items={items} /> : null

  // A band sets its words beside the photograph, so the menu ends on one full-width row.
  return (
    <div className="group">
      {band ? (
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
      )}
    </div>
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
