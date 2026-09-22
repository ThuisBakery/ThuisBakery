import { CakeStand } from '@/components/site/CakeStand'
import { DICTIONARY } from '@/domain/dictionary'
import { catalogueSections } from '@/domain/menu'
import type { Catalogue, Locale } from '@/domain/routes'
import type { Category, Item } from '@/payload-types'

import { IllustratedMenu } from './IllustratedMenu'

/**
 * `/cakes` and `/nibbles` (ADR-0003): the catalogue's Categories as anchored sections of
 * one page, each an illustrated menu entry with its Items listed beneath, as Jana's card
 * lists them. There are no Category pages; a Category is reached by in-page link, from the
 * index here or from the homepage.
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
                    className="inline-flex min-h-11 items-center px-3 text-[13px] tracking-wide text-ink-muted transition-colors duration-200 hover:text-ink active:translate-y-px"
                  >
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="mt-12 md:mt-16">
          <IllustratedMenu locale={locale} sections={sections} preloadFirst />
        </div>

        <div className="mt-16 flex justify-center">
          <CakeStand className="w-14 text-ink-muted" />
        </div>
      </div>
    </div>
  )
}
