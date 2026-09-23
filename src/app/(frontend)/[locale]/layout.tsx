import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Cormorant_Garamond, Geist, Parisienne } from 'next/font/google'
import { notFound } from 'next/navigation'
import { locale } from 'next/root-params'
import type { ReactNode } from 'react'

import { JsonLd } from '@/components/site/JsonLd'
import { LOCALES, isLocale } from '@/domain/routes'
import { organizationMarkup, websiteMarkup } from '@/domain/structured-data'
import { siteOrigin } from '@/lib/site'

import '../styles.css'

/*
 * Type from ADR-0004. Cormorant Garamond carries display and italic, matching the serif on
 * Jana's card; Geist carries everything functional, because a high-contrast serif at 14px
 * on a phone is not readable; Parisienne is the wordmark, once per page. Self-hosted by
 * `next/font` at build time, so no request reaches Google and no cookie is set.
 */
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
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
 */
export default async function RootLayout({ children }: { children: ReactNode }) {
  const current = await locale()

  if (!isLocale(current)) {
    notFound()
  }

  return (
    <html
      lang={current}
      className={`${cormorant.variable} ${geist.variable} ${parisienne.variable}`}
    >
      <body className="bg-ground font-sans text-ink antialiased">
        <JsonLd data={[organizationMarkup(siteOrigin()), websiteMarkup(current, siteOrigin())]} />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
