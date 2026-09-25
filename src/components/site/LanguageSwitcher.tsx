import { DICTIONARY } from '@/domain/dictionary'
import { otherLocale, pagePath, type Locale, type CodedPage } from '@/domain/routes'
import { cn } from '@/lib/utils'

import { BUTTON_OUTLINE } from './pressable'

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
  alternate,
  className,
}: {
  locale: Locale
  page: CodedPage | null
  /**
   * This page's path in the other locale, when it is not a coded page's — an Item's. An
   * Item untranslated there has no such path, and the caller passes where it should land.
   */
  alternate?: string | undefined
  className?: string
}) => {
  const target = otherLocale(locale)

  return (
    <a
      href={alternate ?? pagePath(page ?? 'home', target)}
      lang={target}
      hrefLang={target}
      className={cn(BUTTON_OUTLINE, className)}
    >
      {DICTIONARY[locale].switchLanguage}
    </a>
  )
}
