/**
 * A page's content until its own ticket lands. Deliberately plain: the shell around it is
 * what #20 ships, and the real pages bring their own layouts (ADR-0004).
 */
export const Placeholder = ({ title }: { title: string }) => (
  <section className="flex flex-col items-center px-4 py-24 text-center md:py-36">
    <h1 className="max-w-[22ch] font-display text-[34px] leading-[1.15] font-medium md:text-6xl">
      {title}
    </h1>
  </section>
)
