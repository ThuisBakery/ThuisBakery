import { CakeStand } from '@/components/site/CakeStand'
import { CmsRichText } from '@/components/site/CmsRichText'
import { Photograph } from '@/components/site/Photograph'
import { pagePath, type Locale } from '@/domain/routes'
import type { About } from '@/payload-types'

/**
 * `/about` and `/nl/over-jana` (ADR-0003): Jana's story and her photograph, in her words from
 * the About global. It ends by sending the reader to the cakes — About → `/cakes` is one of the
 * internal links ADR-0003 specifies.
 */
export const AboutPage = ({
  locale,
  about,
  targets,
}: {
  locale: Locale
  about: About
  /** Where an internal link in the story leads in this locale (`linkTargets`). */
  targets: ReadonlyMap<string, string>
}) => (
  <article className="px-4 pt-12 pb-20 md:px-10 md:pt-20 md:pb-28">
    <div className="mx-auto grid max-w-[1400px] gap-10 md:grid-cols-12 md:gap-x-12">
      <div className="md:col-span-5">
        <div className="overflow-hidden bg-raised md:sticky md:top-24">
          <Photograph
            media={about.photograph}
            sizes="(min-width: 768px) 40vw, 100vw"
            preload
            className="aspect-[4/5] w-full object-cover"
          />
        </div>
      </div>
      <div className="md:col-span-6 md:col-start-7">
        <h1 className="font-display text-[40px] leading-[1.1] font-medium md:text-6xl">
          {about.heading}
        </h1>
        <CmsRichText data={about.story} targets={targets} className="mt-8 max-w-[60ch]" />
        <div className="mt-14 flex flex-col items-start gap-4">
          <CakeStand className="w-14 text-ink-muted" />
          <a
            href={pagePath('cakes', locale)}
            className="inline-flex min-h-12 items-center bg-accent px-8 py-3.5 text-sm tracking-wide text-accent-ink motion-safe:transition-transform motion-safe:duration-200 motion-safe:active:translate-y-px"
          >
            {about.cakesLabel}
          </a>
        </div>
      </div>
    </div>
  </article>
)
