import type { EnquiryProblem } from './enquiry'
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
  /**
   * The Enquiry form. The Estimate is never called a price, a total or a quote (CONTEXT.md):
   * its figure is labelled as the Estimate, and always as provisional.
   */
  enquiry: {
    heading: string
    intro: string
    size: string
    quantity: string
    requestedPickupDate: string
    requestedPickupDateHint: string
    /** The earliest date that can be asked for, under the date field. */
    earliest: (date: string) => string
    /** Stated whenever Closed until is ahead, beside any notice Jana writes. */
    closedUntil: (date: string) => string
    specialRequests: string
    specialRequestsHint: string
    name: string
    email: string
    phone: string
    estimate: string
    provisional: string
    /** What the Estimate covers, and that Jana's reply is what sets the figure. */
    estimateNote: string
    /** An Estimate line's label: `Large × 2`. */
    line: (label: string, quantity: number) => string
    send: string
    sending: string
    /** Above the form when a submit is stopped by the customer's own mistakes. */
    checkFields: string
    /** When the Submission could not be stored — our problem, never the customer's. */
    failed: string
    contactDirectly: string
    problems: Record<Exclude<EnquiryProblem, 'tooSoon' | 'closed' | 'invalidQuantity'>, string> & {
      invalidQuantity: (max: number) => string
      tooSoon: (earliest: string | null) => string
      closed: (until: string | null) => string
    }
  }
  /** The confirmation page: the customer's receipt. */
  sent: {
    heading: string
    whatNext: string
    /** When to expect Jana's reply, from the Lead time's days. */
    byWhen: (days: number) => string
    followUp: string
    receipt: string
    reference: (reference: number) => string
    item: string
    requestedPickupDate: string
    specialRequests: string
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
      enquirySent: 'Enquiry sent',
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
    enquiry: {
      heading: 'Send an enquiry',
      intro:
        'Tell Jana what you have in mind. This is not an order: nothing is booked or paid until she replies.',
      size: 'Size',
      quantity: 'How many',
      requestedPickupDate: 'Pickup date you’d like',
      requestedPickupDateHint: 'Pickup in Uithoorn. Jana confirms the date in her reply.',
      earliest: (date) => `The earliest you can ask for is ${date}.`,
      closedUntil: (date) => `Jana is closed until ${date}.`,
      specialRequests: 'Special requests',
      specialRequestsHint: 'A written message, colours or a theme. Jana prices these in her reply.',
      name: 'Your name',
      email: 'Email',
      phone: 'Phone (optional)',
      estimate: 'Estimate',
      provisional: 'Provisional',
      estimateNote:
        'Size, quantity and Filling only. Jana confirms the figure in her reply, with anything personal.',
      line: (label, quantity) => `${label} × ${quantity}`,
      send: 'Send enquiry',
      sending: 'Sending…',
      checkFields: 'A few details need another look.',
      failed:
        'Your enquiry could not be sent. The problem is on our side, not yours — please try again in a moment.',
      contactDirectly: 'Or get in touch directly',
      problems: {
        required: 'Please fill this in.',
        tooLong: 'This is too long — please shorten it.',
        invalidEmail: 'This does not look like an email address.',
        invalidQuantity: (max) => `Choose a whole number from 1 to ${max}.`,
        unknownChoice: 'Please choose one of the options.',
        invalidDate: 'Please choose a date.',
        tooSoon: (earliest) =>
          earliest ? `That is too soon. The earliest is ${earliest}.` : 'That is too soon.',
        closed: (until) =>
          until
            ? `Jana is closed until ${until}. Choose that day or later.`
            : 'Jana is closed then.',
      },
    },
    sent: {
      heading: 'Thank you. Jana has your enquiry.',
      whatNext:
        'Jana reads every enquiry herself and replies by email to confirm the date and the price. Nothing is booked until she does.',
      byWhen: (days) =>
        days <= 1 ? 'Expect her reply within a day.' : `Expect her reply within ${days} days.`,
      followUp: 'Heard nothing by then? Check your spam folder, then get in touch directly.',
      receipt: 'What you sent',
      reference: (reference) => `Reference ${reference}`,
      item: 'Item',
      requestedPickupDate: 'Pickup date you asked for',
      specialRequests: 'Special requests',
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
      enquirySent: 'Vraag verstuurd',
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
    enquiry: {
      heading: 'Stuur Jana je vraag',
      intro:
        'Vertel Jana wat je in gedachten hebt. Dit is geen bestelling: er ligt niets vast en je betaalt niets tot zij antwoordt.',
      size: 'Maat',
      quantity: 'Aantal',
      requestedPickupDate: 'Gewenste ophaaldatum',
      requestedPickupDateHint: 'Ophalen in Uithoorn. Jana bevestigt de datum in haar antwoord.',
      earliest: (date) => `De vroegste datum is ${date}.`,
      closedUntil: (date) => `Jana is gesloten tot ${date}.`,
      specialRequests: 'Bijzonderheden',
      specialRequestsHint:
        'Een tekst op de taart, kleuren of een thema. Jana rekent dit mee in haar antwoord.',
      name: 'Je naam',
      email: 'E-mail',
      phone: 'Telefoon (optioneel)',
      estimate: 'Indicatie',
      provisional: 'Voorlopig',
      estimateNote:
        'Alleen maat, aantal en vulling. Jana bevestigt het bedrag in haar antwoord, met alles wat persoonlijk is.',
      line: (label, quantity) => `${label} × ${quantity}`,
      send: 'Verstuur je vraag',
      sending: 'Versturen…',
      checkFields: 'Een paar gegevens kloppen nog niet.',
      failed:
        'Je vraag kon niet worden verstuurd. Het probleem ligt bij ons, niet bij jou — probeer het zo nog eens.',
      contactDirectly: 'Of neem direct contact op',
      problems: {
        required: 'Vul dit alsjeblieft in.',
        tooLong: 'Dit is te lang — maak het wat korter.',
        invalidEmail: 'Dit lijkt geen e-mailadres.',
        invalidQuantity: (max) => `Kies een heel getal van 1 tot en met ${max}.`,
        unknownChoice: 'Kies een van de opties.',
        invalidDate: 'Kies een datum.',
        tooSoon: (earliest) =>
          earliest ? `Dat is te snel. De vroegste datum is ${earliest}.` : 'Dat is te snel.',
        closed: (until) =>
          until ? `Jana is gesloten tot ${until}. Kies die dag of later.` : 'Jana is dan gesloten.',
      },
    },
    sent: {
      heading: 'Dank je wel. Jana heeft je vraag.',
      whatNext:
        'Jana leest elke vraag zelf en antwoordt per e-mail om de datum en het bedrag te bevestigen. Tot die tijd ligt er niets vast.',
      byWhen: (days) =>
        days <= 1 ? 'Je hoort binnen een dag van haar.' : `Je hoort binnen ${days} dagen van haar.`,
      followUp: 'Nog niets gehoord? Kijk in je spammap en neem dan direct contact op.',
      receipt: 'Wat je hebt gestuurd',
      reference: (reference) => `Referentie ${reference}`,
      item: 'Wat',
      requestedPickupDate: 'Gevraagde ophaaldatum',
      specialRequests: 'Bijzonderheden',
    },
  },
}

/** A coded page's `<title>`: the name alone on home, `<page> — ThuisBakery` elsewhere. */
export const documentTitle = (page: CodedPage, locale: Locale): string =>
  page === 'home' ? 'ThuisBakery' : `${DICTIONARY[locale].pageTitles[page]} — ThuisBakery`

/** An Item page's `<title>`: `<Item> — ThuisBakery`, as ADR-0002's computed fallback. */
export const itemTitle = (title: string): string => `${title} — ThuisBakery`
