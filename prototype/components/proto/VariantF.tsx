/*
  PROTOTYPE ONLY. Variant F: "The illustrated menu".

  Round four. E was rejected outright: splitting the menu (typography, one
  place) from the cakes (a photo wall, another place) was the mistake. The
  menu and the images are one thing.

  So in F there is no separate gallery and no separate typographic list.
  Each Category IS a photograph with its name, its line and its price. The
  catalogue carries the photography, which is where a customer wants it: in
  front of the price, at the moment they are choosing.

  The risk this runs is looking like the competitors' product grids, which
  is exactly what the direction is trying not to be. Three things hold it
  off: the cells are deliberately unequal (7/5, 5/7, then a full-width
  band), there are no buy buttons anywhere since the whole entry is the
  link, and the type stays her serif at menu-card scale rather than
  shrinking into product-card labels.

  Layout families, one use each: editorial hero with bleed strip, icon fact
  band, asymmetric illustrated menu, split, inset notice, quote, accordion,
  colour band. No eyebrows anywhere on the page.
*/

import { Clock, Leaf, MapPin, Receipt } from "@phosphor-icons/react/dist/ssr";
import {
  CATEGORIES,
  CTA,
  CakeStand,
  FAQ,
  Footer,
  Header,
  Photo,
  Wordmark,
} from "./shared";
import { Reveal } from "./Reveal";

/* Unequal spans, so the menu reads as a spread rather than a grid of
   products. The last entry runs full width as a band. */
const SPANS = [
  "md:col-span-7",
  "md:col-span-5",
  "md:col-span-5",
  "md:col-span-7",
];

export default function VariantF() {
  const stacked = CATEGORIES.slice(0, 4);
  const band = CATEGORIES[4];

  return (
    <div id="top" className="bg-ground text-ink">
      <Header />

      {/* 1. Editorial hero. */}
      <section className="flex min-h-[100dvh] flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-5 pt-10 pb-12 text-center md:pt-16">
          <p className="text-6xl leading-[1.1] md:text-8xl">
            <Wordmark />
          </p>
          <h1 className="mt-7 max-w-[22ch] font-display text-[34px] leading-[1.15] font-medium md:text-6xl">
            Baked at home in Uithoorn
          </h1>
          <p className="mt-5 max-w-[50ch] text-[15px] leading-relaxed text-ink-muted">
            One cake at a time, made to order, for collection on the day you
            need it.
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <a
              href="#cakes"
              className="bg-accent px-7 py-3.5 text-sm whitespace-nowrap text-accent-ink transition-transform duration-200 active:translate-y-px"
            >
              {CTA}
            </a>
            <a
              href="#about"
              className="border border-ink px-7 py-3.5 text-sm whitespace-nowrap transition-colors duration-300 hover:bg-ink hover:text-ground"
            >
              Meet Jana
            </a>
          </div>
        </div>
        <Photo
          seed="thuisbakery-hero-strip"
          alt="A finished cake on the kitchen table, placeholder photography"
          width={2400}
          height={800}
          priority
          sizes="100vw"
          className="h-[30vh] w-full shrink-0 object-cover md:h-[34vh]"
        />
      </section>

      {/* 2. Fact band. */}
      <section className="border-b border-rule px-5 py-10 md:px-10">
        <dl className="mx-auto grid max-w-[1400px] gap-8 md:grid-cols-3 md:gap-16">
          {[
            {
              icon: Clock,
              t: "Four days notice",
              d: "Sent by 18:00, and sooner for a Saturday.",
            },
            {
              icon: MapPin,
              t: "Pickup in Uithoorn",
              d: "Address sent once your day is confirmed.",
            },
            {
              icon: Receipt,
              t: "From €25",
              d: "A bento cake. Full sizes run to about €110.",
            },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="flex items-start gap-3.5">
              <Icon size={20} className="mt-1 shrink-0 text-accent" />
              <div>
                <dt className="font-display text-xl">{t}</dt>
                <dd className="mt-1 text-[14px] leading-relaxed text-ink-muted">
                  {d}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* 3. The illustrated menu. The whole point of this variant: the
          photographs and the menu are one thing, not two sections. */}
      <section id="cakes" className="px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <h2 className="text-center font-display text-3xl md:text-5xl">
              The menu
            </h2>
          </Reveal>

          <ul className="mt-14 grid gap-10 md:grid-cols-12 md:gap-x-8 md:gap-y-16">
            {stacked.map((c, i) => (
              <Reveal as="li" key={c.slug} delay={i * 0.05} className={SPANS[i]}>
                <a href="#enquiry" className="group block">
                  <div className="overflow-hidden">
                    <Photo
                      seed={c.seed}
                      alt={`${c.name}, placeholder photography`}
                      width={1200}
                      height={900}
                      sizes="(max-width: 768px) 100vw, 55vw"
                      className="h-[46vh] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] md:h-[52vh]"
                    />
                  </div>
                  <div className="pt-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <h3 className="font-display text-[26px] leading-tight font-semibold md:text-[34px]">
                        {c.name}
                      </h3>
                      <p className="font-sans text-sm tracking-wide tabular-nums">
                        {c.price}
                      </p>
                    </div>
                    <p className="mt-1.5 font-display text-lg text-ink-muted">
                      {c.tagline}
                    </p>
                    {c.note ? (
                      <p className="mt-0.5 font-display text-[15px] leading-[1.4] italic text-ink-muted">
                        {c.note}
                      </p>
                    ) : null}
                  </div>
                </a>
              </Reveal>
            ))}

            {/* The fifth runs full width as a band, so the menu does not
                end on a lopsided row. */}
            <Reveal as="li" className="md:col-span-12">
              <a
                href="#enquiry"
                className="group grid items-center gap-6 md:grid-cols-[1.6fr_1fr] md:gap-12"
              >
                <div className="overflow-hidden">
                  <Photo
                    seed={band.seed}
                    tags="brownie"
                    alt={`${band.name}, placeholder photography`}
                    width={1600}
                    height={800}
                    sizes="(max-width: 768px) 100vw, 60vw"
                    className="h-[38vh] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] md:h-[42vh]"
                  />
                </div>
                <div>
                  <h3 className="font-display text-[26px] leading-tight font-semibold md:text-[34px]">
                    {band.name}
                  </h3>
                  <p className="mt-1.5 font-display text-lg text-ink-muted">
                    {band.tagline}
                  </p>
                  <p className="mt-3 font-sans text-sm tracking-wide">
                    {band.price ?? "Price to confirm with Jana"}
                  </p>
                </div>
              </a>
            </Reveal>
          </ul>

          <div className="mt-16 flex justify-center">
            <CakeStand className="w-14 text-ink-muted" />
          </div>
        </div>
      </section>

      {/* 4. Split: who is baking it. */}
      <section id="about" className="bg-raised px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 md:grid-cols-[1fr_1.15fr] md:gap-20">
          <Reveal>
            <Photo
              seed="thuisbakery-jana-portrait-kitchen"
              tags="baking"
              alt="Jana in her kitchen, placeholder photography"
              width={1100}
              height={1400}
              sizes="(max-width: 768px) 100vw, 45vw"
              className="h-[62vh] w-full object-cover"
            />
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="max-w-[18ch] font-display text-3xl leading-tight md:text-5xl">
              One kitchen, one pair of hands
            </h2>
            <p className="mt-6 max-w-[48ch] text-[15px] leading-relaxed text-ink-muted">
              Jana bakes from home in Uithoorn. There is no shop and no
              counter, which is why everything starts with a message rather
              than a basket.
            </p>
            <p className="mt-4 max-w-[48ch] text-[15px] leading-relaxed text-ink-muted">
              It also means she can say yes to the things a bakery would turn
              down, and no when the week is already full.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 5. Inset notice: allergens. */}
      <section className="px-5 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-[900px] border-l-2 border-accent bg-raised px-7 py-8 md:px-12 md:py-10">
          <div className="flex items-start gap-4">
            <Leaf size={22} className="mt-1 shrink-0 text-accent" />
            <div>
              <h2 className="font-display text-2xl md:text-3xl">
                About allergies
              </h2>
              <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-ink-muted">
                Every cake lists what it contains. Jana bakes in a home kitchen
                where nuts, egg, gluten and dairy are all in use, so traces
                cannot be ruled out of anything she makes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Quote. */}
      <section className="px-5 pb-20 md:px-10 md:pb-24">
        <figure className="mx-auto max-w-[900px] text-center">
          <Reveal>
            <blockquote className="font-display text-[26px] leading-[1.35] md:text-[40px]">
              &ldquo;I asked on the Tuesday for the Saturday and she still said
              yes. The cake was gone before the coffee was poured.&rdquo;
            </blockquote>
            <figcaption className="mt-8 text-sm text-ink-muted">
              Marieke van Dijk, Uithoorn
            </figcaption>
          </Reveal>
        </figure>
      </section>

      {/* 7. Accordion. */}
      <section className="px-5 pb-24 md:px-10 md:pb-28">
        <div className="mx-auto max-w-[820px]">
          <h2 className="font-display text-3xl md:text-4xl">Before you ask</h2>
          <div className="mt-8">
            {FAQ.map((f) => (
              <details
                key={f.q}
                className="group border-b border-rule py-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-6 font-display text-xl">
                  {f.q}
                  <span
                    aria-hidden
                    className="shrink-0 text-ink-muted transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-[64ch] text-[15px] leading-relaxed text-ink-muted">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Colour band. The enquiry lives on the Item page per ADR-0003,
          so the homepage sends you into the menu rather than hosting a form. */}
      <section
        id="enquiry"
        className="bg-accent px-5 py-24 text-accent-ink md:px-10 md:py-28"
      >
        <div className="mx-auto max-w-[900px] text-center">
          <h2 className="font-display text-3xl leading-tight md:text-5xl">
            Tell Jana what the day is for
          </h2>
          <p className="mx-auto mt-5 max-w-[52ch] text-[15px] leading-relaxed opacity-85">
            Pick a cake and you will see roughly what it costs as you fill the
            form in. Nothing is booked until Jana replies.
          </p>
          <a
            href="#cakes"
            className="mt-10 inline-block bg-[var(--accent-ink)] px-8 py-4 text-sm whitespace-nowrap text-[var(--accent)] transition-transform duration-200 active:translate-y-px"
          >
            {CTA}
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
