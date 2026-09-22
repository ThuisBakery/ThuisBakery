import { DICTIONARY } from '@/domain/dictionary'
import { otherLocale, pagePath, type Locale, type CodedPage } from '@/domain/routes'
import { cn } from '@/lib/utils'

/**
 * The language switcher (ADR-0002). Labelled in the language it leads to, never a flag —
 * a flag is a country, not a language — and landing on the same page in the other locale
 * rather than on its homepage.
 *
 * It is load-bearing: English is the default landing locale while the primary customer is
 * Dutch, so this is styled to be seen, not tucked into a utility bar. There is deliberately
 * no suggestion banner beside it; one was designed and dropped.
 */
export const LanguageSwitcher = ({
  locale,
  page,
  className,
}: {
  locale: Locale
  page: CodedPage
  className?: string
}) => {
  const target = otherLocale(locale)

  return (
    <a
      href={pagePath(page, target)}
      lang={target}
      hrefLang={target}
      className={cn(
        'inline-flex items-center border border-ink px-4 py-2 text-[13px] tracking-wide whitespace-nowrap transition-colors duration-300 hover:bg-ink hover:text-ground active:translate-y-px',
        className,
      )}
    >
      {DICTIONARY[locale].switchLanguage}
    </a>
  )
}
