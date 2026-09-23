import configPromise from '@payload-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { locale } from 'next/root-params'
import { getPayload, type Payload } from 'payload'

import { HomePage } from '@/components/home/HomePage'
import { ItemPage } from '@/components/item/ItemPage'
import { CataloguePage } from '@/components/menu/CataloguePage'
import { PageShell } from '@/components/site/PageShell'
import { Placeholder } from '@/components/site/Placeholder'
import { alternates } from '@/domain/alternates'
import { DICTIONARY, documentTitle, itemTitle } from '@/domain/dictionary'
import {
  LOCALES,
  CODED_PAGES,
  cataloguePath,
  isCatalogue,
  isLocale,
  itemSegments,
  otherLocale,
  pagePath,
  pageSegments,
  resolveItem,
  resolvePage,
  type Catalogue,
  type Locale,
  type CodedPage,
} from '@/domain/routes'
import { itemListings, readyItemIds, type ItemListing } from '@/lib/items'
import { siteOrigin } from '@/lib/site'

type Props = { params: Promise<{ segments?: string[] }> }

/**
 * Every public URL, both locales, through one catch-all (ADR-0002). The static segments
 * come from the route map, not from route folders.
 *
 * This file fetches and does nothing else: `PageShell` renders. Everything here runs at
 * build time — `dynamicParams = false` means a path not listed below is a 404, never a
 * request-time render — so no public page reads the database once deployed.
 */
export const dynamicParams = false

export const generateStaticParams = async () => {
  const current = await locale()
  const locales: readonly Locale[] = isLocale(current) ? [current] : LOCALES
  const listings = await itemListings()

  return locales.flatMap((each) => [
    ...CODED_PAGES.map((page) => ({ segments: pageSegments(page, each) })),
    // An Item untranslated in a locale has no path there, so no page (ADR-0002).
    ...listings.flatMap(({ catalogue, slugs }) => {
      const slug = slugs[each]

      return slug === undefined ? [] : [{ segments: itemSegments(catalogue, each, slug) }]
    }),
  ])
}

/** What a request is for: a coded page, or an Item with a URL in this locale. */
type Resolved =
  | { locale: Locale; kind: 'page'; page: CodedPage }
  | { locale: Locale; kind: 'item'; listing: ItemListing }

/** The locale and page or Item a request is for, or a 404. */
const resolve = async ({ params }: Props): Promise<Resolved> => {
  const [current, { segments = [] }] = await Promise.all([locale(), params])

  if (!isLocale(current)) {
    notFound()
  }

  const page = resolvePage(current, segments)

  if (page !== null) {
    return { locale: current, kind: 'page', page }
  }

  const named = resolveItem(current, segments)

  if (named !== null) {
    const listing = (await itemListings()).find(
      (each) => each.catalogue === named.catalogue && each.slugs[current] === named.slug,
    )

    if (listing) {
      return { locale: current, kind: 'item', listing }
    }
  }

  notFound()
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const resolved = await resolve(props)
  const { locale: current } = resolved

  if (resolved.kind === 'item') {
    return {
      title: itemTitle(resolved.listing.titles[current] ?? ''),
      // Built from the locales the Item is ready in only: a missing one is omitted, never
      // pointed at a 404.
      alternates: alternates(resolved.listing.paths, current, siteOrigin()),
    }
  }

  return {
    title: documentTitle(resolved.page, current),
    alternates: alternates(
      { en: pagePath(resolved.page, 'en'), nl: pagePath(resolved.page, 'nl') },
      current,
      siteOrigin(),
    ),
  }
}

export default async function Page(props: Props) {
  const resolved = await resolve(props)
  const { locale: current } = resolved
  const payload = await getPayload({ config: configPromise })

  const [header, footer] = await Promise.all([
    payload.findGlobal({ slug: 'header', locale: current, depth: 0 }),
    payload.findGlobal({ slug: 'footer', locale: current, depth: 0 }),
  ])

  if (resolved.kind === 'item') {
    const { catalogue, paths } = resolved.listing
    const other = otherLocale(current)

    return (
      <PageShell
        locale={current}
        page={catalogue}
        // The same Item in the other locale, or its catalogue there when it is untranslated.
        alternate={paths[other] ?? cataloguePath(catalogue, other)}
        header={header}
        footer={footer}
      >
        <ItemPage
          locale={current}
          catalogue={catalogue}
          origin={siteOrigin()}
          {...await fetchItem(payload, resolved.listing, current)}
        />
      </PageShell>
    )
  }

  const { page } = resolved

  return (
    <PageShell locale={current} page={page} header={header} footer={footer}>
      {page === 'home' ? (
        <HomePage locale={current} {...await fetchHome(payload, current)} />
      ) : isCatalogue(page) ? (
        <CataloguePage
          locale={current}
          catalogue={page}
          {...await fetchCatalogue(payload, page, current)}
        />
      ) : (
        <Placeholder title={DICTIONARY[current].pageTitles[page]} />
      )}
    </PageShell>
  )
}

/**
 * An Item page's documents: the Item, populated deep enough for its Allergens' icons; its
 * catalogue's other Items with a URL here, for the siblings; every Sponge and Filling, for
 * an Item that names none of its own; and the two globals it states.
 *
 * Read with locale fallback on. Whether the Item has a URL here was settled without it
 * (`itemListings`); what remains — a Size's label, a Filling's name — is exactly what
 * ADR-0002 keeps `fallback` on for.
 */
const fetchItem = async (payload: Payload, listing: ItemListing, current: Locale) => {
  // Never empty: the Item itself has a URL here.
  const siblings = await readyItemIds(current, listing.catalogue)

  const [
    item,
    { docs: items },
    { docs: sponges },
    { docs: fillings },
    leadTime,
    crossContamination,
  ] = await Promise.all([
    payload.findByID({ collection: 'items', id: listing.id, depth: 2, locale: current }),
    payload.find({
      collection: 'items',
      where: { id: { in: siblings } },
      depth: 0,
      locale: current,
      pagination: false,
    }),
    payload.find({ collection: 'sponges', sort: 'name', locale: current, pagination: false }),
    payload.find({ collection: 'fillings', sort: 'name', locale: current, pagination: false }),
    payload.findGlobal({ slug: 'lead-time', depth: 0 }),
    payload.findGlobal({ slug: 'cross-contamination', locale: current, depth: 0 }),
  ])

  return {
    item,
    items,
    sponges,
    fillings,
    leadTime,
    statement: crossContamination.statement,
    // Occasion pages are marketing pages, which the Pages collection (issue #26) brings.
    // Until it lands no Occasion has a page, so none is linked rather than one linked to a
    // 404; #26 fills this map from the Page each Occasion is written up on.
    occasionPages: new Map<number, string>(),
  }
}

/**
 * A catalogue page's Categories, with their photographs, and the Items filed under them that
 * have a URL in this locale. One untranslated here is left off rather than listed with a
 * link to a 404 (ADR-0002); `itemListings` is what decides, by the same rule the Item page
 * itself is generated by.
 */
const fetchCatalogue = async (payload: Payload, page: Catalogue, current: Locale) => {
  const [{ docs: categories }, ready] = await Promise.all([
    payload.find({
      collection: 'categories',
      where: { catalogue: { equals: page } },
      sort: 'order',
      depth: 1,
      limit: 100,
      locale: current,
      pagination: false,
    }),
    readyItemIds(current, page),
  ])

  const { docs: items } =
    ready.length === 0
      ? { docs: [] }
      : await payload.find({
          collection: 'items',
          where: { id: { in: ready } },
          sort: 'title',
          depth: 0,
          locale: current,
          pagination: false,
        })

  return { categories, items }
}

/**
 * The homepage's words, and the three things it states that are kept elsewhere: every
 * Category (the menu and the starting price), the Lead time, and the cross-contamination
 * statement. Globals are read as published — the static page is what customers see.
 */
const fetchHome = async (payload: Payload, current: Locale) => {
  const [home, { docs: categories }, leadTime, crossContamination] = await Promise.all([
    payload.findGlobal({ slug: 'home', locale: current, depth: 1 }),
    payload.find({
      collection: 'categories',
      sort: 'order',
      depth: 1,
      locale: current,
      pagination: false,
    }),
    payload.findGlobal({ slug: 'lead-time', depth: 0 }),
    payload.findGlobal({ slug: 'cross-contamination', locale: current, depth: 0 }),
  ])

  return { home, categories, leadTime, statement: crossContamination.statement }
}
