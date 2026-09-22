import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import type { Footer, Header } from '@/payload-types'

/**
 * Seeds the Header and Footer globals, in both locales (ADR-0003: "the nav is seeded
 * configuration, not code"). A migration rather than a seed script so it runs exactly once
 * per database — production, every preview branch and dev alike — through the pipeline
 * that already runs on every deploy (ADR-0005). After this, the nav is Jana's to edit.
 *
 * Links name a page key, not a URL; the route map turns it into each locale's path. Only
 * the labels differ between locales, so English is written first and Dutch is written onto
 * the same array rows by id.
 */

type Row = { page: Header['links'][number]['page']; en: string; nl: string }

const HEADER_LINKS: Row[] = [
  { page: 'cakes', en: 'Cakes', nl: 'Taarten' },
  { page: 'nibbles', en: 'Nibbles', nl: 'Lekkernijen' },
  { page: 'about', en: 'About', nl: 'Over Jana' },
  { page: 'contact', en: 'Contact', nl: 'Contact' },
]

const CALL_TO_ACTION: Row = { page: 'customOrder', en: 'Custom order', nl: 'Maatwerk' }

const FOOTER_LINKS: Row[] = [
  { page: 'home', en: 'Home', nl: 'Home' },
  { page: 'cakes', en: 'Cakes', nl: 'Taarten' },
  { page: 'nibbles', en: 'Nibbles', nl: 'Lekkernijen' },
  { page: 'customOrder', en: 'Custom order', nl: 'Maatwerk' },
  { page: 'about', en: 'About', nl: 'Over Jana' },
  { page: 'contact', en: 'Contact', nl: 'Contact' },
  { page: 'privacy', en: 'Privacy', nl: 'Privacy' },
]

const FOOTER_TAGLINE = {
  en: 'Baked at home in Uithoorn. Pickup by arrangement, with the address sent once your date is confirmed.',
  nl: 'Thuis gebakken in Uithoorn. Ophalen op afspraak; het adres volgt zodra je datum is bevestigd.',
}

/** The Dutch labels onto the array rows English created, matched by position. */
const dutchRows = (
  saved: readonly { id?: string | null }[],
  rows: readonly Row[],
): { id?: string | null; page: Row['page']; label: string }[] =>
  rows.map((row, index) => ({ id: saved[index]?.id ?? null, page: row.page, label: row.nl }))

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const header: Header = await payload.updateGlobal({
    slug: 'header',
    locale: 'en',
    req,
    data: {
      links: HEADER_LINKS.map(({ page, en }) => ({ page, label: en })),
      callToAction: { page: CALL_TO_ACTION.page, label: CALL_TO_ACTION.en },
    },
  })

  await payload.updateGlobal({
    slug: 'header',
    locale: 'nl',
    req,
    data: {
      links: dutchRows(header.links, HEADER_LINKS),
      callToAction: { page: CALL_TO_ACTION.page, label: CALL_TO_ACTION.nl },
    },
  })

  const footer: Footer = await payload.updateGlobal({
    slug: 'footer',
    locale: 'en',
    req,
    data: {
      tagline: FOOTER_TAGLINE.en,
      links: FOOTER_LINKS.map(({ page, en }) => ({ page, label: en })),
    },
  })

  await payload.updateGlobal({
    slug: 'footer',
    locale: 'nl',
    req,
    data: {
      tagline: FOOTER_TAGLINE.nl,
      links: dutchRows(footer.links, FOOTER_LINKS),
    },
  })
}

/**
 * Nothing to undo on its own. Once seeded, the content is Jana's; rolling this back must not
 * erase her edits. The schema migration before this one drops the tables if it is undone.
 */
export async function down(_args: MigrateDownArgs): Promise<void> {}
