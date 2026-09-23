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
  /** Before a starting price, lower case: `from €25`. */
  priceFrom: string
  /** The accessible name of a catalogue page's in-page index of its Categories. */
  categoryIndex: string
  /** Placeholder page headings until each page's real content lands. */
  pageTitles: Record<CodedPage, string>
  /** The Item page's own labels. */
  item: {
    breadcrumb: string
    home: string
    sizes: string
    /** How a Size reads beside its label — diameter, layers, servings — each optional. */
    diameter: (centimetres: number) => string
    layers: (count: number) => string
    servings: (count: number) => string
    sponge: string
    filling: string
    allergens: string
    leadTime: string
    occasions: string
    /** The link back to the Item's Category section: `More Specialty Cakes`. */
    moreOf: (category: string) => string
    siblings: string
    /** The line before the link to Custom order. */
    somethingElse: string
  }
}

export const DICTIONARY: Record<Locale, Dictionary> = {
  en: {
    switchLanguage: 'In het Nederlands',
    skipToContent: 'Skip to content',
    mainNav: 'Main menu',
    footerNav: 'All pages',
    menu: 'Menu',
    close: 'Close',
    priceFrom: 'from',
    categoryIndex: 'Jump to',
    pageTitles: {
      home: 'Baked at home in Uithoorn',
      cakes: 'Cakes',
      nibbles: 'Nibbles',
      customOrder: 'Custom order',
      about: 'About Jana',
      contact: 'Contact',
      privacy: 'Privacy',
    },
    item: {
      breadcrumb: 'Breadcrumb',
      home: 'Home',
      sizes: 'Sizes',
      diameter: (centimetres) => `${centimetres} cm`,
      layers: (count) => (count === 1 ? '1 layer' : `${count} layers`),
      servings: (count) => `serves ${count}`,
      sponge: 'Sponge',
      filling: 'Filling',
      allergens: 'Allergens',
      leadTime: 'How far ahead to ask',
      occasions: 'Made for',
      moreOf: (category) => `More ${category}`,
      siblings: 'More from the menu',
      somethingElse: 'Imagining something else?',
    },
  },
  nl: {
    switchLanguage: 'In English',
    skipToContent: 'Naar de inhoud',
    mainNav: 'Hoofdmenu',
    footerNav: 'Alle pagina’s',
    menu: 'Menu',
    close: 'Sluiten',
    priceFrom: 'vanaf',
    categoryIndex: 'Ga naar',
    pageTitles: {
      home: 'Thuis gebakken in Uithoorn',
      cakes: 'Taarten',
      nibbles: 'Lekkernijen',
      customOrder: 'Maatwerk',
      about: 'Over Jana',
      contact: 'Contact',
      privacy: 'Privacy',
    },
    item: {
      breadcrumb: 'Kruimelpad',
      home: 'Home',
      sizes: 'Maten',
      diameter: (centimetres) => `${centimetres} cm`,
      layers: (count) => (count === 1 ? '1 laag' : `${count} lagen`),
      servings: (count) => `voor ${count} personen`,
      sponge: 'Biscuit',
      filling: 'Vulling',
      allergens: 'Allergenen',
      leadTime: 'Hoe ver van tevoren vragen',
      occasions: 'Gemaakt voor',
      moreOf: (category) => `Meer ${category}`,
      siblings: 'Meer van de kaart',
      somethingElse: 'Iets anders in gedachten?',
    },
  },
}

/** A coded page's `<title>`: the name alone on home, `<page> — ThuisBakery` elsewhere. */
export const documentTitle = (page: CodedPage, locale: Locale): string =>
  page === 'home' ? 'ThuisBakery' : `${DICTIONARY[locale].pageTitles[page]} — ThuisBakery`

/** An Item page's `<title>`: `<Item> — ThuisBakery`, as ADR-0002's computed fallback. */
export const itemTitle = (title: string): string => `${title} — ThuisBakery`
