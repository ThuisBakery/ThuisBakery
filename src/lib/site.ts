/**
 * The site's public origin, which every canonical and hreflang URL is built on — ADR-0002
 * requires them fully qualified.
 *
 * Vercel sets `VERCEL_PROJECT_PRODUCTION_URL` on every deployment, previews included, to
 * the production domain. So a preview's canonicals point at production, which is right:
 * previews are not what should be indexed. Locally there is no such variable.
 */
export const siteOrigin = (): string => {
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL

  return production ? `https://${production}` : 'http://localhost:3000'
}
