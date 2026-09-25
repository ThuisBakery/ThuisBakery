import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Bricolage_Grotesque, Geist, Parisienne } from 'next/font/google'
import { notFound } from 'next/navigation'
import { locale } from 'next/root-params'
import type { ReactNode } from 'react'

import { JsonLd } from '@/components/site/JsonLd'
import { ThemeScript } from '@/components/site/ThemeScript'
import { LOCALES, isLocale } from '@/domain/routes'
import { organizationMarkup, websiteMarkup } from '@/domain/structured-data'
import { DEFAULT_THEME } from '@/domain/theme'
import { siteOrigin } from '@/lib/site'

import '../styles.css'

/*
 * Type from ADR-0007, which replaced ADR-0004's display serif. Bricolage Grotesque carries
 * display, as the variable font with its optical-size axis, so a 40px heading and a 20px
 * question are each drawn for their size. It has no italic, and none is synthesised
 * anywhere. Geist carries body, prices and forms. Parisienne is the wordmark, once per page.
 * Self-hosted by `next/font` at build time, so no request reaches Google and no cookie is
 * set.
 */
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-bricolage',
  display: 'swap',
})

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

const parisienne = Parisienne({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-parisienne',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
}

/** Both locale trees are built ahead of time, and nothing else is a locale. */
export const generateStaticParams = () => LOCALES.map((each) => ({ locale: each }))

export const dynamicParams = false

/**
 * The public site's root layout. It sits under `[locale]` so that `locale` is a root
 * param: any server component can read it from `next/root-params` rather than having it
 * drilled down (ADR-0002). Canonicals and hreflang are not here — they are per-URL, so
 * each page's `generateMetadata` emits them.
 *
 * `Organization` and `WebSite` are, being sitewide (ADR-0002). Each names only what every
 * page shows: the business's name, in the header's wordmark, and the site's home.
 *
 * Vercel Web Analytics counts visits here, on the public site only — Jana's own time in the
 * admin is not a visit. It sets no cookie and no cross-site identifier, which is what makes
 * the privacy page's no-consent-banner position true (ADR-0006). Google Analytics was
 * rejected on exactly that basis. Nothing added to the site may set a non-essential cookie:
 * see `docs/agents/build-conventions.md`.
 *
 * The theme choice (ADR-0007) is applied in `<head>` before first paint, from localStorage
 * rather than a cookie for the same reason. `<html>` renders System and the script may
 * change it before React hydrates, hence `suppressHydrationWarning`, which covers that
 * element's own attributes and nothing below it.
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const current = await locale()

  if (!isLocale(current)) {
    notFound()
  }

  return (
    <html
      lang={current}
      className={`${bricolage.variable} ${geist.variable} ${parisienne.variable}`}
      data-theme={DEFAULT_THEME}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="bg-ground font-sans text-ink antialiased">
        <JsonLd data={[organizationMarkup(siteOrigin()), websiteMarkup(current, siteOrigin())]} />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
