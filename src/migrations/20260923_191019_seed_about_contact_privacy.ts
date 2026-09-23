import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import type { Contact } from '@/payload-types'

/**
 * Seeds the About, Contact, Custom order and Privacy globals in both locales and publishes
 * them, so the four pages build with words from their first deploy. A migration for the same
 * reason the Homepage seed is one: it runs exactly once per database, through the pipeline
 * that already runs on every deploy (ADR-0005). After this, the words are Jana's to edit.
 *
 * The English is a first draft; the Dutch is a first draft for Jana to correct.
 *
 * **Contact's details are deliberately not seeded** — email, phone, Instagram and opening
 * hours. A guessed address or phone number printed on a live page, and marked up for Google,
 * is worse than none; each one is left out of the page and the markup until Jana sets it.
 * Photographs are not seeded either; she uploads her own.
 *
 * **The privacy policy is a draft, not the policy.** It carries the four disclosures
 * ADR-0006 requires — Resend and the US transfer, the retention periods, Vercel and Neon as
 * processors, cookieless analytics — so the structure ships; the words are a launch-checklist
 * item that deserves a human reading them.
 */

// Lexical's stored JSON, text only: what the rich text fields hold.
const text = (value: string) => ({
  type: 'text',
  text: value,
  format: 0,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

const block = { format: '', indent: 0, version: 1, direction: 'ltr' as const }

const p = (value: string) => ({ ...block, type: 'paragraph', textFormat: 0, children: [text(value)] })

const h2 = (value: string) => ({ ...block, type: 'heading', tag: 'h2', children: [text(value)] })

const ul = (...items: string[]) => ({
  ...block,
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  start: 1,
  children: items.map((item, index) => ({
    ...block,
    type: 'listitem',
    value: index + 1,
    children: [text(item)],
  })),
})

const richText = (...children: Record<string, unknown>[]) => ({
  root: { ...block, type: 'root', children },
})

const ABOUT = {
  en: {
    heading: 'One kitchen, one pair of hands',
    story: richText(
      p('Jana bakes from home in Uithoorn. There is no shop and no counter: every cake starts with a message and is made for one particular day.'),
      p('It began with birthdays in the family, then friends of the family, then friends of friends. The menu grew out of what people kept asking for.'),
      p('Baking one order at a time means she can say yes to the things a bakery would turn down — and no, honestly, when the week is already full.'),
    ),
    cakesLabel: 'See what Jana bakes',
  },
  nl: {
    heading: 'Eén keuken, één paar handen',
    story: richText(
      p('Jana bakt thuis in Uithoorn. Er is geen winkel en geen toonbank: elke taart begint met een bericht en wordt gemaakt voor één bepaalde dag.'),
      p('Het begon met verjaardagen in de familie, daarna vrienden van de familie, daarna vrienden van vrienden. Het menu groeide uit wat mensen bleven vragen.'),
      p('Omdat ze één bestelling tegelijk bakt, kan ze ja zeggen tegen wat een bakkerij zou weigeren — en eerlijk nee als de week al vol is.'),
    ),
    cakesLabel: 'Bekijk wat Jana bakt',
  },
}

const CUSTOM_ORDER = {
  en: {
    heading: 'Something of your own',
    intro:
      'Not everything fits a menu. A cake in the shape of a first house, a colour that matches the invitations, a flavour from a holiday — Jana makes things to order.\n\nTell her what you have in mind, as much or as little as you know. She will reply with what she can make and what it would cost.',
    formHeading: 'Tell Jana what you’re imagining',
  },
  nl: {
    heading: 'Iets van jezelf',
    intro:
      'Niet alles past in een menu. Een taart in de vorm van een eerste huis, een kleur die past bij de uitnodigingen, een smaak van een vakantie — Jana maakt ook op maat.\n\nVertel haar wat je in gedachten hebt, zoveel of zo weinig als je al weet. Ze antwoordt met wat ze kan maken en wat het zou kosten.',
    formHeading: 'Vertel Jana wat je in gedachten hebt',
  },
}

type ContactCopy = Pick<Contact, 'heading' | 'intro' | 'collection' | 'formHeading'> & {
  faq: { heading: string; questions: { question: string; answer: string }[] }
}

const CONTACT: Record<'en' | 'nl', ContactCopy> = {
  en: {
    heading: 'Get in touch',
    intro: 'Jana reads every message herself. For a cake from the menu, the quickest way is the form on its page.',
    collection: {
      heading: 'Collecting your cake',
      policy:
        'Every order is collected from Jana’s home in Uithoorn, at a time you agree together. There is no delivery.\n\nBring a flat, level space in the car — a boot floor is better than a lap. Cakes are boxed, and are best kept cool until they are served.',
    },
    faq: {
      heading: 'Questions people ask',
      questions: [
        {
          question: 'Do you deliver?',
          answer: 'No. Every order is collected in Uithoorn, which is what keeps the cakes intact.',
        },
        {
          question: 'Why is there no address on the site?',
          answer:
            'Because it is Jana’s home. The address is sent with your confirmation, once the day and time are agreed.',
        },
        {
          question: 'How do I pay?',
          answer: 'Not through the website. Jana explains how when she confirms your order.',
        },
        {
          question: 'Can you bake without certain allergens?',
          answer:
            'Ask. Every cake lists what it contains, but Jana bakes in a home kitchen and cannot rule out traces.',
        },
      ],
    },
    formHeading: 'Ask a question',
  },
  nl: {
    heading: 'Neem contact op',
    intro: 'Jana leest elk bericht zelf. Voor een taart van het menu gaat het snelst via het formulier op de pagina van die taart.',
    collection: {
      heading: 'Je taart ophalen',
      policy:
        'Elke bestelling wordt opgehaald bij Jana thuis in Uithoorn, op een tijd die jullie samen afspreken. Bezorgen doet ze niet.\n\nZorg voor een vlakke plek in de auto — de kofferbakvloer is beter dan op schoot. Taarten zitten in een doos en blijven het best koel tot ze worden geserveerd.',
    },
    faq: {
      heading: 'Wat mensen vragen',
      questions: [
        {
          question: 'Bezorgen jullie?',
          answer: 'Nee. Elke bestelling wordt opgehaald in Uithoorn; zo blijven de taarten heel.',
        },
        {
          question: 'Waarom staat er geen adres op de site?',
          answer:
            'Omdat het Jana’s huis is. Het adres volgt met je bevestiging, zodra de dag en tijd zijn afgesproken.',
        },
        {
          question: 'Hoe betaal ik?',
          answer: 'Niet via de website. Jana legt uit hoe als ze je bestelling bevestigt.',
        },
        {
          question: 'Kun je bakken zonder bepaalde allergenen?',
          answer:
            'Vraag het. Bij elke taart staat wat erin zit, maar Jana bakt in een thuiskeuken en kan sporen niet uitsluiten.',
        },
      ],
    },
    formHeading: 'Stel een vraag',
  },
}

const PRIVACY = {
  en: richText(
    p('This policy explains what ThuisBakery does with your personal data when you use this website. ThuisBakery is Jana’s home bakery in Uithoorn, the Netherlands, and she is responsible for your data (the “controller”). You can reach her through the Contact page.'),
    h2('What we collect, and why'),
    p('When you send an enquiry or a message, we keep what you write in the form: your name, your email address, your phone number if you give one, your message, the pickup date you ask for, and an inspiration photo if you attach one. We use it only to reply to you and to arrange your order. We never sell it, and we do not use it for marketing.'),
    p('An inspiration photo is made smaller in your own browser before it is sent, and the location and camera details a phone stores inside a photo are removed. Only Jana sees it.'),
    h2('Email, and data outside the EU'),
    p('Enquiries and their acknowledgements are sent by Resend, an email service that processes this data on our behalf. Although the emails are sent from Ireland, Resend stores account data, email details and logs in the United States. That transfer is protected by the European Commission’s Standard Contractual Clauses and by Resend’s certification under the EU–U.S. Data Privacy Framework. Resend keeps its logs of sent emails for 30 days.'),
    h2('How long we keep it'),
    ul(
      'An inspiration photo is deleted 12 months after you send it.',
      'An enquiry is anonymised 24 months after you send it: your name, email address, phone number and photo are removed. What remains — which cake, which size, which month — is no longer about you.',
    ),
    h2('Where the website runs'),
    p('The website is hosted by Vercel, which also stores inspiration photos. Enquiries are kept in a database run by Neon. Both process data only on our behalf and under a data processing agreement.'),
    h2('Analytics and cookies'),
    p('We count visits with Vercel Web Analytics, which sets no cookies and does not follow you across other websites: a visit is recognised by a code made from the request, which is discarded after 24 hours. This website sets no cookies for analytics or advertising, which is why it does not ask for your consent.'),
    h2('Your rights'),
    p('You can ask to see the data we hold about you, to correct it, or to have it deleted, and you can object to how it is used. Get in touch through the Contact page. If you are not happy with how we handle your data, you can complain to the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).'),
  ),
  nl: richText(
    p('Dit beleid legt uit wat ThuisBakery doet met je persoonsgegevens als je deze website gebruikt. ThuisBakery is de thuisbakkerij van Jana in Uithoorn, en zij is verantwoordelijk voor je gegevens (de “verwerkingsverantwoordelijke”). Je bereikt haar via de contactpagina.'),
    h2('Wat we verzamelen, en waarom'),
    p('Als je een vraag of bericht stuurt, bewaren we wat je in het formulier invult: je naam, je e-mailadres, je telefoonnummer als je dat geeft, je bericht, de ophaaldatum die je vraagt en een inspiratiefoto als je die meestuurt. We gebruiken dit alleen om je te antwoorden en je bestelling te regelen. We verkopen het nooit en gebruiken het niet voor marketing.'),
    p('Een inspiratiefoto wordt in je eigen browser verkleind voordat hij wordt verstuurd, en de locatie- en cameragegevens die een telefoon in een foto opslaat worden verwijderd. Alleen Jana ziet hem.'),
    h2('E-mail, en gegevens buiten de EU'),
    p('Vragen en de bevestigingen daarvan worden verstuurd door Resend, een e-maildienst die deze gegevens namens ons verwerkt. Hoewel de e-mails vanuit Ierland worden verstuurd, bewaart Resend accountgegevens, e-mailgegevens en logboeken in de Verenigde Staten. Die doorgifte is beschermd door de standaardcontractbepalingen van de Europese Commissie en door de certificering van Resend onder het EU-VS-gegevensprivacykader (Data Privacy Framework). Resend bewaart zijn logboeken van verstuurde e-mails 30 dagen.'),
    h2('Hoe lang we het bewaren'),
    ul(
      'Een inspiratiefoto wordt 12 maanden nadat je hem stuurt verwijderd.',
      'Een vraag wordt 24 maanden nadat je hem stuurt geanonimiseerd: je naam, e-mailadres, telefoonnummer en foto worden verwijderd. Wat overblijft — welke taart, welke maat, welke maand — gaat dan niet meer over jou.',
    ),
    h2('Waar de website draait'),
    p('De website wordt gehost door Vercel, dat ook inspiratiefoto’s opslaat. Vragen worden bewaard in een database van Neon. Beide verwerken gegevens alleen namens ons en onder een verwerkersovereenkomst.'),
    h2('Statistieken en cookies'),
    p('We tellen bezoeken met Vercel Web Analytics. Dat plaatst geen cookies en volgt je niet over andere websites: een bezoek wordt herkend aan een code die uit het verzoek wordt gemaakt en na 24 uur wordt weggegooid. Deze website plaatst geen cookies voor statistieken of advertenties, en vraagt daarom niet om je toestemming.'),
    h2('Je rechten'),
    p('Je kunt vragen welke gegevens we over je hebben, ze laten verbeteren of laten verwijderen, en je kunt bezwaar maken tegen hoe ze worden gebruikt. Neem contact op via de contactpagina. Ben je niet tevreden over hoe we met je gegevens omgaan, dan kun je een klacht indienen bij de Autoriteit Persoonsgegevens.'),
  ),
}

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  for (const locale of ['en', 'nl'] as const) {
    await payload.updateGlobal({
      slug: 'about',
      locale,
      req,
      data: { ...ABOUT[locale], _status: 'published' },
    })

    await payload.updateGlobal({
      slug: 'custom-order',
      locale,
      req,
      data: { ...CUSTOM_ORDER[locale], _status: 'published' },
    })

    await payload.updateGlobal({
      slug: 'privacy',
      locale,
      req,
      data: { body: PRIVACY[locale], lastUpdated: '2026-09-23T12:00:00.000Z', _status: 'published' },
    })
  }

  // English first; Dutch is written onto the same question rows by id.
  const contact: Contact = await payload.updateGlobal({
    slug: 'contact',
    locale: 'en',
    req,
    data: { ...CONTACT.en, _status: 'published' },
  })

  await payload.updateGlobal({
    slug: 'contact',
    locale: 'nl',
    req,
    data: {
      ...CONTACT.nl,
      _status: 'published',
      faq: {
        heading: CONTACT.nl.faq.heading,
        questions: CONTACT.nl.faq.questions.map((row, index) => ({
          ...row,
          id: contact.faq.questions[index]?.id ?? null,
        })),
      },
    },
  })
}

/**
 * Nothing to undo on its own. Once seeded, the words are Jana's; rolling this back must not
 * erase her edits. The schema migration before this one drops the tables if it is undone.
 */
export async function down(_args: MigrateDownArgs): Promise<void> {}
