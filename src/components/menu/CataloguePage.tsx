import { CakeStand } from '@/components/site/CakeStand'
import { NAV_LINK } from '@/components/site/pressable'
import { DICTIONARY } from '@/domain/dictionary'
import { catalogueSections } from '@/domain/menu'
import type { Catalogue, Locale } from '@/domain/routes'
import type { Category, Item } from '@/payload-types'

import { IllustratedMenu, type MenuSection } from './IllustratedMenu'
import { ItemTiles } from './ItemTiles'

/**
 * `/cakes` and `/nibbles` (ADR-0003): the catalogue's Categories as anchored sections of
 * one page. There are no Category pages; a Category is reached by in-page link, from the
 * index here or from a deep link, and its anchor is kept for exactly that.
 *
 * On `/cakes` each section is a Category heading over its Items as tiles, the same tiles as
 * the homepage (ADR-0007): the heading names the group and leads nowhere, and each tile is
 * the one link to its Item. `/nibbles` keeps the illustrated menu, each entry with its Items
 * listed beneath as Jana's card lists them.
 *
 * Takes the Payload documents as fetched, so a test renders it with the real shapes; which
 * Categories belong here is read from each Category's `catalogue`, not listed in code.
 */
export const CataloguePage = ({
  locale,
  catalogue,
  categories,
  items,
}: {
  locale: Locale
  catalogue: Catalogue
  categories: readonly Category[]
  items: readonly Item[]
}) => {
  const words = DICTIONARY[locale]
  const sections = catalogueSections(catalogue, categories, items)

  return (
    <div className="px-4 pt-10 pb-20 md:px-10 md:pt-16 md:pb-28">
      <div className="mx-auto max-w-[1400px]">
        <h1 className="text-center font-display text-[40px] leading-[1.1] font-medium md:text-6xl">
          {words.pageTitles[catalogue]}
        </h1>

        {sections.length > 1 ? (
          <nav aria-label={words.categoryIndex} className="mt-6">
            <ul className="flex flex-wrap justify-center gap-x-1 gap-y-1">
              {sections.map(({ category }) => (
                <li key={category.id}>
                  <a
                    href={`#${category.slug}`}
                    className={`inline-flex min-h-11 items-center px-3 text-[13px] tracking-wide text-ink-muted ${NAV_LINK}`}
                  >
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="mt-12 md:mt-16">
          {catalogue === 'cakes' ? (
            <CakeSections locale={locale} sections={sections} />
          ) : (
            <IllustratedMenu locale={locale} sections={sections} preloadFirst />
          )}
        </div>

        <div className="mt-16 flex justify-center">
          <CakeStand className="w-14 text-ink-muted" />
        </div>
      </div>
    </div>
  )
}

/** `/cakes`: each Category an anchored section, its heading over its Items' tiles. */
const CakeSections = ({
  locale,
  sections,
}: {
  locale: Locale
  sections: readonly MenuSection[]
}) => (
  <div className="grid gap-20 md:gap-28">
    {sections.map(({ category, items }, index) => (
      <section
        key={category.id}
        id={category.slug}
        aria-labelledby={`${category.slug}-heading`}
        className="scroll-mt-6"
      >
        <h2
          id={`${category.slug}-heading`}
          className="font-display text-[34px] leading-tight font-semibold md:text-5xl"
        >
          {category.name}
        </h2>
        <p className="mt-1.5 font-display text-lg leading-snug text-ink-muted">
          {category.tagline}
        </p>
        {category.note ? (
          <p className="mt-0.5 text-[15px] leading-[1.4] text-ink-muted">{category.note}</p>
        ) : null}
        <div className="mt-8 md:mt-10">
          <ItemTiles
            locale={locale}
            entries={items.map((item) => ({ item, category }))}
            preloadFirst={index === 0}
          />
        </div>
      </section>
    ))}
  </div>
)
