import { SomethingCustom } from '@/components/enquiry/CustomOrderHost'
import { Paragraphs } from '@/components/site/Paragraphs'
import { Photograph } from '@/components/site/Photograph'
import { BUTTON, PHOTO_FRAME, TEXT_LINK } from '@/components/site/pressable'
import { DICTIONARY } from '@/domain/dictionary'
import { pagePath, type Locale } from '@/domain/routes'
import type { CustomOrder } from '@/payload-types'

const START_ID = 'imagine'

/**
 * `/custom-order` and `/nl/maatwerk` (ADR-0003): the bespoke path. A customer with something
 * of their own in mind describes it without being forced through a cake configurator.
 *
 * The page is Jana's words, and at the top, beside them, the way into the Custom order sheet
 * (ADR-0007) — the same stepped sheet every **Something custom** control opens, hosted by the
 * frontend layout, which holds its Requested pickup date to the site's Lead time and Closed
 * until. Like every Something custom control it is a link to this page, which opens the sheet
 * in place once scripts run; the sheet needs them to send, as the inline form it replaced did.
 */
export const CustomOrderPage = ({
  locale,
  customOrder,
}: {
  locale: Locale
  customOrder: CustomOrder
}) => {
  const words = DICTIONARY[locale]

  return (
    <div className="px-4 pt-12 pb-20 md:px-10 md:pt-20 md:pb-28">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid items-center gap-10 md:grid-cols-12 md:gap-x-12">
          <div className={customOrder.photograph ? 'md:col-span-6' : 'md:col-span-8'}>
            <header>
              <h1 className="font-display text-[40px] leading-[1.1] font-medium md:text-6xl">
                {customOrder.heading}
              </h1>
              <Paragraphs
                text={customOrder.intro}
                className="mt-6 max-w-[52ch] text-lg leading-relaxed text-ink-muted"
              />
            </header>

            <section
              id={START_ID}
              aria-labelledby={`${START_ID}-heading`}
              className="mt-10 border-t border-rule pt-8"
            >
              <h2
                id={`${START_ID}-heading`}
                className="font-display text-[28px] leading-tight font-semibold"
              >
                {customOrder.formHeading}
              </h2>
              <p className="mt-3 max-w-[52ch] leading-relaxed text-ink-muted">
                {words.enquiry.intro}
              </p>
              <div className="mt-6">
                <SomethingCustom locale={locale} className={BUTTON}>
                  {words.customOrder.start}
                </SomethingCustom>
              </div>
              <p className="mt-8 font-display text-xl">{words.customOrder.justAQuestion}</p>
              <a href={pagePath('contact', locale)} className={TEXT_LINK}>
                {words.pageTitles.contact}
              </a>
            </section>
          </div>
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
      </div>
    </div>
  )
}
