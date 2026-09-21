/*
  PROTOTYPE ONLY. Variant A: "Menu Card".

  The thesis: Jana's printed menu becomes the website. Type-led, still,
  centered where she is centered, photography entering late and sparingly.
  The primary affordance is reading the menu top to bottom.

  Layout families, one use each: centered manifesto, typographic list,
  full-bleed photograph, asymmetric band, split, inset notice, quote,
  colour band. No eyebrows anywhere on the page.
*/

import { Leaf } from "@phosphor-icons/react/dist/ssr";
import {
  CATEGORIES,
  CTA,
  CakeStand,
  Footer,
  Header,
  Photo,
  Wordmark,
} from "./shared";
import { Reveal } from "./Reveal";

export default function VariantA() {
  return (
    <div id="top" className="bg-ground text-ink">
      <Header />

      {/* 1. Editorial hero: centered type in the upper half, one photograph
          bleeding across the lower edge of the viewport. The photograph
          carries the weight her card leaves to paper, without becoming the
          full-bleed photo hero that reads as every other bakery site. */}
      <section className="flex min-h-[100dvh] flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-5 pt-10 pb-12 text-center md:pt-16">
        <p className="text-6xl leading-[1.1] md:text-8xl">
          <Wordmark />
        </p>
        <h1 className="mt-7 max-w-[22ch] font-display text-[34px] leading-[1.15] font-medium md:text-6xl">
          Baked at home in Uithoorn
        </h1>
        <p className="mt-5 max-w-[50ch] text-[15px] leading-relaxed text-ink-muted">
          One cake at a time, made to order. Choose a size and a flavour, tell
          Jana your date, and she replies with a price.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <a
            href="#enquiry"
            className="bg-accent px-7 py-3.5 text-sm whitespace-nowrap text-accent-ink transition-transform duration-200 active:translate-y-px"
          >
            {CTA}
          </a>
          <a
            href="#cakes"
            className="border border-ink px-7 py-3.5 text-sm whitespace-nowrap transition-colors duration-300 hover:bg-ink hover:text-ground"
          >
            See the menu
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

      {/* 2. The menu as a typographic list. Her card, rebuilt for scroll. */}
      <section id="cakes" className="px-5 py-24 md:px-10 md:py-32">
        <div className="mx-auto max-w-[760px]">
          <Reveal>
            <h2 className="text-center font-display text-3xl md:text-5xl">
              The menu
            </h2>
          </Reveal>
          <ul className="mt-16 space-y-14">
            {CATEGORIES.map((c, i) => (
              <Reveal as="li" key={c.slug} delay={i * 0.05}>
                <a
                  href="#enquiry"
                  className="group block text-center transition-opacity duration-300 hover:opacity-70"
                >
                  <h3 className="font-display text-[28px] leading-tight font-semibold md:text-[38px]">
                    {c.name}
                  </h3>
                  <p className="mt-2 font-display text-lg text-ink-muted md:text-xl">
                    {c.tagline}
                  </p>
                  {c.note ? (
                    <p className="mt-1 font-display text-[15px] leading-[1.4] italic text-ink-muted">
                      {c.note}
                    </p>
                  ) : null}
                  <p className="mt-3 font-sans text-sm tracking-wide tabular-nums">
                    {c.price ?? "Price to confirm with Jana"}
                  </p>
                </a>
              </Reveal>
            ))}
          </ul>
          <div className="mt-20 flex justify-center">
            <CakeStand className="w-14 text-ink-muted" />
          </div>
        </div>
      </section>

      {/* 3. One full-bleed photograph. The only large image on the page. */}
      <section className="relative">
        <Photo
          seed="thuisbakery-kitchen-table-cake"
          alt="A finished cake on a kitchen table, placeholder photography"
          width={2400}
          height={1100}
          sizes="100vw"
          className="h-[52vh] w-full object-cover md:h-[68vh]"
        />
        <p className="mx-auto max-w-[1400px] px-5 pt-4 text-center text-sm text-ink-muted md:px-10">
          The Indulgent, in six inches.
        </p>
      </section>

      {/* 4. Asymmetric band: how an order actually happens. Verb headings,
          uneven columns, no cards, no numbered stage labels. */}
      <section className="px-5 py-24 md:px-10 md:py-32">
        <div className="mx-auto grid max-w-[1400px] gap-12 md:grid-cols-[2fr_1fr_1fr] md:gap-16">
          <Reveal>
            <h2 className="font-display text-3xl leading-tight md:text-5xl">
              There is no checkout here, and that is on purpose
            </h2>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-ink-muted">
              Every cake is made to order in one kitchen, so a date has to be
              agreed before anything is promised.
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h3 className="font-display text-2xl">Ask</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
              Send the size, the flavours and the day you need it. You will see
              an estimate as you fill it in.
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <h3 className="font-display text-2xl">Collect</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
              Jana confirms the price and the time, then sends the pickup
              address in Uithoorn.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 5. Split: the monthly Proefhapjes. */}
      <section className="bg-raised px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 md:grid-cols-2 md:gap-20">
          <Reveal>
            <Photo
              seed="thuisbakery-proefhapjes-tasting-board"
              alt="This month's tasting selection, placeholder photography"
              width={1200}
              height={1400}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="h-[60vh] w-full object-cover"
            />
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display text-3xl leading-tight md:text-5xl">
              Proefhapjes change every month
            </h2>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-ink-muted">
              A small board of whatever Jana is working on. It is the cheapest
              way to find out what you actually want for the big one.
            </p>
            <p className="mt-6 font-sans text-sm tracking-wide">€29</p>
            <a
              href="#enquiry"
              className="mt-8 inline-block border border-ink px-7 py-3.5 text-sm whitespace-nowrap transition-colors duration-300 hover:bg-ink hover:text-ground"
            >
              Ask about this month
            </a>
          </Reveal>
        </div>
      </section>

      {/* 6. Inset notice: allergens. The one place olive carries meaning. */}
      <section className="px-5 py-20 md:px-10 md:py-28">
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

      {/* 7. Quote. */}
      <section id="about" className="px-5 py-24 md:px-10 md:py-32">
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

      {/* 8. Colour band: the enquiry. */}
      <section
        id="enquiry"
        className="bg-accent px-5 py-24 text-accent-ink md:px-10 md:py-32"
      >
        <div className="mx-auto max-w-[900px] text-center">
          <h2 className="font-display text-3xl leading-tight md:text-5xl">
            Tell Jana what the day is for
          </h2>
          <p className="mx-auto mt-5 max-w-[52ch] text-[15px] leading-relaxed opacity-85">
            Orders need at least four days, and Saturdays fill first. Send the
            date and she will tell you what is possible.
          </p>
          <a
            href="#enquiry"
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
