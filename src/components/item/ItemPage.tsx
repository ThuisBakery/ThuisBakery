import { RichText } from '@payloadcms/richtext-lexical/react'
import Image from 'next/image'

import { EnquiryForm } from '@/components/enquiry/EnquiryForm'
import { CakeStand } from '@/components/site/CakeStand'
import { Photograph } from '@/components/site/Photograph'
import { DICTIONARY } from '@/domain/dictionary'
import { itemOffer } from '@/domain/enquiry'
import { leadTimeFact } from '@/domain/home'
import {
  itemLeadTime,
  occasionLinks,
  offeredChoices,
  plainText,
  siblingItems,
  surcharge,
} from '@/domain/item'
import { formatEuros } from '@/domain/menu'
import { cataloguePath, itemPath, pagePath, type Catalogue, type Locale } from '@/domain/routes'
import { breadcrumbMarkup, productMarkup } from '@/domain/structured-data'
import type { ClosedUntil, Filling, Item, LeadTime, Media, Sponge } from '@/payload-types'

/** The one secondary link style, as the homepage sets it. */
const TEXT_LINK =
  'inline-flex min-h-11 items-center text-sm tracking-wide underline underline-offset-4 transition-colors duration-200 hover:text-accent'

/** The Enquiry section's anchor, which the call to action near the top jumps to. */
const ENQUIRY_ID = 'enquire'

/** A section's small heading down the details column. */
const LABEL = 'font-sans text-[13px] tracking-wide text-ink-muted'

/**
 * `/cakes/<slug>` and `/nl/taarten/<slug>` (ADR-0003): everything a customer needs to
 * decide — the photographs, every Size with its price, the Sponges and Fillings with any
 * Surcharge, the Allergens beside the cross-contamination statement, and how far ahead to
 * ask. Item pages are the SEO destinations, so this is also where `Product`/`offers` and
 * `BreadcrumbList` are carried, and every value they mark up is printed here (ADR-0002).
 *
 * It ends at the Enquiry, which ADR-0003 keeps welded to the Item it prices: the form is
 * scoped to this Item's Sizes and choices, with a running Estimate.
 *
 * The links are the ones ADR-0003 specifies for an Item: its Category's section, two or
 * three siblings computed from Item data, its Occasion pages, and Custom order.
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
  const description = plainText(item.description)

  const trail = [
    { name: words.item.home, path: pagePath('home', locale) },
    { name: words.pageTitles[catalogue], path: cataloguePath(catalogue, locale) },
    { name: item.title, path },
  ]

  const structuredData = [
    productMarkup(
      {
        name: item.title,
        description,
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

  const siblings = siblingItems(
    candidate(item, catalogue),
    items.map((each) => candidate(each, catalogue)),
  )
  const occasions = occasionLinks(item.occasions ?? [], occasionPages)

  return (
    <article className="px-4 pt-6 pb-20 md:px-10 md:pt-10 md:pb-28">
      {structuredData.map((data) => (
        <script
          key={String(data['@type'])}
          type="application/ld+json"
          // JSON-LD is data, not markup: `<` is escaped so no value can close the tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
        />
      ))}

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
                      className="inline-flex min-h-11 items-center hover:text-ink"
                    >
                      {crumb.name}
                    </a>
                  )}
                </li>
              )
            })}
          </ol>
        </nav>

        <div className="mt-4 grid gap-10 md:mt-8 md:grid-cols-12 md:gap-x-12">
          <Photographs photographs={photographs} />

          <div className="md:col-span-5">
            <h1 className="font-display text-[40px] leading-[1.1] font-medium md:text-6xl">
              {item.title}
            </h1>
            {category ? (
              <a
                href={`${cataloguePath(catalogue, locale)}#${category.slug}`}
                className={TEXT_LINK}
              >
                {words.item.moreOf(category.name)}
              </a>
            ) : null}

            {item.description ? (
              <RichText
                data={item.description}
                className="mt-6 space-y-4 font-display text-lg leading-relaxed"
              />
            ) : null}

            <Sizes locale={locale} sizes={item.sizes} />

            {item.configurable ? (
              <>
                <Choices
                  label={words.item.sponge}
                  choices={offeredChoices(item.sponges, sponges).map(({ id, name }) => ({
                    id,
                    name,
                  }))}
                />
                <Choices
                  label={words.item.filling}
                  choices={offeredChoices(item.fillings, fillings).map(
                    ({ id, name, surcharge: amount }) => ({
                      id,
                      name,
                      surcharge: surcharge(amount, locale),
                    }),
                  )}
                />
              </>
            ) : null}

            {fact ? (
              <section className="mt-10">
                <h2 className={LABEL}>{words.item.leadTime}</h2>
                <p className="mt-2 font-display text-2xl">{fact.title}</p>
                {fact.detail ? <p className="mt-1 text-sm text-ink-muted">{fact.detail}</p> : null}
              </section>
            ) : null}

            <a
              href={`#${ENQUIRY_ID}`}
              className="mt-8 inline-flex min-h-12 items-center bg-accent px-8 py-3.5 text-sm tracking-wide text-accent-ink motion-safe:transition-transform motion-safe:duration-200 motion-safe:active:translate-y-px"
            >
              {words.enquiry.heading}
            </a>

            <Allergens
              label={words.item.allergens}
              allergens={(item.allergens ?? []).flatMap((allergen) =>
                typeof allergen === 'object' ? [allergen] : [],
              )}
              statement={statement}
            />

            {occasions.length > 0 ? (
              <section className="mt-10">
                <h2 className={LABEL}>{words.item.occasions}</h2>
                <ul className="mt-1 flex flex-wrap gap-x-5">
                  {occasions.map((occasion) => (
                    <li key={occasion.href}>
                      <a href={occasion.href} className={TEXT_LINK}>
                        {occasion.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>

        <section
          id={ENQUIRY_ID}
          aria-labelledby={`${ENQUIRY_ID}-heading`}
          className="mt-20 grid scroll-mt-24 gap-6 border-t border-rule pt-12 md:mt-28 md:grid-cols-12 md:gap-x-12"
        >
          <div className="md:col-span-5">
            <h2
              id={`${ENQUIRY_ID}-heading`}
              className="font-display text-[34px] leading-tight font-semibold"
            >
              {words.enquiry.heading}
            </h2>
            <p className="mt-3 leading-relaxed text-ink-muted">{words.enquiry.intro}</p>
          </div>
          <div className="md:col-span-7">
            <EnquiryForm
              locale={locale}
              offer={itemOffer(item, sponges, fillings)}
              leadTime={figures}
              closedUntil={closedUntil.date}
              closedNotice={closedUntil.notice}
              contactPath={pagePath('contact', locale)}
            />
          </div>
        </section>

        {siblings.length > 0 ? (
          <nav aria-label={words.item.siblings} className="mt-20 md:mt-28">
            <h2 className="font-display text-[34px] leading-tight font-semibold">
              {words.item.siblings}
            </h2>
            <ul className="mt-6 border-t border-rule">
              {siblings.map(({ item: sibling }) => (
                <li key={sibling.id} className="border-b border-rule">
                  <a
                    href={itemPath(catalogue, locale, sibling.slug)}
                    className="flex min-h-12 items-baseline justify-between gap-4 py-3 transition-colors duration-200 hover:text-accent active:bg-raised"
                  >
                    <span className="font-display text-xl leading-snug">{sibling.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <CakeStand className="w-14 text-ink-muted" />
          <p className="mt-4 font-display text-2xl">{words.item.somethingElse}</p>
          <a href={pagePath('customOrder', locale)} className={TEXT_LINK}>
            {words.pageTitles.customOrder}
          </a>
        </div>
      </div>
    </article>
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

const Photographs = ({ photographs }: { photographs: Media[] }) => {
  const [first, ...rest] = photographs

  return (
    <div className="grid gap-4 md:col-span-7">
      <div className="overflow-hidden bg-raised">
        <Photograph
          media={first}
          sizes="(min-width: 768px) 58vw, 100vw"
          preload
          className="aspect-[4/5] w-full object-cover md:aspect-[4/3]"
        />
      </div>
      {rest.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {rest.map((photograph) => (
            <div key={photograph.id} className="overflow-hidden bg-raised">
              <Photograph
                media={photograph}
                sizes="(min-width: 768px) 29vw, 50vw"
                preload={false}
                className="aspect-square w-full object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/** Every Size, printed: the price is visible because `offers` marks it up (ADR-0002). */
const Sizes = ({ locale, sizes }: { locale: Locale; sizes: Item['sizes'] }) => {
  const words = DICTIONARY[locale].item
  const headingId = 'sizes-heading'

  return (
    <section className="mt-10">
      <h2 id={headingId} className={LABEL}>
        {words.sizes}
      </h2>
      <ul aria-labelledby={headingId} className="mt-2 border-t border-rule">
        {sizes.map((size) => {
          const details = [
            typeof size.diameter === 'number' ? words.diameter(size.diameter) : null,
            typeof size.layers === 'number' ? words.layers(size.layers) : null,
            typeof size.servings === 'number' ? words.servings(size.servings) : null,
          ].filter((detail) => detail !== null)

          return (
            <li
              key={size.id ?? size.label}
              className="flex items-baseline justify-between gap-4 border-b border-rule py-3"
            >
              <span>
                <span className="font-display text-xl">{size.label}</span>
                {details.length > 0 ? (
                  <span className="block text-sm text-ink-muted">{details.join(' · ')}</span>
                ) : null}
              </span>
              <span className="shrink-0 text-sm tracking-wide tabular-nums">
                {formatEuros(size.price, locale)}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const Choices = ({
  label,
  choices,
}: {
  label: string
  choices: { id: number; name: string; surcharge?: string | null }[]
}) => {
  if (choices.length === 0) {
    return null
  }

  const headingId = `choices-${label.toLowerCase()}`

  return (
    <section className="mt-8">
      <h2 id={headingId} className={LABEL}>
        {label}
      </h2>
      <ul aria-labelledby={headingId} className="mt-2 flex flex-wrap gap-2">
        {choices.map((choice) => (
          <li key={choice.id} className="border border-rule px-3 py-1.5 text-sm">
            {choice.name}
            {choice.surcharge ? (
              <span className="ml-1.5 text-ink-muted tabular-nums">{choice.surcharge}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

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
    <section className="mt-10">
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
