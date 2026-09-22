import { pagePath, type Locale, type CodedPage } from './routes'

/** A CMS page link as Header and Footer hold it: a page key and a translated label. */
export type PageLink = { page: CodedPage; label: string }

/** The same link, resolved to a path in one locale — plain data a client component can take. */
export type ResolvedLink = { href: string; label: string; current: boolean }

export const resolveLinks = (
  links: readonly PageLink[],
  locale: Locale,
  currentPage: CodedPage,
): ResolvedLink[] =>
  links.map(({ page, label }) => ({
    href: pagePath(page, locale),
    label,
    current: page === currentPage,
  }))
