import configPromise from '@payload-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { locale } from 'next/root-params'
import { getPayload } from 'payload'

import { PageShell } from '@/components/site/PageShell'
import { Placeholder } from '@/components/site/Placeholder'
import { alternates } from '@/domain/alternates'
import { DICTIONARY, documentTitle } from '@/domain/dictionary'
import {
  LOCALES,
  CODED_PAGES,
  isLocale,
  pagePath,
  pageSegments,
  resolvePage,
  type Locale,
  type CodedPage,
} from '@/domain/routes'
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

  return locales.flatMap((each) =>
    CODED_PAGES.map((page) => ({ segments: pageSegments(page, each) })),
  )
}

/** The locale and page a request is for, or a 404. */
const resolve = async ({ params }: Props): Promise<{ locale: Locale; page: CodedPage }> => {
  const [current, { segments = [] }] = await Promise.all([locale(), params])

  if (!isLocale(current)) {
    notFound()
  }

  const page = resolvePage(current, segments)

  if (page === null) {
    notFound()
  }

  return { locale: current, page }
}

export const generateMetadata = async (props: Props): Promise<Metadata> => {
  const { locale: current, page } = await resolve(props)

  return {
    title: documentTitle(page, current),
    alternates: alternates(
      { en: pagePath(page, 'en'), nl: pagePath(page, 'nl') },
      current,
      siteOrigin(),
    ),
  }
}

export default async function Page(props: Props) {
  const { locale: current, page } = await resolve(props)
  const payload = await getPayload({ config: configPromise })

  const [header, footer] = await Promise.all([
    payload.findGlobal({ slug: 'header', locale: current, depth: 0 }),
    payload.findGlobal({ slug: 'footer', locale: current, depth: 0 }),
  ])

  return (
    <PageShell locale={current} page={page} header={header} footer={footer}>
      <Placeholder title={DICTIONARY[current].pageTitles[page]} />
    </PageShell>
  )
}
