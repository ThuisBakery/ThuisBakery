import { SomethingCustom } from '@/components/enquiry/CustomOrderHost'
import { ItemTiles } from '@/components/menu/ItemTiles'
import { CakeStand } from '@/components/site/CakeStand'
import { Paragraphs } from '@/components/site/Paragraphs'
import { Photograph } from '@/components/site/Photograph'
import { Questions } from '@/components/site/Questions'
import {
  BUTTON,
  BUTTON_ON_ACCENT,
  BUTTON_OUTLINE_LARGE,
  TEXT_LINK,
  TEXT_LINK_ON_ACCENT,
} from '@/components/site/pressable'
import { Reveal } from '@/components/site/Reveal'
import { DICTIONARY } from '@/domain/dictionary'
import { fromPrice, leadTimeFact } from '@/domain/home'
import { catalogueSections } from '@/domain/menu'
import { pagePath, type Locale } from '@/domain/routes'
import type { Category, Home, Item, LeadTime } from '@/payload-types'

/** The Lead time global as read: empty when it has never been saved. */
type LeadTimeFigures = Partial<Pick<LeadTime, 'days' | 'timeOfDay'>>

/**
 * `/` and `/nl` (ADR-0004): eight sections, eight layout families, no eyebrow labels, and
 * no Enquiry — the homepage sends the customer to an Item, and the Enquiry starts on its
 * page (ADR-0003). The wordmark is the header's; this page does not set it again.
 *
 * The menu comes straight after a short hero, and it is the cakes themselves, not their
 * Categories (ADR-0007): on a phone the first tile begins on the opening screen.
 *
 * Jana writes the words, through the Home global; the order and the layouts are fixed here.
 * The fact band's figures are read from where they are kept rather than written twice: the
 * Lead time global, and the Categories' own prices.
 */
export const HomePage = ({
  locale,
  home,
  categories,
  items,
  leadTime,
  statement,
}: {
  locale: Locale
  home: Home
  /** Every Category, from both catalogues. */
  categories: readonly Category[]
  /** The cake Items with a page in this locale; the menu files them under their Categories. */
  items: readonly Item[]
  /** When the Lead time global has never been saved, its fact is left out. */
  leadTime: LeadTimeFigures
  /** The cross-contamination statement, which is written once, on its own global. */
  statement: string | null | undefined
}) => {
  const cakes = pagePath('cakes', locale)
  const nibbles = pagePath('nibbles', locale)

  return (
    <div>
      <Hero locale={locale} hero={home.hero} cakes={cakes} />
      <Menu locale={locale} heading={home.menu.heading} categories={categories} items={items} />
      <FactBand locale={locale} facts={home.facts} categories={categories} leadTime={leadTime} />
      <About locale={locale} about={home.about} />
      <AllergenNotice allergens={home.allergens} statement={statement} />
      <Quote quote={home.quote} />
      {/* 7. Accordion. */}
      <Questions faq={home.faq} />
      <Closing closing={home.closing} labels={home.hero} cakes={cakes} nibbles={nibbles} />
    </div>
  )
}

/**
 * 1. A short hero: the headline, one line, and the two ways in — a cake from the menu, or
 * something of the customer's own. Short enough that the menu starts on a phone's first
 * screen, so the photograph stands beside the words on a wide screen and is left out on a
 * phone rather than pushing the cakes down.
 */
const Hero = ({ locale, hero, cakes }: { locale: Locale; hero: Home['hero']; cakes: string }) => (
  <section className="px-4 pt-8 pb-4 md:px-10 md:pt-12 md:pb-8">
    <div className="mx-auto grid max-w-[1400px] items-center gap-10 md:grid-cols-[1.05fr_1fr] md:gap-16">
      <div>
        <h1 className="max-w-[16ch] font-display text-[40px] leading-[1.05] font-medium md:text-[72px]">
          {hero.headline}
        </h1>
        <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-ink-muted md:mt-6 md:text-base">
          {hero.intro}
        </p>
        <div className="mt-6 flex flex-wrap gap-3 md:mt-9">
          <a href={cakes} className={BUTTON}>
            {hero.cakesLabel}
          </a>
          <SomethingCustom locale={locale} className={BUTTON_OUTLINE_LARGE}>
            {DICTIONARY[locale].somethingCustom}
          </SomethingCustom>
        </div>
      </div>
      <Photograph
        media={hero.photograph}
        sizes="(min-width: 768px) 48vw, 100vw"
        preload={false}
        className="hidden aspect-[5/4] w-full rounded-card bg-raised object-cover md:block"
      />
    </div>
  </section>
)

/** 3. Fact band: Lead time, pickup, and the starting price, ruled apart like the card. */
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

  // A price is set in Geist, as everywhere on the site (ADR-0007); the words in display.
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
 * 2. The menu: every cake, as an Item tile, in Jana's Category order. A tile leads to its
 * Item page; nothing here leads to a Category (ADR-0007). Nibbles are the closing band's
 * link, bought as a quantity on their own page.
 */
const Menu = ({
  locale,
  heading,
  categories,
  items,
}: {
  locale: Locale
  heading: string
  categories: readonly Category[]
  items: readonly Item[]
}) => {
  const entries = catalogueSections('cakes', categories, items).flatMap(({ category, items }) =>
    items.map((item) => ({ item, category })),
  )

  return (
    <section className="px-4 pt-8 pb-20 md:px-10 md:pt-16 md:pb-28">
      <div className="mx-auto max-w-[1400px]">
        <h2 className="font-display text-[30px] leading-tight font-medium md:text-5xl">
          {heading}
        </h2>
        <div className="mt-6 md:mt-12">
          <ItemTiles locale={locale} entries={entries} preloadFirst />
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
          className="aspect-[4/5] w-full rounded-card bg-ground object-cover md:aspect-auto md:h-[64vh]"
        />
      </Reveal>
      <Reveal delay={80}>
        <h2 className="max-w-[18ch] font-display text-[34px] leading-tight font-medium md:text-5xl">
          {about.heading}
        </h2>
        <Paragraphs
          text={about.body}
          className="mt-5 max-w-[48ch] text-[15px] leading-relaxed text-ink-muted"
        />
        <a href={pagePath('about', locale)} className={`mt-8 ${TEXT_LINK}`}>
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
        <blockquote className="font-display text-[26px] leading-[1.35] md:text-[40px]">
          <p>“{quote.text}”</p>
        </blockquote>
        <figcaption className="mt-8 text-sm tracking-wide text-ink-muted">
          {quote.attribution}
        </figcaption>
      </figure>
    </Reveal>
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
        <a href={cakes} className={BUTTON_ON_ACCENT}>
          {labels.cakesLabel}
        </a>
        <a href={nibbles} className={TEXT_LINK_ON_ACCENT}>
          {labels.nibblesLabel}
        </a>
      </div>
    </div>
  </section>
)
