/*
  PROTOTYPE ONLY. Variant B: "The Table".

  The thesis: the cakes carry the page. An editorial food-magazine
  structure, photography-first and asymmetric, with type stepping back to
  caption duty. The primary affordance is looking.

  Layout families, one use each: full-bleed photographic hero, asymmetric
  bento, horizontal scroll-snap rail, split, marquee, grouped columns,
  quote, colour band. One eyebrow on the page, in the rail section.
*/

import {
  CATEGORIES,
  CTA,
  Footer,
  Header,
  ITEMS,
  Photo,
  Wordmark,
  img,
} from "./shared";
import { Reveal } from "./Reveal";

export default function VariantB() {
  const [lead, ...rest] = CATEGORIES;

  return (
    <div id="top" className="bg-ground text-ink">
      {/* 1. Full-bleed photographic hero. Header overlays it. */}
      <section className="relative min-h-[100dvh] w-full overflow-hidden">
        <Photo
          seed="thuisbakery-hero-cake-on-linen"
          alt="A finished cake photographed on linen, placeholder photography"
          width={2400}
          height={1600}
          priority
          sizes="100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Scrim: carries the overlaid type to WCAG AA over any photograph. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-[rgba(26,18,14,0.82)] via-[rgba(26,18,14,0.38)] to-[rgba(26,18,14,0.5)]"
        />
        <Header overlay />
        <div className="relative z-10 flex min-h-[100dvh] items-end px-5 pt-24 pb-16 md:px-10 md:pb-24">
          <div className="mx-auto w-full max-w-[1400px]">
            <p className="text-5xl leading-none text-[#F4EFE6] md:text-7xl">
              <Wordmark />
            </p>
            <h1 className="mt-6 max-w-[15ch] font-display text-[34px] leading-[1.1] font-medium text-[#F4EFE6] md:text-7xl">
              The cake is what they remember
            </h1>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-[#E4DACF]">
              Made to order in a home kitchen in Uithoorn, for collection when
              you need it.
            </p>
            <a
              href="#enquiry"
              className="mt-9 inline-block bg-[#F4EFE6] px-8 py-4 text-sm whitespace-nowrap text-[#2A1F19] transition-transform duration-200 active:translate-y-px"
            >
              {CTA}
            </a>
          </div>
        </div>
      </section>

      {/* 2. Asymmetric bento. Exactly five cells for five parts of the menu,
          with real visual variation: three photographs, one olive tile, one
          quiet cream tile. */}
      <section id="cakes" className="px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          <Reveal>
            <h2 className="max-w-[20ch] font-display text-3xl leading-tight md:text-5xl">
              What comes out of the kitchen
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-4 md:grid-cols-3 md:grid-rows-2">
            <Reveal className="md:col-span-2 md:row-span-2">
              <a href="#enquiry" className="group block h-full">
                <div className="relative h-[46vh] overflow-hidden md:h-full md:min-h-[560px]">
                  <Photo
                    seed={lead.seed}
                    alt={`${lead.name}, placeholder photography`}
                    width={1600}
                    height={1600}
                    sizes="(max-width: 768px) 100vw, 66vw"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="pt-4">
                  <h3 className="font-display text-2xl md:text-3xl">
                    {lead.name}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">{lead.tagline}</p>
                  <p className="mt-2 text-sm tabular-nums">{lead.price}</p>
                </div>
              </a>
            </Reveal>

            {/* Photo cell */}
            <Reveal delay={0.06}>
              <a href="#enquiry" className="group block">
                <div className="relative h-[34vh] overflow-hidden md:h-[260px]">
                  <Photo
                    seed={rest[0].seed}
                    alt={`${rest[0].name}, placeholder photography`}
                    width={900}
                    height={700}
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="pt-3">
                  <h3 className="font-display text-xl">{rest[0].name}</h3>
                  <p className="mt-1 text-sm tabular-nums text-ink-muted">
                    {rest[0].price}
                  </p>
                </div>
              </a>
            </Reveal>

            {/* Olive tile: the one cell that is colour, not photography */}
            <Reveal delay={0.12}>
              <a
                href="#enquiry"
                className="flex h-full min-h-[260px] flex-col justify-between bg-accent p-6 text-accent-ink transition-opacity duration-300 hover:opacity-92"
              >
                <h3 className="font-display text-2xl leading-tight">
                  {rest[1].name}
                </h3>
                <div>
                  <p className="text-sm leading-relaxed opacity-85">
                    {rest[1].tagline}
                  </p>
                  <p className="mt-3 text-sm tabular-nums">{rest[1].price}</p>
                </div>
              </a>
            </Reveal>
          </div>

          {/* Remaining two, wider and shallower, to break the grid rhythm */}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Reveal>
              <a href="#enquiry" className="group block">
                <div className="relative h-[30vh] overflow-hidden md:h-[300px]">
                  <Photo
                    seed={rest[2].seed}
                    alt={`${rest[2].name}, placeholder photography`}
                    width={1200}
                    height={700}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="pt-3">
                  <h3 className="font-display text-xl">{rest[2].name}</h3>
                  <p className="mt-1 text-sm tabular-nums text-ink-muted">
                    {rest[2].price}
                  </p>
                </div>
              </a>
            </Reveal>
            <Reveal delay={0.06} className="h-full">
              <a
                href="#nibbles"
                id="nibbles"
                className="flex h-full min-h-[300px] flex-col justify-between bg-raised p-7 transition-colors duration-300 hover:bg-[var(--rule)]"
              >
                <h3 className="font-display text-2xl leading-tight">
                  {rest[3].name}
                </h3>
                <div>
                  <p className="text-sm leading-relaxed text-ink-muted">
                    {rest[3].tagline}
                  </p>
                  <p className="mt-3 text-sm text-ink-muted">
                    Price to confirm with Jana
                  </p>
                </div>
              </a>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3. Horizontal scroll-snap rail. Breadth without a product grid. */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <p className="text-[11px] tracking-[0.18em] uppercase text-ink-muted">
            On the table this week
          </p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl">
            Ready to order now
          </h2>
        </div>
        <ul className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 md:px-10">
          {ITEMS.map((item) => (
            <li
              key={item.name}
              className="w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[30vw]"
            >
              <a href="#enquiry" className="group block">
                <Photo
                  seed={item.seed}
                  alt={`${item.name}, placeholder photography`}
                  width={900}
                  height={1000}
                  sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 30vw"
                  className="h-[46vh] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] md:h-[420px]"
                />
                <div className="flex items-baseline justify-between pt-3">
                  <h3 className="font-display text-xl">{item.name}</h3>
                  <span className="text-sm tabular-nums text-ink-muted">
                    {item.price}
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* 4. Split: who is actually baking it. */}
      <section id="about" className="px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 md:grid-cols-[1fr_1.15fr] md:gap-20">
          <Reveal>
            <Photo
              seed="thuisbakery-jana-portrait-kitchen"
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

      {/* 5. Marquee. The only moving element on the page, and the only
          marquee. Its job is breadth: many flavours, none needing focus. */}
      <section className="overflow-hidden border-y border-rule py-6">
        <div className="marquee flex w-max gap-10 whitespace-nowrap font-display text-2xl text-ink-muted md:text-3xl">
          {[0, 1].map((pass) => (
            <div key={pass} className="flex gap-10" aria-hidden={pass === 1}>
              {[
                "Chocolate",
                "Vanilla",
                "Funfetti",
                "Red Velvet",
                "Cream Cheese",
                "Salted Caramel",
                "Ganache",
              ].map((f) => (
                <span key={f}>{f}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* 6. Grouped columns: what things cost, without a spec table. */}
      <section className="px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1400px] gap-12 md:grid-cols-2 md:gap-24">
          <Reveal>
            <h2 className="font-display text-3xl leading-tight md:text-4xl">
              What it costs
            </h2>
            <div className="hairline mt-8 pt-8">
              <dl className="space-y-5">
                {CATEGORIES.slice(0, 4).map((c) => (
                  <div key={c.slug} className="flex items-baseline gap-4">
                    <dt className="font-display text-xl">{c.name}</dt>
                    <span
                      aria-hidden
                      className="h-px flex-1 bg-[var(--rule)]"
                    />
                    <dd className="text-sm tabular-nums text-ink-muted">
                      {c.price}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display text-3xl leading-tight md:text-4xl">
              What changes it
            </h2>
            <div className="hairline mt-8 pt-8">
              <p className="max-w-[46ch] text-[15px] leading-relaxed text-ink-muted">
                Size and quantity set the figure you see. Some fillings add a
                little. Anything personal, a written message, a colour, a
                theme, is priced by Jana when she replies.
              </p>
              <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-ink-muted">
                Allergens are listed on every cake. The kitchen handles nuts,
                egg, gluten and dairy, so traces cannot be ruled out.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7. Quote. */}
      <section className="bg-raised px-5 py-20 md:px-10 md:py-28">
        <figure className="mx-auto max-w-[820px]">
          <blockquote className="font-display text-[26px] leading-[1.35] md:text-[38px]">
            &ldquo;She sent a photo the night before so we knew exactly what we
            were collecting. Nobody believed it came out of a house.&rdquo;
          </blockquote>
          <figcaption className="mt-7 text-sm text-ink-muted">
            Sanne de Bruin, Amstelveen
          </figcaption>
        </figure>
      </section>

      {/* 8. Colour band. */}
      <section
        id="enquiry"
        className="bg-accent px-5 py-20 text-accent-ink md:px-10 md:py-28"
      >
        <div className="mx-auto grid max-w-[1400px] items-end gap-8 md:grid-cols-[1.4fr_1fr]">
          <h2 className="max-w-[16ch] font-display text-3xl leading-tight md:text-5xl">
            Send Jana the date and the occasion
          </h2>
          <div>
            <p className="max-w-[40ch] text-[15px] leading-relaxed opacity-85">
              Four days notice as a minimum. Saturdays go first.
            </p>
            <a
              href="#enquiry"
              className="mt-7 inline-block bg-[var(--accent-ink)] px-8 py-4 text-sm whitespace-nowrap text-[var(--accent)] transition-transform duration-200 active:translate-y-px"
            >
              {CTA}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
