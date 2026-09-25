import { RichText } from '@payloadcms/richtext-lexical/react'
import Image from 'next/image'

import { JsonLd } from '@/components/site/JsonLd'
import { Photograph } from '@/components/site/Photograph'
import {
  BUTTON,
  BUTTON_SMALL,
  CHIP_LINK,
  COMPACT_TILE,
  NAV_LINK,
  TILE_HEADING,
} from '@/components/site/pressable'
import { DICTIONARY } from '@/domain/dictionary'
import { itemOffer } from '@/domain/enquiry'
import { leadTimeFact } from '@/domain/home'
import {
  itemLeadTime,
  occasionLinks,
  plainText,
  siblingItems,
  splitDescription,
} from '@/domain/item'
import { formatEuros, itemPrice, itemServings, sizeDetail } from '@/domain/menu'
import { cataloguePath, itemPath, pagePath, type Catalogue, type Locale } from '@/domain/routes'
import { breadcrumbMarkup, productMarkup } from '@/domain/structured-data'
import type { ClosedUntil, Filling, Item, LeadTime, Media, Sponge } from '@/payload-types'

import { EarliestPickup } from './EarliestPickup'
import { Gallery } from './Gallery'
import { AskJana, ItemEnquiry } from './ItemEnquiry'
import { More } from './More'

/** A section's small heading down the details column. */
const LABEL = 'font-sans text-[13px] tracking-wide text-ink-muted'

/** Where the gallery and the details column stick from `md` up: both stay in view. */
const STICKY = 'md:sticky md:top-6 md:self-start'

/**
 * `/cakes/<slug>` and `/nl/taarten/<slug>` (ADR-0003): the page a customer decides on
 * (ADR-0007). On a phone, before any scroll, it shows the Category, the title, the price and
 * servings, the first paragraph of the description and **Ask Jana for this cake**, which the
 * phone's sticky bar repeats. On a desktop the gallery and the details column both stay in
 * view as the page scrolls.
 *
 * Item pages are the SEO destinations, so this is also where `Product`/`offers` and
 * `BreadcrumbList` are carried, and every value they mark up is printed here, outside the
 * sheet (ADR-0002): every Size with its price is listed in the details column.
 *
 * The Enquiry opens in a stepped sheet over the page, holding the Item's offer from
 * `itemOffer`, the same derivation the route handler checks.
 *
 * The links are the ones ADR-0003 specifies for an Item, in a compact row at the foot: two
 * or three siblings computed from Item data, its Occasion pages, and Custom order.
 *
 * Takes the Payload documents as fetched, so a test renders it with the real shapes.
 */
export const ItemPage = ({
  locale,
  catalogue,
  item,
  items,
  sponges,
  fillings,
  leadTime,
  closedUntil,
  statement,
  occasionPages,
  origin,
}: {
  locale: Locale
  catalogue: Catalogue
  /** The Item, populated: Category, photographs, choices, Allergens with icons, Occasions. */
  item: Item
  /** Every Item with a URL in this locale, from which the siblings are chosen. */
  items: readonly Item[]
  /** Every Sponge, offered when the Item names none of its own. */
  sponges: readonly Sponge[]
  /** Every Filling, offered when the Item names none of its own. */
  fillings: readonly Filling[]
  /** The site-wide Lead time; empty when the global has never been saved. */
  leadTime: Partial<Pick<LeadTime, 'days' | 'timeOfDay'>>
  /** The Closed until global, in this locale; empty when it has never been saved. */
  closedUntil: Partial<Pick<ClosedUntil, 'date' | 'notice'>>
  statement: string | null | undefined
  /** Each Occasion's page in this locale, by Occasion id. */
  occasionPages: ReadonlyMap<number | string, string>
  /** The site's origin, which the structured data is fully qualified against. */
  origin: string
}) => {
  const words = DICTIONARY[locale]
  const category = populated(item.category)
  const path = itemPath(catalogue, locale, item.slug)
  const photographs = (item.photographs ?? []).filter(isMedia)
  const description = item.description ? splitDescription(item.description) : null
  const offer = itemOffer(item, sponges, fillings)

  const trail = [
    { name: words.item.home, path: pagePath('home', locale) },
    { name: words.pageTitles[catalogue], path: cataloguePath(catalogue, locale) },
    { name: item.title, path },
  ]

  const structuredData = [
    productMarkup(
      {
        name: item.title,
        description: plainText(item.description),
        path,
        images: photographs.flatMap((photograph) => (photograph.url ? [photograph.url] : [])),
        sizes: item.sizes,
      },
      origin,
    ),
    breadcrumbMarkup(trail, origin),
  ]

  const figures = itemLeadTime(leadTime, item.leadTime)
  const fact = figures ? leadTimeFact(figures, locale) : null
  const price = itemPrice(item.sizes, locale)
  const servings = itemServings(item.sizes, locale)

  const siblings = siblingItems(
    candidate(item, catalogue),
    items.map((each) => candidate(each, catalogue)),
  )
  const occasions = occasionLinks(item.occasions ?? [], occasionPages)

  return (
    <ItemEnquiry
      locale={locale}
      offer={offer}
      leadTime={figures}
      closedUntil={closedUntil.date}
      closedNotice={closedUntil.notice}
      contactPath={pagePath('contact', locale)}
      catalogue={{ name: words.pageTitles[catalogue], path: cataloguePath(catalogue, locale) }}
    >
      <article className="px-4 pt-2 pb-28 md:px-10 md:pt-6 md:pb-28">
        <JsonLd data={structuredData} />

        <div className="mx-auto max-w-[1400px]">
          <nav aria-label={words.item.breadcrumb}>
            <ol className="flex flex-wrap items-center gap-x-2 text-[13px] tracking-wide text-ink-muted">
              {trail.map((crumb, index) => {
                const last = index === trail.length - 1

                return (
                  <li
                    key={crumb.path}
                    className="flex items-center gap-x-2 [&+&]:before:content-['/']"
                  >
                    {last ? (
                      <span aria-current="page" className="text-ink">
                        {crumb.name}
                      </span>
                    ) : (
                      <a
                        href={crumb.path}
                        className={`inline-flex min-h-11 items-center ${NAV_LINK}`}
                      >
                        {crumb.name}
                      </a>
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>

          <div className="mt-2 grid gap-6 md:mt-4 md:grid-cols-12 md:gap-x-12">
            <div className={`md:col-span-7 ${STICKY}`}>
              <Gallery photographs={photographs} label={words.item.showPhotograph} />
            </div>

            <div className={`md:col-span-5 ${STICKY}`}>
              {category ? (
                // The Category's label, and the way back to its section (ADR-0003).
                <a
                  href={`${cataloguePath(catalogue, locale)}#${category.slug}`}
                  className={`${LABEL} inline-flex min-h-11 items-center ${NAV_LINK}`}
                >
                  {category.name}
                </a>
              ) : null}
              <h1 className="mt-1 font-display text-[34px] leading-[1.1] font-medium md:text-6xl">
                {item.title}
              </h1>

              {price || servings ? (
                <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
                  {price ? (
                    <span className="text-xl font-semibold tabular-nums">{price.price}</span>
                  ) : null}
                  {servings ? <span className="text-ink-muted">{servings}</span> : null}
                </p>
              ) : null}

              {description ? (
                <div className="mt-3 text-lg leading-relaxed">
                  <RichText data={description.lead} />
                  {description.rest ? (
                    <More more={words.item.more} less={words.item.less}>
                      <RichText data={description.rest} className="mt-4 space-y-4" />
                    </More>
                  ) : null}
                </div>
              ) : null}

              {fact ? (
                <section aria-labelledby="lead-time-heading" className="mt-8">
                  <h2 id="lead-time-heading" className={LABEL}>
                    {words.item.leadTime}
                  </h2>
                  <p className="mt-1 font-display text-2xl">{fact.title}</p>
                  {fact.detail ? (
                    <p className="mt-1 text-sm text-ink-muted">{fact.detail}</p>
                  ) : null}
                  <EarliestPickup
                    locale={locale}
                    leadTime={figures}
                    closedUntil={closedUntil.date}
                  />
                </section>
              ) : null}

              <section aria-labelledby="sizes-heading" className="mt-8">
                <h2 id="sizes-heading" className={LABEL}>
                  {words.item.sizes}
                </h2>
                <ul aria-labelledby="sizes-heading" className="mt-2 border-t border-rule">
                  {offer.sizes.map((size) => {
                    const detail = sizeDetail(size, locale)

                    return (
                      <li
                        key={size.id}
                        className="flex flex-wrap items-baseline gap-x-3 border-b border-rule py-2"
                      >
                        <span>{size.label}</span>
                        {detail ? <span className="text-sm text-ink-muted">{detail}</span> : null}
                        <span className="ml-auto tabular-nums">
                          {formatEuros(size.price, locale)}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </section>

              <div className="mt-8">
                <AskJana className={`${BUTTON} w-full`}>{words.item.ask}</AskJana>
              </div>

              <Allergens
                label={words.item.allergens}
                allergens={(item.allergens ?? []).flatMap((allergen) =>
                  typeof allergen === 'object' ? [allergen] : [],
                )}
                statement={statement}
              />
            </div>
          </div>

          <section aria-labelledby="more-heading" className="mt-16 border-t border-rule pt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
              <h2
                id="more-heading"
                className="font-display text-[26px] leading-tight font-semibold"
              >
                {words.item.siblings}
              </h2>
              <div className="flex flex-wrap gap-2">
                {occasions.length > 0 ? (
                  <ul aria-label={words.item.occasions} className="flex flex-wrap gap-2">
                    {occasions.map((occasion) => (
                      <li key={occasion.href}>
                        <a href={occasion.href} className={CHIP_LINK}>
                          {occasion.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <a href={pagePath('customOrder', locale)} className={CHIP_LINK}>
                  {words.somethingCustom}
                </a>
              </div>
            </div>

            {siblings.length > 0 ? (
              <nav aria-label={words.item.siblings} className="mt-6">
                <ul className="grid gap-3 md:grid-cols-3">
                  {siblings.map(({ item: sibling }) => {
                    const siblingPrice = itemPrice(sibling.sizes, locale)

                    return (
                      <li key={sibling.id}>
                        <a
                          href={itemPath(catalogue, locale, sibling.slug)}
                          className={COMPACT_TILE}
                        >
                          <Photograph
                            media={(sibling.photographs ?? []).find(isMedia)}
                            sizes="4.5rem"
                            preload={false}
                            className="size-[4.5rem] shrink-0 rounded-card object-cover"
                          />
                          <span className="min-w-0">
                            <span
                              className={`block font-display text-lg leading-snug ${TILE_HEADING}`}
                            >
                              {sibling.title}
                            </span>
                            {siblingPrice ? (
                              <span className="block text-sm text-ink-muted tabular-nums">
                                {siblingPrice.price}
                              </span>
                            ) : null}
                          </span>
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            ) : null}
          </section>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-raised/95 px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <p className="min-w-0 flex-1 truncate font-display text-lg">{item.title}</p>
            <AskJana className={BUTTON_SMALL}>{words.item.ask}</AskJana>
          </div>
        </div>
      </article>
    </ItemEnquiry>
  )
}

const populated = <T extends object>(value: number | T | null | undefined): T | null =>
  typeof value === 'object' && value !== null ? value : null

const isMedia = (value: number | Media): value is Media => typeof value === 'object'

/**
 * What choosing siblings needs of an Item. Every Item here has a URL in this catalogue,
 * so the catalogue is the page's; the Item rides along so its link can be built.
 */
const candidate = (item: Item, catalogue: Catalogue) => ({
  id: item.id,
  title: item.title,
  category: typeof item.category === 'object' ? item.category.id : item.category,
  catalogue,
  item,
})

/**
 * The Allergens, each with its icon, and the cross-contamination statement beside them —
 * never one without the other (CONTEXT.md). The icon is decorative: the name is printed.
 */
const Allergens = ({
  label,
  allergens,
  statement,
}: {
  label: string
  allergens: { id: number; name: string; icon: number | Media }[]
  statement: string | null | undefined
}) => {
  const headingId = 'allergens-heading'

  return (
    <section aria-labelledby={headingId} className="mt-8 border-t border-rule pt-6">
      <h2 id={headingId} className={LABEL}>
        {label}
      </h2>
      {allergens.length > 0 ? (
        <ul aria-labelledby={headingId} className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          {allergens.map((allergen) => {
            const icon = populated(allergen.icon)

            return (
              <li key={allergen.id} className="flex items-center gap-2 text-sm">
                {icon?.url ? (
                  <Image src={icon.url} alt="" width={24} height={24} className="size-6" />
                ) : null}
                {allergen.name}
              </li>
            )
          })}
        </ul>
      ) : null}
      {statement ? (
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">{statement}</p>
      ) : null}
    </section>
  )
}
