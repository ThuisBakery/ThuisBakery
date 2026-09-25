import { MessageForm } from '@/components/enquiry/MessageForm'
import { Paragraphs } from '@/components/site/Paragraphs'
import { Photograph } from '@/components/site/Photograph'
import { PHOTO_FRAME, TEXT_LINK } from '@/components/site/pressable'
import { DICTIONARY } from '@/domain/dictionary'
import { pagePath, type Locale } from '@/domain/routes'
import type { ClosedUntil, CustomOrder, LeadTime } from '@/payload-types'

const FORM_ID = 'imagine'

/**
 * `/custom-order` and `/nl/maatwerk` (ADR-0003): the bespoke path. A customer with something
 * of their own in mind describes it without being forced through a cake configurator — the
 * Estimate-free Enquiry form, with a Requested pickup date held to the site's Lead time and
 * Closed until, and an Inspiration photo on the same terms as an Item page's.
 */
export const CustomOrderPage = ({
  locale,
  customOrder,
  leadTime,
  closedUntil,
}: {
  locale: Locale
  customOrder: CustomOrder
  /** The site-wide Lead time; empty when the global has never been saved. */
  leadTime: Partial<Pick<LeadTime, 'days' | 'timeOfDay'>>
  /** The Closed until global, in this locale; empty when it has never been saved. */
  closedUntil: Partial<Pick<ClosedUntil, 'date' | 'notice'>>
}) => {
  const words = DICTIONARY[locale]
  const figures =
    typeof leadTime.days === 'number' && typeof leadTime.timeOfDay === 'string'
      ? { days: leadTime.days, timeOfDay: leadTime.timeOfDay }
      : null

  return (
    <div className="px-4 pt-12 pb-20 md:px-10 md:pt-20 md:pb-28">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid items-center gap-10 md:grid-cols-12 md:gap-x-12">
          <header className={customOrder.photograph ? 'md:col-span-6' : 'md:col-span-8'}>
            <h1 className="font-display text-[40px] leading-[1.1] font-medium md:text-6xl">
              {customOrder.heading}
            </h1>
            <Paragraphs
              text={customOrder.intro}
              className="mt-6 max-w-[52ch] text-lg leading-relaxed text-ink-muted"
            />
          </header>
          {customOrder.photograph ? (
            <div className={`${PHOTO_FRAME} md:col-span-5 md:col-start-8`}>
              <Photograph
                media={customOrder.photograph}
                sizes="(min-width: 768px) 40vw, 100vw"
                preload
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
          ) : null}
        </div>

        <section
          id={FORM_ID}
          aria-labelledby={`${FORM_ID}-heading`}
          className="mt-20 grid scroll-mt-24 gap-6 border-t border-rule pt-12 md:mt-28 md:grid-cols-12 md:gap-x-12"
        >
          <div className="md:col-span-5">
            <h2
              id={`${FORM_ID}-heading`}
              className="font-display text-[34px] leading-tight font-semibold"
            >
              {customOrder.formHeading}
            </h2>
            <p className="mt-3 leading-relaxed text-ink-muted">{words.enquiry.intro}</p>
            <p className="mt-6 font-display text-xl">{words.customOrder.justAQuestion}</p>
            <a href={pagePath('contact', locale)} className={TEXT_LINK}>
              {words.pageTitles.contact}
            </a>
          </div>
          <div className="md:col-span-7">
            <MessageForm
              locale={locale}
              enquiryType="custom-order"
              leadTime={figures}
              closedUntil={closedUntil.date}
              closedNotice={closedUntil.notice}
              contactHref={pagePath('contact', locale)}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
