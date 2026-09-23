import { IllustratedMenu } from '@/components/menu/IllustratedMenu'
import { CakeStand } from '@/components/site/CakeStand'
import { Photograph } from '@/components/site/Photograph'
import { Reveal } from '@/components/site/Reveal'
import { fromPrice, leadTimeFact } from '@/domain/home'
import { catalogueSections } from '@/domain/menu'
import { CATALOGUES, cataloguePath, pagePath, type Locale } from '@/domain/routes'
import type { Category, Home, LeadTime } from '@/payload-types'

/** The Lead time global as read: empty when it has never been saved. */
type LeadTimeFigures = Partial<Pick<LeadTime, 'days' | 'timeOfDay'>>

/** The one secondary link style on the page: the nibbles beside the cakes, and Meet Jana. */
const TEXT_LINK =
  'inline-flex min-h-11 items-center text-sm tracking-wide underline underline-offset-4 transition-colors duration-200'

/** Pressed feedback on a button-weight link — motion, so only when motion is welcome. */
const PRESS =
  'motion-safe:transition-transform motion-safe:duration-200 motion-safe:active:translate-y-px'

/**
 * `/` and `/nl` (ADR-0004): eight sections, eight layout families, no eyebrow labels, and
 * no Enquiry — the homepage sends the customer into the menu, and the Enquiry starts on an
 * Item page (ADR-0003). The wordmark is the header's; this page does not set it again.
 *
 * Jana writes the words, through the Home global; the order and the layouts are fixed here.
 * The fact band's figures are read from where they are kept rather than written twice: the
 * Lead time global, and the Categories' own prices.
 */
export const HomePage = ({
  locale,
  home,
  categories,
  leadTime,
  statement,
}: {
  locale: Locale
  home: Home
  /** Every Category, from both catalogues. */
  categories: readonly Category[]
  /** When the Lead time global has never been saved, its fact is left out. */
  leadTime: LeadTimeFigures
  /** The cross-contamination statement, which is written once, on its own global. */
  statement: string | null | undefined
}) => {
  const cakes = pagePath('cakes', locale)
  const nibbles = pagePath('nibbles', locale)

  return (
    <div>
      <Hero hero={home.hero} cakes={cakes} nibbles={nibbles} />
      <FactBand locale={locale} facts={home.facts} categories={categories} leadTime={leadTime} />
      <Menu locale={locale} heading={home.menu.heading} categories={categories} />
      <About locale={locale} about={home.about} />
      <AllergenNotice allergens={home.allergens} statement={statement} />
      <Quote quote={home.quote} />
      <Questions faq={home.faq} />
      <Closing closing={home.closing} labels={home.hero} cakes={cakes} nibbles={nibbles} />
    </div>
  )
}

/**
 * 1. Editorial hero. The photograph runs along the foot of the opening screen and is cut by
 * the bottom edge of the viewport: it is the threshold into the menu, half seen, which is
 * the reason it is there. A photograph in a slot beside the headline was rejected in
 * ADR-0004 as arbitrary placement.
 */
const Hero = ({ hero, cakes, nibbles }: { hero: Home['hero']; cakes: string; nibbles: string }) => (
  // Taller than the screen below the header by 14svh, so that much of the photograph sits
  // under the fold whatever the phone.
  <section className="flex min-h-[calc(114svh-72px)] flex-col">
    <div className="flex flex-1 flex-col items-center justify-center px-4 pt-6 pb-10 text-center md:px-10 md:pt-12 md:pb-16">
      <h1 className="max-w-[16ch] font-display text-[40px] leading-[1.05] font-medium md:text-[84px]">
        {hero.headline}
      </h1>
      <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-ink-muted md:text-base">
        {hero.intro}
      </p>
      <div className="mt-9 flex flex-col items-center gap-2 sm:flex-row sm:gap-6">
        <a
          href={cakes}
          className={`bg-accent px-8 py-3.5 text-sm tracking-wide whitespace-nowrap text-accent-ink ${PRESS}`}
        >
          {hero.cakesLabel}
        </a>
        <a href={nibbles} className={`${TEXT_LINK} decoration-rule hover:decoration-ink`}>
          {hero.nibblesLabel}
        </a>
      </div>
    </div>
    <Photograph
      media={hero.photograph}
      sizes="100vw"
      preload
      className="h-[36svh] w-full shrink-0 bg-raised object-cover md:h-[42svh]"
    />
  </section>
)

/** 2. Fact band: Lead time, pickup, and the starting price, ruled apart like the card. */
const FactBand = ({
  locale,
  facts,
  categories,
  leadTime,
}: {
  locale: Locale
  facts: Home['facts']
  categories: readonly Category[]
  leadTime: LeadTimeFigures
}) => {
  const leadTimeRow =
    typeof leadTime.days === 'number'
      ? leadTimeFact({ days: leadTime.days, timeOfDay: leadTime.timeOfDay ?? '' }, locale)
      : null
  const price = fromPrice(categories, locale)

  // A price is set in Geist, as everywhere on the site (ADR-0004); the words in her serif.
  const rows = [
    leadTimeRow && { ...leadTimeRow, price: false },
    { title: facts.pickupTitle, detail: facts.pickupDetail, price: false },
    price ? { title: price, detail: facts.priceDetail ?? null, price: true } : null,
  ].filter((row) => row !== null)

  return (
    <section className="border-y border-rule px-4 md:px-10">
      <dl className="mx-auto grid max-w-[1400px] divide-y divide-rule md:grid-cols-3 md:divide-x md:divide-y-0">
        {rows.map(({ title, detail, price: isPrice }) => (
          <div key={title} className="py-6 md:px-8 md:py-9 md:first:pl-0 md:last:pr-0">
            <dt
              className={
                isPrice
                  ? 'font-sans text-xl leading-tight tracking-wide tabular-nums'
                  : 'font-display text-2xl leading-tight'
              }
            >
              {title}
            </dt>
            {detail ? (
              <dd className="mt-1.5 text-[14px] leading-relaxed text-ink-muted">{detail}</dd>
            ) : null}
          </div>
        ))}
      </dl>
    </section>
  )
}

/**
 * 3. The illustrated menu, the same component as `/cakes` and `/nibbles`: every Category,
 * cakes first, each entry one link to its section of its catalogue page.
 */
const Menu = ({
  locale,
  heading,
  categories,
}: {
  locale: Locale
  heading: string
  categories: readonly Category[]
}) => {
  const sections = CATALOGUES.flatMap((catalogue) => catalogueSections(catalogue, categories, []))

  return (
    <section className="px-4 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-[1400px]">
        <h2 className="text-center font-display text-[34px] leading-tight font-medium md:text-5xl">
          {heading}
        </h2>
        <div className="mt-12 md:mt-16">
          <IllustratedMenu
            locale={locale}
            sections={sections}
            headingLevel={3}
            categoryHref={(category) =>
              `${cataloguePath(category.catalogue, locale)}#${category.slug}`
            }
          />
        </div>
        <div className="mt-16 flex justify-center">
          <CakeStand className="w-14 text-ink-muted" />
        </div>
      </div>
    </section>
  )
}

/** 4. Split: who is baking it. The only place on the page Jana herself appears. */
const About = ({ locale, about }: { locale: Locale; about: Home['about'] }) => (
  <section className="bg-raised px-4 py-20 md:px-10 md:py-28">
    <div className="mx-auto grid max-w-[1400px] items-center gap-10 md:grid-cols-[1fr_1.15fr] md:gap-20">
      <Reveal>
        <Photograph
          media={about.photograph}
          sizes="(min-width: 768px) 45vw, 100vw"
          preload={false}
          className="aspect-[4/5] w-full bg-ground object-cover md:aspect-auto md:h-[64vh]"
        />
      </Reveal>
      <Reveal delay={80}>
        <h2 className="max-w-[18ch] font-display text-[34px] leading-tight font-medium md:text-5xl">
          {about.heading}
        </h2>
        {paragraphs(about.body).map((each) => (
          <p key={each} className="mt-5 max-w-[48ch] text-[15px] leading-relaxed text-ink-muted">
            {each}
          </p>
        ))}
        <a
          href={pagePath('about', locale)}
          className={`mt-8 ${TEXT_LINK} decoration-rule hover:decoration-ink`}
        >
          {about.linkLabel}
        </a>
      </Reveal>
    </div>
  </section>
)

/** 5. Inset notice: allergies, carrying the site-wide cross-contamination statement. */
const AllergenNotice = ({
  allergens,
  statement,
}: {
  allergens: Home['allergens']
  statement: string | null | undefined
}) => (
  <section className="px-4 py-20 md:px-10 md:py-24">
    <div className="mx-auto max-w-[900px] border-l-2 border-accent bg-raised px-6 py-8 md:px-12 md:py-10">
      <h2 className="font-display text-[28px] leading-tight font-medium md:text-3xl">
        {allergens.heading}
      </h2>
      {allergens.intro ? (
        <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-ink-muted">
          {allergens.intro}
        </p>
      ) : null}
      {statement ? (
        <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-ink-muted">{statement}</p>
      ) : null}
    </div>
  </section>
)

/** 6. A customer, in her own words, at display size. */
const Quote = ({ quote }: { quote: Home['quote'] }) => (
  <section className="px-4 pb-20 md:px-10 md:pb-24">
    <Reveal>
      <figure className="mx-auto max-w-[900px] text-center">
        <blockquote className="font-display text-[26px] leading-[1.35] italic md:text-[40px]">
          <p>“{quote.text}”</p>
        </blockquote>
        <figcaption className="mt-8 text-sm tracking-wide text-ink-muted">
          {quote.attribution}
        </figcaption>
      </figure>
    </Reveal>
  </section>
)

/**
 * 7. Accordion. Native `<details>`, so it opens without JavaScript and every answer is in
 * the HTML for search.
 */
const Questions = ({ faq }: { faq: Home['faq'] }) => (
  <section className="px-4 pb-24 md:px-10 md:pb-28">
    <div className="mx-auto max-w-[820px]">
      <h2 className="font-display text-[34px] leading-tight font-medium md:text-4xl">
        {faq.heading}
      </h2>
      <div className="mt-8 border-t border-rule">
        {faq.questions.map(({ id, question, answer }) => (
          <details key={id ?? question} className="group border-b border-rule">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 font-display text-xl leading-snug [&::-webkit-details-marker]:hidden">
              {question}
              <span
                aria-hidden="true"
                className="shrink-0 font-sans text-lg text-ink-muted group-open:rotate-45 motion-safe:transition-transform motion-safe:duration-300"
              >
                +
              </span>
            </summary>
            <p className="max-w-[64ch] pb-5 text-[15px] leading-relaxed text-ink-muted">{answer}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
)

/** 8. Colour band: the page ends where it began, sending the customer into the menu. */
const Closing = ({
  closing,
  labels,
  cakes,
  nibbles,
}: {
  closing: Home['closing']
  labels: Pick<Home['hero'], 'cakesLabel' | 'nibblesLabel'>
  cakes: string
  nibbles: string
}) => (
  <section className="bg-accent px-4 py-24 text-accent-ink md:px-10 md:py-28">
    <div className="mx-auto max-w-[900px] text-center">
      <h2 className="font-display text-[34px] leading-tight font-medium md:text-5xl">
        {closing.heading}
      </h2>
      <p className="mx-auto mt-5 max-w-[52ch] text-[15px] leading-relaxed">{closing.body}</p>
      <div className="mt-10 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6">
        <a
          href={cakes}
          className={`bg-accent-ink px-8 py-4 text-sm tracking-wide whitespace-nowrap text-accent ${PRESS}`}
        >
          {labels.cakesLabel}
        </a>
        <a href={nibbles} className={TEXT_LINK}>
          {labels.nibblesLabel}
        </a>
      </div>
    </div>
  </section>
)

/** Jana's paragraphs, as she separated them with a blank line. */
const paragraphs = (text: string): string[] =>
  text
    .split(/\n\s*\n/)
    .map((each) => each.trim())
    .filter((each) => each !== '')
