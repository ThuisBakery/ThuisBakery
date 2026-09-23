import { pagePath, type Locale } from './routes'

/**
 * The site's JSON-LD, per ADR-0002: `Product` with `offers` and `BreadcrumbList` on an Item
 * page, `Bakery` on Contact, `Organization` and `WebSite` on every page. Plain objects,
 * serialised by the page.
 *
 * Google's rule is absolute — "Don't mark up content that is not visible to readers of the
 * page" — so every value here is one the page carrying it renders: on an Item page the
 * name, the description, the photographs, each Size's label and price, the breadcrumb
 * trail; on Contact the email, phone, hours, prices and where pickup is. Nothing is marked
 * up that the page does not show, which is also why there is no `availability`.
 *
 * No `aggregateRating` and no `Review`, ever. Self-collected ratings on your own product
 * pages are a policy risk, and they are the only candidates that can subtract rather than
 * add.
 */

export type Thing = { '@context': 'https://schema.org'; '@type': string } & Record<string, unknown>

/** A path or a URL, fully qualified. Media can come back either way. */
const absolute = (pathOrUrl: string, origin: string): string =>
  /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${origin.replace(/\/+$/, '')}${pathOrUrl}`

export type ProductInput = {
  name: string
  description: string
  path: string
  images: readonly string[]
  sizes: readonly { label: string; price: number }[]
}

export const productMarkup = (
  { name, description, path, images, sizes }: ProductInput,
  origin: string,
): Thing => {
  const url = absolute(path, origin)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    url,
    ...(images.length > 0 ? { image: images.map((image) => absolute(image, origin)) } : {}),
    offers: sizes.map(({ label, price }) => ({
      '@type': 'Offer',
      name: label,
      price,
      priceCurrency: 'EUR',
      url,
    })),
  }
}

export const breadcrumbMarkup = (
  trail: readonly { name: string; path: string }[],
  origin: string,
): Thing => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map(({ name, path }, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name,
    item: absolute(path, origin),
  })),
})

/** What the business is called, everywhere it is marked up. */
export const BUSINESS_NAME = 'ThuisBakery'

/** A day as schema.org names it, which is also the value the Contact global stores. */
export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number]

/** One row of opening hours: the days it covers, and `HH:MM` times. */
export type OpeningHours = { days: readonly DayOfWeek[]; opens: string; closes: string }

export type BakeryInput = {
  /** The page carrying the markup — Contact, in its locale. */
  path: string
  email: string | null
  telephone: string | null
  images: readonly string[]
  openingHours: readonly OpeningHours[]
  priceRange: string | null
  /** Where pickup is. Never a street address: the website never prints one (ADR-0002). */
  areaServed: string
  /** The business's other profiles — Instagram — as the page links to them. */
  sameAs: readonly string[]
}

/**
 * `Bakery` for the Contact page. `areaServed` rather than `address`, permanently: the site
 * never prints the street address, and the Business Profile withholds it too (ADR-0002). A
 * value Jana has left empty is left out, so the markup never claims what the page lacks.
 */
export const bakeryMarkup = (
  { path, email, telephone, images, openingHours, priceRange, areaServed, sameAs }: BakeryInput,
  origin: string,
): Thing => ({
  '@context': 'https://schema.org',
  '@type': 'Bakery',
  name: BUSINESS_NAME,
  url: absolute(path, origin),
  ...(email ? { email } : {}),
  ...(telephone ? { telephone } : {}),
  ...(images.length > 0 ? { image: images.map((image) => absolute(image, origin)) } : {}),
  ...(openingHours.length > 0
    ? {
        openingHoursSpecification: openingHours.map(({ days, opens, closes }) => ({
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: [...days],
          opens,
          closes,
        })),
      }
    : {}),
  ...(priceRange ? { priceRange } : {}),
  areaServed: { '@type': 'City', name: areaServed },
  ...(sameAs.length > 0 ? { sameAs: [...sameAs] } : {}),
})

/** `Organization`, on every page: the business, at the site root. */
export const organizationMarkup = (origin: string): Thing => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: BUSINESS_NAME,
  url: absolute('/', origin),
})

/** `WebSite`, on every page: the site, at its home in the page's language. */
export const websiteMarkup = (locale: Locale, origin: string): Thing => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: BUSINESS_NAME,
  url: absolute(pagePath('home', locale), origin),
  inLanguage: locale,
})

/** JSON-LD as a script body: `<` is escaped so no value can close the tag. */
export const serialiseMarkup = (markup: Thing): string =>
  JSON.stringify(markup).replace(/</g, '\\u003c')
