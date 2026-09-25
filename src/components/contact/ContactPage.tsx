import { MessageForm } from '@/components/enquiry/MessageForm'
import { JsonLd } from '@/components/site/JsonLd'
import { Paragraphs } from '@/components/site/Paragraphs'
import { Photograph } from '@/components/site/Photograph'
import { DESCENDANT_LINKS, PHOTO_FRAME, TEXT_LINK } from '@/components/site/pressable'
import { Questions } from '@/components/site/Questions'
import {
  AREA_SERVED,
  hoursLines,
  instagramLink,
  openingHours,
  phoneLink,
  priceRange,
} from '@/domain/contact'
import { DICTIONARY } from '@/domain/dictionary'
import { pagePath, type Locale } from '@/domain/routes'
import { bakeryMarkup } from '@/domain/structured-data'
import type { Contact, Media } from '@/payload-types'

/** The form's anchor. */
const FORM_ID = 'ask'

/**
 * `/contact` and `/nl/contact` (ADR-0003): how to reach Jana, when, how collection works, the
 * questions people ask, and the Estimate-free form for a general question. It links on to
 * Custom order, for a question that is really an order.
 *
 * Contact carries the site's `Bakery` markup, and every value in it is printed here from the
 * same computed value (ADR-0002) — email, phone, Instagram, hours, prices, and where pickup
 * is. **Never the street address**: pickup is in Uithoorn, by arrangement, and the address is
 * sent when an order is confirmed. That sentence is code, not content, so no edit can print
 * more.
 */
export const ContactPage = ({
  locale,
  contact,
  prices,
  origin,
}: {
  locale: Locale
  contact: Contact
  /** Every Size's price on the menu in this locale, which the price range is read from. */
  prices: readonly number[]
  /** The site's origin, which the structured data is fully qualified against. */
  origin: string
}) => {
  const words = DICTIONARY[locale]
  const { email, telephone, instagram: handle, photograph } = contact.details ?? {}
  const instagram = instagramLink(handle)
  const phone = phoneLink(telephone)
  const hours = openingHours(contact.hours?.rows)
  const range = priceRange(prices, locale)
  const image = populated(photograph)

  const markup = bakeryMarkup(
    {
      path: pagePath('contact', locale),
      email: email ?? null,
      telephone: phone?.label ?? null,
      images: image?.url ? [image.url] : [],
      openingHours: hours,
      priceRange: range,
      areaServed: AREA_SERVED,
      sameAs: instagram ? [instagram.href] : [],
    },
    origin,
  )

  const details = [
    email ? { term: words.contact.email, value: <a href={`mailto:${email}`}>{email}</a> } : null,
    phone ? { term: words.contact.phone, value: <a href={phone.href}>{phone.label}</a> } : null,
    instagram
      ? { term: words.contact.instagram, value: <a href={instagram.href}>{instagram.label}</a> }
      : null,
    { term: words.contact.pickup, value: words.contact.pickupWhere(AREA_SERVED) },
    range
      ? { term: words.contact.prices, value: <span className="tabular-nums">{range}</span> }
      : null,
  ].filter((row) => row !== null)

  return (
    <div className="px-4 pt-12 pb-8 md:px-10 md:pt-20">
      <JsonLd data={[markup]} />

      <div className="mx-auto max-w-[1400px]">
        <header className="max-w-[46ch]">
          <h1 className="font-display text-[40px] leading-[1.1] font-medium md:text-6xl">
            {contact.heading}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-ink-muted">{contact.intro}</p>
        </header>

        <div className="mt-12 grid gap-12 md:mt-16 md:grid-cols-12 md:gap-x-12">
          <div className="md:col-span-6">
            <dl className="border-t border-rule">
              {details.map(({ term, value }) => (
                <div
                  key={term}
                  className="grid gap-1 border-b border-rule py-4 md:grid-cols-3 md:gap-4"
                >
                  <dt className="text-[13px] tracking-wide text-ink-muted">{term}</dt>
                  <dd className={`md:col-span-2 ${DESCENDANT_LINKS}`}>{value}</dd>
                </div>
              ))}
              {hours.length > 0 ? (
                <div className="grid gap-1 border-b border-rule py-4 md:grid-cols-3 md:gap-4">
                  <dt className="text-[13px] tracking-wide text-ink-muted">
                    {words.contact.hours}
                  </dt>
                  <dd className="md:col-span-2">
                    <ul>
                      {hoursLines(hours, locale).map((line) => (
                        <li key={line.days} className="flex flex-wrap justify-between gap-x-6">
                          <span>{line.days}</span>
                          <span className="tabular-nums">{line.hours}</span>
                        </li>
                      ))}
                    </ul>
                    {contact.hours?.note ? (
                      <p className="mt-2 text-sm text-ink-muted">{contact.hours.note}</p>
                    ) : null}
                  </dd>
                </div>
              ) : null}
            </dl>

            <section className="mt-12">
              <h2 className="font-display text-[28px] leading-tight font-semibold">
                {contact.collection.heading}
              </h2>
              <Paragraphs
                text={contact.collection.policy}
                className="mt-4 max-w-[60ch] leading-relaxed text-ink-muted"
              />
            </section>
          </div>

          {image ? (
            <div className={`${PHOTO_FRAME} md:col-span-5 md:col-start-8`}>
              <Photograph
                media={image}
                sizes="(min-width: 768px) 40vw, 100vw"
                preload={false}
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
              {contact.formHeading}
            </h2>
            <p className="mt-6 font-display text-xl">{words.contact.somethingBespoke}</p>
            <a href={pagePath('customOrder', locale)} className={TEXT_LINK}>
              {words.pageTitles.customOrder}
            </a>
          </div>
          <div className="md:col-span-7">
            <MessageForm
              locale={locale}
              enquiryType="contact"
              leadTime={null}
              closedUntil={null}
              closedNotice={null}
              // Sending from Contact itself failed: the direct route is Jana's inbox.
              contactHref={email ? `mailto:${email}` : pagePath('contact', locale)}
            />
          </div>
        </section>
      </div>

      <div className="mt-20 md:mt-28">
        <Questions faq={contact.faq} />
      </div>
    </div>
  )
}

const populated = (value: number | Media | null | undefined): Media | null =>
  typeof value === 'object' && value !== null ? value : null
