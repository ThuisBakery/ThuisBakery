/*
  PROTOTYPE ONLY. Variant D: "Menu Card, with the conversation in it".

  Built from the feedback on the first round: A's register was right but its
  hero was empty, C's spine was right, B was a cliche and is dropped.

  So D keeps A's editorial type-led language and its typographic menu, gives
  the hero a photograph that bleeds off the lower edge rather than becoming
  a full-bleed photo hero, and folds in C's fact band, running Estimate and
  FAQ. The catalogue stays a menu you read. The enquiry stops being a
  destination at the end of the page.

  Layout families, one use each: editorial hero with bleed strip, icon fact
  band, typographic list, form with sticky panel, full-bleed photograph,
  inset notice, quote, accordion. No eyebrows anywhere on the page.
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
import { EnquiryForm } from "./EnquiryForm";

export default function VariantD() {
  return (
    <div id="top" className="bg-ground text-ink">
      <Header />

      {/* 1. Editorial hero. Type centered in the upper half, one photograph
          bleeding across the lower edge of the viewport. */}
      <section className="flex min-h-[100dvh] flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-5 pt-10 pb-12 text-center md:pt-16">
          <p className="text-6xl leading-[1.1] md:text-8xl">
            <Wordmark />
          </p>
          <h1 className="mt-7 max-w-[22ch] font-display text-[34px] leading-[1.15] font-medium md:text-6xl">
            Baked at home in Uithoorn
          </h1>
          <p className="mt-5 max-w-[50ch] text-[15px] leading-relaxed text-ink-muted">
            One cake at a time, made to order. Tell Jana your date and see
            roughly what it costs before you send anything.
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

      {/* 2. Fact band: the three things people ask before anything else. */}
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

      {/* 3. The menu, kept as a menu. A's typographic list. */}
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
          <div className="mt-20 flex justify-center">
            <CakeStand className="w-14 text-ink-muted" />
          </div>
        </div>
      </section>

      {/* 4. The enquiry, with the running Estimate from #11. */}
      <section
        id="enquiry"
        className="bg-raised px-5 py-20 md:px-10 md:py-28"
      >
        <div className="mx-auto max-w-[1400px]">
          <h2 className="max-w-[20ch] font-display text-3xl leading-tight md:text-5xl">
            Build it here and see the figure move
          </h2>
          <p className="mt-4 max-w-[54ch] text-[15px] leading-relaxed text-ink-muted">
            No account and no payment. This sends Jana a message, and she
            replies to agree the day and the real price.
          </p>
          <div className="mt-12">
            <EnquiryForm />
          </div>
        </div>
      </section>

      {/* 5. One full-bleed photograph. */}
      <section>
        <Photo
          seed="thuisbakery-cake-being-finished"
          alt="A cake being finished by hand, placeholder photography"
          width={2400}
          height={1000}
          sizes="100vw"
          className="h-[46vh] w-full object-cover md:h-[60vh]"
        />
      </section>

      {/* 6. Inset notice: allergens. */}
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

      {/* 7. Quote. */}
      <section id="about" className="px-5 pb-20 md:px-10 md:pb-28">
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

      {/* 8. Accordion: the questions that would otherwise become emails. */}
      <section className="px-5 pb-24 md:px-10 md:pb-32">
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

      <Footer />
    </div>
  );
}
