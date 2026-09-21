/*
  PROTOTYPE ONLY. Variant C: "The Conversation".

  The thesis: the enquiry is the page, not a destination at the end of it.
  The Estimate from #11 sits above the fold on the homepage, and the
  catalogue is demoted to a reference list. The primary affordance is
  starting a conversation.

  Layout families, one use each: split hero, fact band, form with sticky
  panel, compact thumbnail list, full-bleed photograph, notice, centered
  text, accordion. One eyebrow on the page, above the form.
*/

import { Clock, MapPin, Receipt } from "@phosphor-icons/react/dist/ssr";
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

export default function VariantC() {
  return (
    <div id="top" className="bg-ground text-ink">
      <Header />

      {/* 1. Split hero: the ask on the left, the proof on the right. */}
      <section className="px-5 pt-10 pb-16 md:px-10 md:pt-16 md:pb-24">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 md:grid-cols-[1.05fr_1fr] md:gap-16">
          <div>
            <p className="text-5xl leading-none md:text-6xl">
              <Wordmark />
            </p>
            <h1 className="mt-6 max-w-[15ch] font-display text-4xl leading-[1.12] font-medium md:text-6xl">
              Tell Jana what the cake is for
            </h1>
            <p className="mt-5 max-w-[48ch] text-[15px] leading-relaxed text-ink-muted">
              Answer four questions and you will see roughly what it costs
              before you send anything.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href="#enquiry"
                className="bg-accent px-7 py-3.5 text-center text-sm whitespace-nowrap text-accent-ink transition-transform duration-200 active:translate-y-px"
              >
                {CTA}
              </a>
              <a
                href="#cakes"
                className="border border-ink px-7 py-3.5 text-center text-sm whitespace-nowrap transition-colors duration-300 hover:bg-ink hover:text-ground"
              >
                See the menu
              </a>
            </div>
          </div>
          <Photo
            seed="thuisbakery-hero-cake-on-linen"
            alt="A finished cake ready for collection, placeholder photography"
            width={1200}
            height={1300}
            priority
            sizes="(max-width: 768px) 100vw, 48vw"
            className="h-[52vh] w-full object-cover md:h-[70vh]"
          />
        </div>
      </section>

      {/* 2. Fact band: the three things people ask before anything else. */}
      <section className="border-y border-rule px-5 py-10 md:px-10">
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

      {/* 3. The form. The whole point of this variant. */}
      <section id="enquiry" className="px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-[11px] tracking-[0.18em] uppercase text-ink-muted">
            No account, no payment
          </p>
          <h2 className="mt-3 max-w-[20ch] font-display text-3xl leading-tight md:text-5xl">
            Build it here and see the figure move
          </h2>
          <div className="mt-12">
            <EnquiryForm />
          </div>
        </div>
      </section>

      {/* 4. Compact catalogue: reference, not shopfront. */}
      <section id="cakes" className="bg-raised px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1400px]">
          <h2 className="font-display text-3xl md:text-4xl">
            What she makes
          </h2>
          <ul className="mt-10 grid gap-x-14 gap-y-8 md:grid-cols-2">
            {CATEGORIES.map((c, i) => (
              <Reveal as="li" key={c.slug} delay={i * 0.04} id={c.slug}>
                <a
                  href="#enquiry"
                  className="group flex items-center gap-5 transition-opacity duration-300 hover:opacity-75"
                >
                  <Photo
                    seed={c.seed}
                    alt={`${c.name}, placeholder photography`}
                    width={260}
                    height={260}
                    sizes="88px"
                    className="h-[88px] w-[88px] shrink-0 object-cover"
                  />
                  <div className="min-w-0">
                    <h3 className="font-display text-xl">{c.name}</h3>
                    <p className="mt-0.5 truncate text-[14px] text-ink-muted">
                      {c.tagline}
                    </p>
                    <p className="mt-1 text-[13px] tabular-nums text-ink-muted">
                      {c.price ?? "Price to confirm with Jana"}
                    </p>
                  </div>
                </a>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* 5. One full-bleed photograph, for the thing the form cannot say. */}
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

      {/* 6. Notice. */}
      <section className="px-5 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-[900px] border-l-2 border-accent px-6 py-2 md:px-8">
          <h2 className="font-display text-2xl">About allergies</h2>
          <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-ink-muted">
            Every cake lists what it contains. Jana bakes in a home kitchen
            where nuts, egg, gluten and dairy are all in use, so traces cannot
            be ruled out of anything she makes.
          </p>
        </div>
      </section>

      {/* 7. Centered short text about Jana. */}
      <section id="about" className="px-5 pb-20 md:px-10 md:pb-28">
        <div className="mx-auto max-w-[620px] text-center">
          <CakeStand className="mx-auto w-12 text-ink-muted" />
          <h2 className="mt-8 font-display text-3xl leading-tight md:text-4xl">
            Jana bakes from her own kitchen in Uithoorn
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-muted">
            There is no shop, no counter and no van. What there is, is one
            person who can say yes to the cake a bakery would turn down, and no
            when the week is already full.
          </p>
        </div>
      </section>

      {/* 8. Accordion: the questions that would otherwise become emails. */}
      <section className="px-5 pb-24 md:px-10 md:pb-32">
        <div className="mx-auto max-w-[820px]">
          <h2 className="font-display text-3xl md:text-4xl">
            Before you ask
          </h2>
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
