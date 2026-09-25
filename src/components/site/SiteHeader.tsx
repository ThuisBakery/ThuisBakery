import { DICTIONARY } from '@/domain/dictionary'
import { pagePath, type Locale, type CodedPage } from '@/domain/routes'
import type { Header } from '@/payload-types'

import { LanguageSwitcher } from './LanguageSwitcher'
import { resolveLinks } from '@/domain/links'
import { MobileMenu } from './MobileMenu'
import { ThemeToggle } from './ThemeToggle'
import { Wordmark } from './Wordmark'

/**
 * The site header: the wordmark, the four nav links and the Custom order button from the
 * Header global (ADR-0003), and the language switcher beside them. The switcher stays
 * visible at every width, because it is load-bearing (ADR-0002), and so does the theme control
 * (ADR-0007); only the nav folds into a menu on a phone.
 */
export const SiteHeader = ({
  locale,
  page,
  alternate,
  header,
}: {
  locale: Locale
  page: CodedPage | null
  /** The language switcher's target, when it is not `page` in the other locale. */
  alternate?: string | undefined
  header: Header
}) => {
  const words = DICTIONARY[locale]
  const links = resolveLinks(header.links, locale, page)
  const [callToAction] = resolveLinks([header.callToAction], locale, page)

  if (!callToAction) {
    throw new Error('The Header global has no Custom order button.')
  }

  return (
    <header className="relative z-20 text-ink">
      <a
        href="#content"
        className="sr-only bg-ink px-4 py-2 text-ground focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        {words.skipToContent}
      </a>
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between gap-4 px-4 md:px-10">
        <a href={pagePath('home', locale)} className="text-[26px] md:text-[28px]">
          <Wordmark />
        </a>
        <nav aria-label={words.mainNav} className="hidden items-center gap-8 md:flex">
          <ul className="flex items-center gap-8">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  aria-current={link.current ? 'page' : undefined}
                  className="text-[13px] tracking-wide opacity-80 transition-opacity duration-300 hover:opacity-100 aria-[current=page]:opacity-100"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={callToAction.href}
            aria-current={callToAction.current ? 'page' : undefined}
            className="bg-accent px-5 py-2.5 text-[13px] tracking-wide whitespace-nowrap text-accent-ink transition-transform duration-200 active:translate-y-px"
          >
            {callToAction.label}
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle labels={words.theme} />
          <LanguageSwitcher locale={locale} page={page} alternate={alternate} />
          <MobileMenu
            links={links}
            callToAction={callToAction}
            labels={{ menu: words.menu, close: words.close, nav: words.mainNav }}
          />
        </div>
      </div>
    </header>
  )
}
