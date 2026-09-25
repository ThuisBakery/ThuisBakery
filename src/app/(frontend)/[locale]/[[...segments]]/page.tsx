import configPromise from '@payload-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { locale } from 'next/root-params'
import { getPayload, type Payload } from 'payload'

import { AboutPage } from '@/components/about/AboutPage'
import { ContactPage } from '@/components/contact/ContactPage'
import { CustomOrderPage } from '@/components/contact/CustomOrderPage'
import { EnquirySent } from '@/components/enquiry/EnquirySent'
import { HomePage } from '@/components/home/HomePage'
import { ItemPage } from '@/components/item/ItemPage'
import { MarketingPage } from '@/components/page/MarketingPage'
import { CataloguePage } from '@/components/menu/CataloguePage'
import { PageShell } from '@/components/site/PageShell'
import { PrivacyPage } from '@/components/privacy/PrivacyPage'
import { alternates } from '@/domain/alternates'
import { documentTitle } from '@/domain/dictionary'
import { linkTargets, occasionPages } from '@/domain/page'
import {
  LOCALES,
  CODED_PAGES,
  cataloguePath,
  isLocale,
  itemSegments,
  marketingPageSegments,
  otherLocale,
  pagePath,
  pageSegments,
  resolveItem,
  resolveMarketingPage,
  resolvePage,
  type Catalogue,
  type Locale,
  type CodedPage,
} from '@/domain/routes'
import { descriptionFallback, isIndexed, metaDescription, metaTitle } from '@/domain/seo'
import { itemListings, readyItemIds, type ItemListing } from '@/lib/items'
import { pageListings, type PageListing } from '@/lib/pages'
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
  const [listings, pages] = await Promise.all([itemListings(), pageListings()])

  return locales.flatMap((each) => [
    ...CODED_PAGES.map((page) => ({ segments: pageSegments(page, each) })),
    // An Item untranslated in a locale has no path there, so no page (ADR-0002).
    ...listings.flatMap(({ catalogue, slugs }) => {
      const slug = slugs[each]

      return slug === undefined ? [] : [{ segments: itemSegments(catalogue, each, slug) }]
    }),
    // A marketing page untranslated in a locale has no path there either.
    ...pages.flatMap(({ slugs }) => {
      const slug = slugs[each]

      return slug === undefined ? [] : [{ segments: marketingPageSegments(slug) }]
    }),
  ])
}

/** What a request is for: a coded page, or an Item or marketing page with a URL in this locale. */
type Resolved =
  | { locale: Locale; kind: 'page'; page: CodedPage }
  | { locale: Locale; kind: 'item'; listing: ItemListing }
  | { locale: Locale; kind: 'marketing'; listing: PageListing }

/** The locale and page, Item or marketing page a request is for, or a 404. */
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

  const slug = resolveMarketingPage(current, segments)

  if (slug !== null) {
    const listing = (await pageListings()).find((each) => each.slugs[current] === slug)

    if (listing) {
      return { locale: current, kind: 'marketing', listing }
    }
  }

  notFound()
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const resolved = await resolve(props)
  const { locale: current } = resolved

  if (resolved.kind === 'item' || resolved.kind === 'marketing') {
    const { title, description } = await fetchMeta(resolved, current)

    return {
      title,
      ...(description === undefined ? {} : { description }),
      // Built from the locales the Item is ready in only: a missing one is omitted, never
      // pointed at a 404.
      alternates: alternates(resolved.listing.paths, current, siteOrigin()),
    }
  }

  return {
    title: documentTitle(resolved.page, current),
    // A receipt reached only by sending an Enquiry: nothing for a search engine to list,
    // and left out of the sitemap by the same rule.
    ...(isIndexed(resolved.page) ? {} : { robots: { index: false } }),
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

  if (resolved.kind === 'marketing') {
    const { paths } = resolved.listing
    const other = otherLocale(current)

    return (
      <PageShell
        locale={current}
        // Not in the nav (ADR-0003), so no nav link is marked as the current page.
        page={null}
        // The same page in the other locale, or that locale's home when it is untranslated.
        alternate={paths[other] ?? pagePath('home', other)}
        header={header}
        footer={footer}
      >
        <MarketingPage
          locale={current}
          {...await fetchMarketingPage(payload, resolved.listing, current)}
        />
      </PageShell>
    )
  }

  const { page } = resolved

  return (
    <PageShell locale={current} page={page} header={header} footer={footer}>
      {await codedPage(payload, page, current)}
    </PageShell>
  )
}

/** A coded page's content, fetched and handed to the component that renders it. */
const codedPage = async (payload: Payload, page: CodedPage, current: Locale) => {
  switch (page) {
    case 'home':
      return <HomePage locale={current} {...await fetchHome(payload, current)} />
    case 'cakes':
    case 'nibbles':
      return (
        <CataloguePage
          locale={current}
          catalogue={page}
          {...await fetchCatalogue(payload, page, current)}
        />
      )
    case 'customOrder':
      return <CustomOrderPage locale={current} {...await fetchCustomOrder(payload, current)} />
    case 'about':
      return <AboutPage locale={current} {...await fetchAbout(payload, current)} />
    case 'contact':
      return (
        <ContactPage
          locale={current}
          origin={siteOrigin()}
          {...await fetchContact(payload, current)}
        />
      )
    case 'privacy':
      return <PrivacyPage locale={current} {...await fetchPrivacy(payload, current)} />
    case 'enquirySent':
      return (
        <EnquirySent
          locale={current}
          contactPath={pagePath('contact', current)}
          {...await fetchEnquirySent(payload)}
        />
      )
  }
}

/**
 * An Item or marketing page's `<title>` and description: what Jana wrote in the SEO fields,
 * or the computed fallback (`src/domain/seo.ts`).
 *
 * Read with locale fallback **off**, like readiness: with it on, an English title Jana
 * wrote would head the Dutch search result, and a blank Dutch description would be cut
 * from the English text rather than the Dutch.
 */
const fetchMeta = async (
  resolved: Extract<Resolved, { kind: 'item' | 'marketing' }>,
  current: Locale,
): Promise<{ title: string; description: string | undefined }> => {
  const payload = await getPayload({ config: configPromise })
  const name = resolved.listing.titles[current] ?? ''
  const read = {
    id: resolved.listing.id,
    depth: 0,
    locale: current,
    fallbackLocale: 'none',
  } as const

  if (resolved.kind === 'item') {
    const item = await payload.findByID({
      ...read,
      collection: 'items',
      select: { meta: true, description: true },
    })

    return {
      title: metaTitle(item.meta, name),
      description: metaDescription(item.meta, descriptionFallback('items', item)),
    }
  }

  const page = await payload.findByID({
    ...read,
    collection: 'pages',
    select: { meta: true, hero: true, layout: true },
  })

  return {
    title: metaTitle(page.meta, name),
    description: metaDescription(page.meta, descriptionFallback('pages', page)),
  }
}

/**
 * An Item page's documents: the Item, populated deep enough for its Allergens' icons; its
 * catalogue's other Items with a URL here, for the siblings; every Sponge and Filling, for
 * an Item that names none of its own; and the three globals it states or its Enquiry form
 * is held to.
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
    closedUntil,
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
    payload.findGlobal({ slug: 'closed-until', locale: current, depth: 0 }),
    payload.findGlobal({ slug: 'cross-contamination', locale: current, depth: 0 }),
  ])

  return {
    item,
    items,
    sponges,
    fillings,
    leadTime,
    closedUntil,
    statement: crossContamination.statement,
    // Occasion pages are marketing pages with their Occasion set; one untranslated here is
    // left out rather than linked to a 404.
    occasionPages: occasionPages(await pageListings(), current),
  }
}

/**
 * A marketing page's documents: the page, populated for its photographs; where its links
 * lead in this locale; and, on an Occasion page, the Items tagged with its Occasion that
 * have a URL here.
 *
 * Read with locale fallback **off**. The hero and blocks are localized whole, so a page
 * ready in this locale is written in it; with fallback on, a hero Jana left empty in Dutch
 * would quietly fill with the English one.
 */
const fetchMarketingPage = async (payload: Payload, listing: PageListing, current: Locale) => {
  const [page, targets, ready] = await Promise.all([
    payload.findByID({
      collection: 'pages',
      id: listing.id,
      depth: 1,
      locale: current,
      fallbackLocale: 'none',
    }),
    fetchTargets(current),
    readyItemIds(current),
  ])

  const { docs: occasionItems } =
    listing.occasion === null || ready.length === 0
      ? { docs: [] }
      : await payload.find({
          collection: 'items',
          where: { and: [{ id: { in: ready } }, { occasions: { in: [listing.occasion] } }] },
          sort: 'title',
          depth: 0,
          locale: current,
          pagination: false,
        })

  return { page, targets, occasionItems }
}

/**
 * A catalogue page's Categories, with their photographs, and the Items filed under them that
 * have a URL in this locale.
 */
const fetchCatalogue = async (payload: Payload, page: Catalogue, current: Locale) => {
  const [{ docs: categories }, items] = await Promise.all([
    payload.find({
      collection: 'categories',
      where: { catalogue: { equals: page } },
      sort: 'order',
      depth: 1,
      limit: 100,
      locale: current,
      pagination: false,
    }),
    fetchMenuItems(payload, page, current),
  ])

  return { categories, items }
}

/**
 * A catalogue's Items with a URL in this locale, by title, with their photographs for the
 * menu's tiles. One untranslated here is left off rather than listed with a link to a 404
 * (ADR-0002); `itemListings` is what decides, by the same rule the Item page itself is
 * generated by.
 */
const fetchMenuItems = async (payload: Payload, catalogue: Catalogue, current: Locale) => {
  const ready = await readyItemIds(current, catalogue)

  if (ready.length === 0) {
    return []
  }

  const { docs } = await payload.find({
    collection: 'items',
    where: { id: { in: ready } },
    sort: 'title',
    depth: 1,
    locale: current,
    pagination: false,
  })

  return docs
}

/**
 * The homepage's words, and the three things it states that are kept elsewhere: every
 * Category (the menu and the starting price), the Lead time, and the cross-contamination
 * statement. Globals are read as published — the static page is what customers see.
 */
const fetchHome = async (payload: Payload, current: Locale) => {
  const [home, { docs: categories }, items, leadTime, crossContamination] = await Promise.all([
    payload.findGlobal({ slug: 'home', locale: current, depth: 1 }),
    payload.find({
      collection: 'categories',
      sort: 'order',
      depth: 1,
      locale: current,
      pagination: false,
    }),
    fetchMenuItems(payload, 'cakes', current),
    payload.findGlobal({ slug: 'lead-time', depth: 0 }),
    payload.findGlobal({ slug: 'cross-contamination', locale: current, depth: 0 }),
  ])

  return { home, categories, items, leadTime, statement: crossContamination.statement }
}

/**
 * Where an editorial link in Jana's rich text leads in this locale: the Items and marketing
 * pages with a URL here. A link to one without is left unlinked rather than pointed at a 404.
 */
const fetchTargets = async (current: Locale) => {
  const [items, pages] = await Promise.all([itemListings(), pageListings()])

  return linkTargets({ items, pages }, current)
}

/**
 * Custom order's words, and the two globals its Requested pickup date is held to: the
 * site-wide Lead time and Closed until. Globals are read as published, as on every page.
 */
const fetchCustomOrder = async (payload: Payload, current: Locale) => {
  const [customOrder, leadTime, closedUntil] = await Promise.all([
    payload.findGlobal({ slug: 'custom-order', locale: current, depth: 1 }),
    payload.findGlobal({ slug: 'lead-time', depth: 0 }),
    payload.findGlobal({ slug: 'closed-until', locale: current, depth: 0 }),
  ])

  return { customOrder, leadTime, closedUntil }
}

/** Jana's story, with its photograph, and where its links lead here. */
const fetchAbout = async (payload: Payload, current: Locale) => {
  const [about, targets] = await Promise.all([
    payload.findGlobal({ slug: 'about', locale: current, depth: 1 }),
    fetchTargets(current),
  ])

  return { about, targets }
}

/**
 * Contact's words and details, and every price on the menu in this locale — what the price
 * range it prints and marks up is read from, so the two can never disagree. Only Items with a
 * URL here count: a price on no page is not one the menu offers.
 */
const fetchContact = async (payload: Payload, current: Locale) => {
  const [contact, ready] = await Promise.all([
    payload.findGlobal({ slug: 'contact', locale: current, depth: 1 }),
    readyItemIds(current),
  ])

  const { docs: items } =
    ready.length === 0
      ? { docs: [] }
      : await payload.find({
          collection: 'items',
          where: { id: { in: ready } },
          depth: 0,
          locale: current,
          pagination: false,
          select: { sizes: true },
        })

  return { contact, prices: items.flatMap(({ sizes }) => sizes.map(({ price }) => price)) }
}

/** The privacy policy, and where its links lead here. */
const fetchPrivacy = async (payload: Payload, current: Locale) => {
  const [privacy, targets] = await Promise.all([
    payload.findGlobal({ slug: 'privacy', locale: current, depth: 0 }),
    fetchTargets(current),
  ])

  return { privacy, targets }
}

/**
 * The confirmation page's one fact from the CMS: the site-wide Lead time's days, which is how
 * long to wait for a reply when the customer's own receipt is not there to say.
 */
const fetchEnquirySent = async (payload: Payload) => {
  const leadTime = await payload.findGlobal({ slug: 'lead-time', depth: 0 })

  return { siteLeadTimeDays: leadTime.days ?? null }
}
