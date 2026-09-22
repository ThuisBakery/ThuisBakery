import type { Locale, CodedPage } from './routes'

/**
 * The shell's own words, per locale — the few strings that are code rather than content.
 * Everything Jana writes lives in Payload; these are the labels of the machinery around it.
 */
export type Dictionary = {
  /**
   * The language switcher's label, **in the language it leads to** (ADR-0002): a Dutch
   * speaker on an English page must be able to read it. So the English dictionary holds
   * Dutch here, and the other way round.
   */
  switchLanguage: string
  skipToContent: string
  /** The accessible name of the header's navigation landmark. */
  mainNav: string
  /** The accessible name of the footer's navigation landmark. */
  footerNav: string
  menu: string
  close: string
  /** Placeholder page headings until each page's real content lands. */
  pageTitles: Record<CodedPage, string>
}

export const DICTIONARY: Record<Locale, Dictionary> = {
  en: {
    switchLanguage: 'In het Nederlands',
    skipToContent: 'Skip to content',
    mainNav: 'Main menu',
    footerNav: 'All pages',
    menu: 'Menu',
    close: 'Close',
    pageTitles: {
      home: 'Baked at home in Uithoorn',
      cakes: 'Cakes',
      nibbles: 'Nibbles',
      customOrder: 'Custom order',
      about: 'About Jana',
      contact: 'Contact',
      privacy: 'Privacy',
    },
  },
  nl: {
    switchLanguage: 'In English',
    skipToContent: 'Naar de inhoud',
    mainNav: 'Hoofdmenu',
    footerNav: 'Alle pagina’s',
    menu: 'Menu',
    close: 'Sluiten',
    pageTitles: {
      home: 'Thuis gebakken in Uithoorn',
      cakes: 'Taarten',
      nibbles: 'Lekkernijen',
      customOrder: 'Maatwerk',
      about: 'Over Jana',
      contact: 'Contact',
      privacy: 'Privacy',
    },
  },
}

/** A coded page's `<title>`: the name alone on home, `<page> — ThuisBakery` elsewhere. */
export const documentTitle = (page: CodedPage, locale: Locale): string =>
  page === 'home' ? 'ThuisBakery' : `${DICTIONARY[locale].pageTitles[page]} — ThuisBakery`
