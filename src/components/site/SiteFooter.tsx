import { DICTIONARY } from '@/domain/dictionary'
import type { Locale, CodedPage } from '@/domain/routes'
import type { Footer } from '@/payload-types'

import { CakeStand } from './CakeStand'
import { LanguageSwitcher } from './LanguageSwitcher'
import { resolveLinks } from '@/domain/links'

/**
 * The site footer: every page in the inventory, in the locale's own terms (ADR-0003), and a
 * second language switcher. The name here is set in the display serif, not the script: the
 * Parisienne wordmark appears once per page, and the header already has it (ADR-0004).
 */
export const SiteFooter = ({
  locale,
  page,
  alternate,
  footer,
}: {
  locale: Locale
  page: CodedPage | null
  /** The language switcher's target, when it is not `page` in the other locale. */
  alternate?: string | undefined
  footer: Footer
}) => {
  const links = resolveLinks(footer.links, locale, page)

  return (
    <footer className="px-4 pt-16 pb-10 md:px-10">
      <div className="mx-auto max-w-[1400px] border-t border-rule pt-10">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_auto] md:items-start">
          <div>
            <CakeStand className="h-12 w-14 text-ink-muted" />
            <p className="mt-4 font-display text-2xl">ThuisBakery</p>
            <p className="mt-2 max-w-[38ch] text-sm leading-relaxed text-ink-muted">
              {footer.tagline}
            </p>
          </div>
          <nav aria-label={DICTIONARY[locale].footerNav}>
            <ul className="grid grid-flow-col grid-rows-4 gap-x-8 gap-y-2 text-sm">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={link.current ? 'page' : undefined}
                    className="text-ink-muted transition-colors duration-300 hover:text-ink aria-[current=page]:text-ink"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <LanguageSwitcher
            locale={locale}
            page={page}
            alternate={alternate}
            className="justify-self-start"
          />
        </div>
      </div>
    </footer>
  )
}
