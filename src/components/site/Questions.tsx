import { NAV_LINK } from './pressable'

/** A page's questions, as the Homepage and Contact globals hold them. */
type Faq = {
  heading: string
  questions: readonly { id?: string | null; question: string; answer: string }[]
}

/**
 * An accordion of questions and answers: the Homepage's seventh section and the Contact
 * page's FAQ. Native `<details>`, so it opens without JavaScript and every answer is in the
 * HTML for search.
 */
export const Questions = ({ faq }: { faq: Faq }) => (
  <section className="px-4 pb-24 md:px-10 md:pb-28">
    <div className="mx-auto max-w-[820px]">
      <h2 className="font-display text-[34px] leading-tight font-medium md:text-4xl">
        {faq.heading}
      </h2>
      <div className="mt-8 border-t border-rule">
        {faq.questions.map(({ id, question, answer }) => (
          <details key={id ?? question} className="group border-b border-rule">
            <summary
              className={`flex min-h-14 list-none items-center justify-between gap-6 py-4 font-display text-xl leading-snug [&::-webkit-details-marker]:hidden ${NAV_LINK}`}
            >
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
