import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { en } from '@payloadcms/translations/languages/en'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Allergens } from './collections/Allergens'
import { Categories } from './collections/Categories'
import { Fillings } from './collections/Fillings'
import { Items } from './collections/Items'
import { Media } from './collections/Media'
import { Occasions } from './collections/Occasions'
import { Sponges } from './collections/Sponges'
import { Submissions } from './collections/Submissions'
import { Users } from './collections/Users'
import { previewUrl } from './domain/preview'
import { DEFAULT_LOCALE, LOCALES } from './domain/routes'
import { ClosedUntil } from './globals/ClosedUntil'
import { CrossContamination } from './globals/CrossContamination'
import { Footer } from './globals/Footer'
import { Header } from './globals/Header'
import { Home } from './globals/Home'
import { LeadTimeGlobal } from './globals/LeadTimeGlobal'
import { revalidatingCollection, revalidatingGlobal } from './hooks/revalidateSite'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    /**
     * One Live Preview configuration for everything that has a preview, rather than the
     * same block repeated per collection. The `url` function runs on every autosave, so
     * it does no work beyond building a URL: the preview route resolves the document's
     * real path once, on load. See `src/lib/preview.ts`.
     */
    livePreview: {
      collections: [Items.slug],
      globals: [Home.slug, CrossContamination.slug, LeadTimeGlobal.slug, ClosedUntil.slug],
      url: ({ collectionConfig, globalConfig, data, locale }) => {
        const id: unknown = data['id']

        return previewUrl(
          collectionConfig && (typeof id === 'number' || typeof id === 'string')
            ? { kind: 'collection', slug: collectionConfig.slug, id }
            : { kind: 'global', slug: globalConfig?.slug ?? '' },
          locale.code,
        )
      },
    },
  },
  /**
   * Everything the public pages show rebuilds them when it changes (`src/hooks/revalidateSite.ts`).
   * Submissions and Users are never shown, so saving one rebuilds nothing.
   */
  collections: [
    ...[Items, Categories, Occasions, Sponges, Fillings, Allergens, Media].map(
      revalidatingCollection,
    ),
    Submissions,
    Users,
  ],
  globals: [Header, Footer, Home, CrossContamination, LeadTimeGlobal, ClosedUntil].map(
    revalidatingGlobal,
  ),
  /**
   * Content locales. `fallback: true` is the site-wide default, so a missing Dutch value
   * falls back to English unless a request says otherwise.
   *
   * Two places say otherwise, which is what makes the two-locale handover rule visible:
   * Payload's own edit view already reads documents with `fallbackLocale: false` (checked
   * in `@payloadcms/next`), so an untranslated field renders empty rather than showing the
   * other locale's text; and the preview route passes `fallbackLocale: 'none'` so Dutch
   * never appears inside an English preview. See ADR-0002.
   */
  localization: {
    locales: [...LOCALES],
    defaultLocale: DEFAULT_LOCALE,
    fallback: true,
  },
  /**
   * The admin UI's own language, which is a different thing from content locales. Set
   * **explicitly** to English, not auto-detected from the browser: Payload ships Dutch,
   * and an admin that silently switches language puts two language controls on one screen
   * — the locale switcher and the UI itself — which is precisely the confusion the
   * two-locale handover rule cannot afford.
   */
  i18n: {
    supportedLanguages: { en },
    fallbackLanguage: 'en',
  },
  /**
   * Publishing is a whole-document state. An Item is Published only when it is complete in
   * both English and Dutch — a rule Jana applies at handover, not readiness logic derived
   * here — so per-locale status stays off.
   */
  experimental: {
    localizeStatus: false,
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  // `DATABASE_URL` is injected per deployment by the Vercel–Neon integration and is
  // never set by hand in Vercel's environment settings. See ADR-0005.
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  plugins: [
    /**
     * Uploaded photographs live in Vercel Blob (ADR-0001), because a Vercel function's disk
     * does not survive the request. `BLOB_READ_WRITE_TOKEN` is injected by the Blob store
     * connected to the project; without it the adapter falls back to local disk.
     *
     * - `clientUploads`: the browser uploads straight to Blob. Payload's docs cap a server
     *   upload on Vercel at 4.5MB, and a photograph from a phone is larger than that.
     * - `disablePayloadAccessControl`: Media is publicly readable anyway, so pages load
     *   images from Blob directly rather than through a Payload function on every request.
     *   `next.config.ts` lets `next/image` optimize from that host.
     * - `alwaysInsertFields`: the adapter adds a `prefix` field to Media. Without this it
     *   does so only when the token is set, so a migration generated without the token
     *   would lack a column production needs.
     */
    vercelBlobStorage({
      collections: { media: { disablePayloadAccessControl: true } },
      token: process.env.BLOB_READ_WRITE_TOKEN,
      clientUploads: true,
      alwaysInsertFields: true,
    }),
  ],
})
