import type { ReactNode } from 'react'

import type { Locale, CodedPage } from '@/domain/routes'
import type { Footer, Header } from '@/payload-types'

import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

/**
 * The shell every public page sits inside: header, main landmark, footer.
 *
 * It lives in the page rather than the layout because the language switcher has to land on
 * *the same page* in the other locale, and a layout does not know which page it wraps. The
 * page does, from the route map — so the switcher's target is computed on the server, and
 * no client code has to guess it from a rewritten pathname.
 *
 * The page reads the locale from `next/root-params` (ADR-0002) and hands it down from here
 * as a prop. That is where two rules meet: build-conventions.md has presentational
 * components take their data as props so tests can render them, and root params exist
 * only inside a Next render — the client-side menu cannot read them at all.
 */
export const PageShell = ({
  locale,
  page,
  header,
  footer,
  children,
}: {
  locale: Locale
  page: CodedPage
  header: Header
  footer: Footer
  children: ReactNode
}) => (
  <div className="flex min-h-dvh flex-col">
    <SiteHeader locale={locale} page={page} header={header} />
    <main id="content" className="flex-1">
      {children}
    </main>
    <SiteFooter locale={locale} page={page} footer={footer} />
  </div>
)
