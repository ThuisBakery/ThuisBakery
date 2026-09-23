import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'

import type { Home } from '@/payload-types'

/**
 * Seeds the Home global in both locales and publishes it, so the homepage builds with words
 * in every section from its first deploy. A migration for the same reason the Header and
 * Footer seed is one: it runs exactly once per database, through the pipeline that already
 * runs on every deploy (ADR-0005). After this, the words are Jana's to edit.
 *
 * The English is the accepted prototype's (ADR-0004, variant F), with its figures taken
 * out: the Lead time and prices are read from where they are kept, never written here. The
 * optional line under the price is left empty for Jana, since any line seeded now could
 * contradict a price she sets later. The Dutch is a first draft for Jana to correct.
 * Photographs are not seeded; she uploads her own.
 *
 * English is written first; Dutch is written onto the same question rows by id.
 */

type Copy = Omit<Home, 'id' | 'hero' | 'about' | 'faq' | 'updatedAt' | 'createdAt'> & {
  hero: Omit<Home['hero'], 'photograph'>
  about: Omit<Home['about'], 'photograph'>
  faq: { heading: string; questions: { question: string; answer: string }[] }
}

const EN: Copy = {
  hero: {
    headline: 'Baked at home in Uithoorn',
    intro: 'One cake at a time, baked for the day you need it.',
    cakesLabel: 'See the cakes',
    nibblesLabel: 'or the nibbles',
  },
  facts: {
    pickupTitle: 'Pickup in Uithoorn',
    pickupDetail: 'Address sent once your day is confirmed.',
  },
  menu: { heading: 'The menu' },
  about: {
    heading: 'One kitchen, one pair of hands',
    body: 'Jana bakes from home in Uithoorn. There is no shop and no counter, which is why everything starts with a message rather than a basket.\n\nIt also means she can say yes to the things a bakery would turn down, and no when the week is already full.',
    linkLabel: 'Meet Jana',
  },
  allergens: {
    heading: 'About allergies',
    intro: 'Every cake lists what it contains.',
  },
  quote: {
    text: 'I asked on the Tuesday for the Saturday and she still said yes. The cake was gone before the coffee was poured.',
    attribution: 'A customer in Uithoorn',
  },
  faq: {
    heading: 'Before you ask',
    questions: [
      {
        question: 'How far ahead do I need to ask?',
        answer:
          'At least the notice shown above. Saturdays and December fill much sooner than that, so earlier is safer.',
      },
      {
        question: 'Where do I collect it?',
        answer:
          'From Jana’s home in Uithoorn. The exact address is sent once the day and time are agreed.',
      },
      {
        question: 'Can I send a photo of what I have in mind?',
        answer:
          'Yes — attach it to your enquiry. Jana will say what she can do with it and what it would cost.',
      },
      {
        question: 'Is the estimate the price?',
        answer:
          'No. It covers size, quantity and fillings. Anything written, coloured or themed is priced by Jana when she replies.',
      },
    ],
  },
  closing: {
    heading: 'Tell Jana what the day is for',
    body: 'Pick a cake and you will see roughly what it costs as you fill the form in. Nothing is booked until Jana replies.',
  },
}

const NL: Copy = {
  hero: {
    headline: 'Thuis gebakken in Uithoorn',
    intro: 'Eén taart tegelijk, gebakken voor de dag dat je hem nodig hebt.',
    cakesLabel: 'Bekijk de taarten',
    nibblesLabel: 'of de lekkernijen',
  },
  facts: {
    pickupTitle: 'Ophalen in Uithoorn',
    pickupDetail: 'Het adres volgt zodra je dag is bevestigd.',
  },
  menu: { heading: 'Het menu' },
  about: {
    heading: 'Eén keuken, één paar handen',
    body: 'Jana bakt thuis in Uithoorn. Er is geen winkel en geen toonbank, en daarom begint alles met een bericht in plaats van een winkelmandje.\n\nHet betekent ook dat ze ja kan zeggen tegen wat een bakkerij zou weigeren, en nee als de week al vol is.',
    linkLabel: 'Maak kennis met Jana',
  },
  allergens: {
    heading: 'Over allergieën',
    intro: 'Bij elke taart staat wat erin zit.',
  },
  quote: {
    text: 'Ik vroeg het op dinsdag voor zaterdag en ze zei toch ja. De taart was op voordat de koffie was ingeschonken.',
    attribution: 'Een klant uit Uithoorn',
  },
  faq: {
    heading: 'Voordat je het vraagt',
    questions: [
      {
        question: 'Hoe ver van tevoren moet ik het vragen?',
        answer:
          'Minstens de termijn die hierboven staat. Zaterdagen en december zijn veel eerder vol, dus eerder is beter.',
      },
      {
        question: 'Waar haal ik het op?',
        answer:
          'Bij Jana thuis in Uithoorn. Het precieze adres volgt zodra de dag en tijd zijn afgesproken.',
      },
      {
        question: 'Kan ik een foto sturen van wat ik in gedachten heb?',
        answer:
          'Ja, stuur hem mee met je bericht. Jana laat weten wat ze ermee kan en wat het zou kosten.',
      },
      {
        question: 'Is de schatting de prijs?',
        answer:
          'Nee. Die rekent met grootte, aantal en vullingen. Tekst, kleuren of een thema prijst Jana als ze antwoordt.',
      },
    ],
  },
  closing: {
    heading: 'Vertel Jana waar de dag om draait',
    body: 'Kies een taart en je ziet tijdens het invullen ongeveer wat hij kost. Er ligt pas iets vast als Jana antwoordt.',
  },
}

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const home: Home = await payload.updateGlobal({
    slug: 'home',
    locale: 'en',
    req,
    data: { ...EN, _status: 'published' },
  })

  await payload.updateGlobal({
    slug: 'home',
    locale: 'nl',
    req,
    data: {
      ...NL,
      _status: 'published',
      faq: {
        heading: NL.faq.heading,
        questions: NL.faq.questions.map((row, index) => ({
          ...row,
          id: home.faq.questions[index]?.id ?? null,
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
