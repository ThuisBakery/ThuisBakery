/**
 * The JSON-LD an Item page carries, per ADR-0002: `Product` with `offers`, and
 * `BreadcrumbList`. Plain objects, serialised by the page.
 *
 * Google's rule is absolute — "Don't mark up content that is not visible to readers of the
 * page" — so every value here is one the Item page renders: the name, the description, the
 * photographs, each Size's label and price, the breadcrumb trail. Nothing is marked up
 * that the page does not show, which is also why there is no `availability`.
 *
 * No `aggregateRating` and no `Review`, ever. Self-collected ratings on your own product
 * pages are a policy risk, and they are the only candidates that can subtract rather than
 * add.
 */

type Thing = { '@context': 'https://schema.org'; '@type': string } & Record<string, unknown>

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

export const product = (
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

export const breadcrumbList = (
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
