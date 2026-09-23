import { CmsRichText } from '@/components/site/CmsRichText'
import { DICTIONARY } from '@/domain/dictionary'
import { formatFullDate, parseCalendarDate } from '@/domain/pickup-date'
import type { Locale } from '@/domain/routes'
import type { Privacy } from '@/payload-types'

/**
 * `/privacy` and `/nl/privacy` (ADR-0003): the privacy policy as CMS rich text, under a fixed
 * heading and the date it last changed. There is no consent banner anywhere to go with it —
 * the site sets no non-essential cookies — and no terms of service (ADR-0003).
 */
export const PrivacyPage = ({
  locale,
  privacy,
  targets,
}: {
  locale: Locale
  privacy: Privacy
  /** Where an internal link in the policy leads in this locale (`linkTargets`). */
  targets: ReadonlyMap<string, string>
}) => {
  const words = DICTIONARY[locale]
  // A day-only date as Payload's date picker writes one: noon UTC on that day.
  const updated = parseCalendarDate(privacy.lastUpdated.slice(0, 10))

  return (
    <article className="px-4 pt-12 pb-20 md:px-10 md:pt-20 md:pb-28">
      <div className="mx-auto max-w-[760px]">
        <h1 className="font-display text-[40px] leading-[1.1] font-medium md:text-6xl">
          {words.pageTitles.privacy}
        </h1>
        {updated ? (
          <p className="mt-4 text-sm text-ink-muted">
            {words.privacy.lastUpdated(formatFullDate(updated, locale))}
          </p>
        ) : null}
        <CmsRichText data={privacy.body} targets={targets} className="mt-10" />
      </div>
    </article>
  )
}
