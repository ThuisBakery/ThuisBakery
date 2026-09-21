/*
  PROTOTYPE ONLY. Variant E: "Menu Card, with a wall of cakes".

  Round three, built from three notes:

  1. "The randomness was the placement, not the actual image." C and D put a
     photograph next to the hero type because a hero needs a picture, not
     because the composition earned one. Fixed by giving photography its own
     section with a job, instead of scattering it.
  2. "A does not have photos of the cakes." True, and fatal for a baker. A
     had one strip and nothing else.
  3. "The builder built into the home page is not ideal." Agreed, and it also
     contradicts ADR-0003, which puts the enquiry on the Item page and on
     /custom-order. The Estimate is gone from the homepage. The homepage
     sends you to it.

  The gallery is the new piece. De Drie Graefjes runs an edge-to-edge band of
  photographs with no gutters and no captions, and it is the liveliest thing
  on their page. Taking the device, not the styling: asymmetric widths, zero
  gaps, no labels, full bleed. For a home baker this is proof of work, which
  is the one argument she has and a shop cannot make.

  Layout families, one use each: editorial hero with bleed strip, icon fact
  band, typographic list, full-bleed gallery wall, split, inset notice,
  quote, colour band. No eyebrows anywhere on the page.
*/

import { Clock, Leaf, MapPin, Receipt } from "@phosphor-icons/react/dist/ssr";
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

/* The wall. Seven photographs, deliberately uneven, so the eye moves across
   rather than reading a grid. Tags are restricted to ones verified to
   return real photographs from the placeholder service. */
const WALL = [
  { seed: "wall-01", tags: "cake", span: "md:col-span-2", alt: "A finished layer cake" },
  { seed: "wall-02", tags: "cupcake", span: "md:col-span-1", alt: "Cupcakes cooling" },
  { seed: "wall-03", tags: "cake", span: "md:col-span-3", alt: "A cake decorated by hand" },
  { seed: "wall-04", tags: "brownie", span: "md:col-span-3", alt: "A tray of brownies" },
  { seed: "wall-05", tags: "cake", span: "md:col-span-1", alt: "A bento cake" },
  { seed: "wall-06", tags: "cake", span: "md:col-span-2", alt: "A cake ready for collection" },
];

export default function VariantE() {
  return (
    <div id="top" className="bg-ground text-ink">
      <Header />

      {/* 1. Editorial hero. Type centered in the upper half, one photograph
          bleeding across the lower edge. The photograph is placed where the
          eye exits the section, not parked beside the headline. */}
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

      {/* 3. The menu, kept as a menu. */}
      <section id="cakes" className="px-5 py-24 md:px-10 md:py-28">
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
                  className="block text-center transition-opacity duration-300 hover:opacity-70"
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
          <div className="mt-16 flex justify-center">
            <CakeStand className="w-14 text-ink-muted" />
          </div>
        </div>
      </section>

      {/* 4. The wall. Full bleed, zero gutters, no captions, uneven widths.
          The one place on the page where the cakes do all the talking. */}
      <section aria-labelledby="wall-heading">
        <div className="mx-auto max-w-[1400px] px-5 pb-10 md:px-10">
          <h2
            id="wall-heading"
            className="max-w-[20ch] font-display text-3xl leading-tight md:text-5xl"
          >
            Everything on this page came out of one kitchen
          </h2>
        </div>
        {/* Fixed row height rather than per-cell aspect ratio: the columns
            are deliberately unequal, so an aspect ratio would rag the rows. */}
        <ul className="grid auto-rows-[44vw] grid-cols-2 gap-0 sm:auto-rows-[30vw] md:auto-rows-[19vw] md:grid-cols-6">
          {WALL.map((w) => (
            <li key={w.seed} className={`overflow-hidden ${w.span}`}>
              <Photo
                seed={w.seed}
                tags={w.tags}
                alt={`${w.alt}, placeholder photography`}
                width={900}
                height={900}
                sizes="(max-width: 768px) 50vw, 33vw"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]"
              />
            </li>
          ))}
        </ul>
      </section>

      {/* 5. Split: who is actually baking it. */}
      <section id="about" className="px-5 py-24 md:px-10 md:py-28">
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

      {/* 6. Inset notice: allergens. */}
      <section className="px-5 pb-20 md:px-10 md:pb-24">
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
      <section className="px-5 pb-24 md:px-10 md:pb-28">
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

      {/* 8. Colour band. The homepage hands off to the enquiry rather than
          hosting it. Per ADR-0003 the form lives on the Item page and on
          /custom-order, and the Estimate belongs with it. */}
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
