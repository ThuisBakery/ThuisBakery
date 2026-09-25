import { Photograph } from '@/components/site/Photograph'
import { PHOTO_FRAME, TILE, TILE_HEADING, TILE_PHOTOGRAPH } from '@/components/site/pressable'
import { Reveal } from '@/components/site/Reveal'
import { itemPrice, itemServings, menuSpans, type MenuSpan } from '@/domain/menu'
import { itemPath, type Locale } from '@/domain/routes'
import type { Category, Item } from '@/payload-types'

/** One Item on the menu, and the Category it is labelled with. */
export type ItemTileEntry = { item: Item; category: Category }

/** The 12-column span each tile takes from `md` up. One column on a phone. */
const SPAN_CLASS: Record<MenuSpan, string> = {
  wide: 'md:col-span-7',
  narrow: 'md:col-span-5',
  band: 'md:col-span-12',
}

/** What each tile's photograph is drawn at, so the browser fetches the right width. */
const SPAN_SIZES: Record<MenuSpan, string> = {
  wide: '(min-width: 768px) 58vw, 100vw',
  narrow: '(min-width: 768px) 42vw, 100vw',
  band: '(min-width: 768px) 62vw, 100vw',
}

/**
 * The cakes as Item tiles (ADR-0007): each Item's first photograph, its title, its Category
 * as a label and what it costs, and the whole tile one link to its Item page. A Category is
 * a label here, never a destination on the way to an Item.
 *
 * The cells stay unequal (`menuSpans`, ADR-0004, still binding): rows alternate 7/5 and 5/7,
 * and an odd tile out runs full width as a band, so the menu never reads as a product grid.
 *
 * Used by the homepage, for every cake in Jana's Category order, and by `/cakes`, once per
 * Category section. Either way the title is an `h3`, under the page's `h2`.
 */
export const ItemTiles = ({
  locale,
  entries,
  preloadFirst = false,
}: {
  locale: Locale
  entries: readonly ItemTileEntry[]
  /** Preload the first photograph, when the tiles are what the page opens on (its LCP). */
  preloadFirst?: boolean
}) => {
  const spans = menuSpans(entries.length)

  return (
    <ul className="grid gap-12 md:grid-cols-12 md:gap-x-8 md:gap-y-16">
      {entries.map(({ item, category }, index) => {
        const span = spans[index] ?? 'band'

        return (
          <Reveal
            as="li"
            key={item.id}
            delay={index % 2 === 1 ? 80 : 0}
            className={SPAN_CLASS[span]}
          >
            <ItemTile
              locale={locale}
              item={item}
              category={category}
              span={span}
              preload={preloadFirst && index === 0}
            />
          </Reveal>
        )
      })}
    </ul>
  )
}

const ItemTile = ({
  locale,
  item,
  category,
  span,
  preload,
}: {
  locale: Locale
  item: Item
  category: Category
  span: MenuSpan
  preload: boolean
}) => {
  const price = itemPrice(item.sizes, locale)?.price
  const servings = itemServings(item.sizes, locale)
  const band = span === 'band'

  return (
    <a href={itemPath(category.catalogue, locale, item.slug)} className={TILE}>
      {/* A band sets its words beside the photograph, so a menu ends on one full-width row. */}
      <div
        className={
          band ? 'grid items-center gap-5 md:grid-cols-[1.6fr_1fr] md:gap-12' : 'grid gap-4'
        }
      >
        <div className={PHOTO_FRAME}>
          <Photograph
            media={item.photographs?.[0]}
            sizes={SPAN_SIZES[span]}
            preload={preload}
            className={`aspect-[4/3] w-full object-cover ${TILE_PHOTOGRAPH} ${
              band ? 'md:aspect-auto md:h-[46vh]' : 'md:aspect-auto md:h-[52vh]'
            }`}
          />
        </div>
        <div>
          <p className="text-[13px] tracking-wide text-ink-muted">{category.name}</p>
          <h3
            className={`mt-1 font-display text-[28px] leading-tight font-semibold md:text-[32px] ${TILE_HEADING}`}
          >
            {item.title}
          </h3>
          {price || servings ? (
            <p className="mt-1.5 font-sans text-sm tracking-wide tabular-nums">
              {price ? <span>{price}</span> : null}
              {price && servings ? <span aria-hidden="true"> · </span> : null}
              {servings ? <span className="text-ink-muted">{servings}</span> : null}
            </p>
          ) : null}
        </div>
      </div>
    </a>
  )
}
