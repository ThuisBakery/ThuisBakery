import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import fs from 'fs'
import path from 'path'
import type { Payload, PayloadRequest } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

/**
 * Seeds Jana's real menu — her five Categories, the Items on her printed card, the Sponges and
 * Fillings — together with stock photographs in every photograph slot, so the whole site can be
 * seen before her own photographs exist. A migration for the same reason the other seeds are:
 * it runs once per database, in the deploy pipeline, where the Blob token is (ADR-0005). After
 * this, all of it is Jana's to edit.
 *
 * What is Jana's and what is a stand-in:
 *
 * - **From her menu card:** the Category names, taglines, notes and prices; every Item and
 *   its price; the Sponges and Fillings, and Ganache's €3 Surcharge.
 * - **Stand-ins to correct:** every photograph (CC0 stock, in the Media folder "Placeholder
 *   photos", credited in `placeholder-photos/CREDITS.md`); the Allergens and their icons; the
 *   Item descriptions beyond her card's own lines; the Indulgent cake's second Size and its
 *   €72; Bento's diameter and servings; the Occasions; the sample Birthday page; and the
 *   cross-contamination statement.
 *
 * Lead time is not seeded: until Jana saves it, Payload reads its own defaults (3 days, 17:00).
 *
 * Contact's email, phone and hours stay unseeded, as the About/Contact seed decided: a guessed
 * detail printed and marked up for Google is worse than none.
 *
 * If the catalogue already has a Category, it is left alone: someone has started on it.
 */

const dirname = path.dirname(fileURLToPath(import.meta.url))

type Ctx = { payload: Payload; req: PayloadRequest }

// Saved outside a Next request, where there is no cache to mark (`src/hooks/revalidateSite.ts`).
const context = { disableRevalidate: true }

// ---------------------------------------------------------------------------------------------
// Rich text: Lexical's stored JSON, text only.

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

const heading = (tag: 'h1' | 'h2', value: string) => ({
  ...block,
  type: 'heading',
  tag,
  children: [text(value)],
})

const richText = (...children: Record<string, unknown>[]) => ({
  root: { ...block, type: 'root', children },
})

const paragraphs = (value: string) => richText(...value.split('\n\n').map(p))

// ---------------------------------------------------------------------------------------------
// Media

const PHOTOS = {
  'home-hero': 'Placeholder: a layered cake on a cake stand',
  'home-about': 'Placeholder: hands kneading dough',
  about: 'Placeholder: shaping cookie dough by hand',
  contact: 'Placeholder: a rolling pin on a floured table',
  'custom-order': 'Placeholder: a tiered celebration cake with berries',
  proefhapjes: 'Placeholder: small chocolate cakes topped with strawberries',
  'proefhapjes-2': 'Placeholder: cupcakes with sprinkles',
  bento: 'Placeholder: piping cream onto a small cake',
  'bento-2': 'Placeholder: a birthday cake with a number candle',
  indulgent: 'Placeholder: a strawberry layer cake',
  'indulgent-2': 'Placeholder: a slice of chocolate layer cake',
  basque: 'Placeholder: a burnt basque cheesecake',
  'basque-2': 'Placeholder: a burnt basque cheesecake, cut',
  carrot: 'Placeholder: a slice of carrot cake',
  'carrot-2': 'Placeholder: carrot cake with cream cheese filling',
  'cookies-and-cream': 'Placeholder: cookies on a board',
  'chocolate-chip': 'Placeholder: a stack of chocolate chip cookies',
  brownies: 'Placeholder: chocolate brownies',
  'birthday-hero': 'Placeholder: a pink birthday cake with candles',
  'birthday-sprinkles': 'Placeholder: sprinkle cake slices at a party',
} as const

type PhotoKey = keyof typeof PHOTOS

const uploadPhotos = async (
  { payload, req }: Ctx,
  folder: number,
): Promise<Record<PhotoKey, number>> => {
  const ids = {} as Record<PhotoKey, number>

  for (const [key, alt] of Object.entries(PHOTOS) as [PhotoKey, string][]) {
    const data = fs.readFileSync(path.resolve(dirname, 'placeholder-photos', `${key}.jpg`))
    const media = await payload.create({
      collection: 'media',
      data: { alt, folder },
      file: { data, mimetype: 'image/jpeg', name: `placeholder-${key}.jpg`, size: data.length },
      req,
      context,
    })

    ids[key] = media.id
  }

  return ids
}

/** A plain placeholder icon: the Allergen's initial in a ring, in the site's ink colour. */
const allergenIcon = async (initial: string): Promise<Buffer> =>
  sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="44" fill="none" stroke="#4a3a33" stroke-width="5"/>
        <text x="48" y="63" text-anchor="middle" font-family="Georgia, serif" font-size="44" fill="#4a3a33">${initial}</text>
      </svg>`,
    ),
  )
    .png()
    .toBuffer()

// ---------------------------------------------------------------------------------------------
// The shared lists

type Pair = { en: string; nl: string }

const SPONGES: Pair[] = [
  { en: 'Chocolate', nl: 'Chocolade' },
  { en: 'Vanilla', nl: 'Vanille' },
  { en: 'Funfetti', nl: 'Funfetti' },
  { en: 'Red Velvet', nl: 'Red Velvet' },
]

const FILLINGS: (Pair & { surcharge?: number })[] = [
  { en: 'Vanilla', nl: 'Vanille' },
  { en: 'Chocolate', nl: 'Chocolade' },
  { en: 'Cookies & Cream', nl: 'Cookies & Cream' },
  { en: 'Cream Cheese', nl: 'Roomkaas' },
  { en: 'English Toffee', nl: 'Engelse toffee' },
  { en: 'Salted Caramel', nl: 'Gezouten karamel' },
  { en: 'Ganache', nl: 'Ganache', surcharge: 3 },
]

const ALLERGENS = {
  gluten: { en: 'Gluten (wheat)', nl: 'Gluten (tarwe)', initial: 'G' },
  egg: { en: 'Egg', nl: 'Ei', initial: 'E' },
  milk: { en: 'Milk', nl: 'Melk', initial: 'M' },
  soy: { en: 'Soy', nl: 'Soja', initial: 'S' },
  nuts: { en: 'Tree nuts', nl: 'Noten', initial: 'N' },
} as const

type AllergenKey = keyof typeof ALLERGENS

const OCCASIONS = {
  birthday: { en: 'Birthday', nl: 'Verjaardag' },
  babyShower: { en: 'Baby shower', nl: 'Babyshower' },
  justBecause: { en: 'Just because', nl: 'Zomaar' },
} as const

type OccasionKey = keyof typeof OCCASIONS

/** Creates each row in English, then writes its Dutch name onto it. */
const createNamed = async <K extends string>(
  { payload, req }: Ctx,
  collection: 'sponges' | 'fillings' | 'occasions',
  rows: Record<K, Pair & { surcharge?: number }>,
): Promise<Record<K, number>> => {
  const ids = {} as Record<K, number>

  for (const [key, row] of Object.entries(rows) as [K, Pair & { surcharge?: number }][]) {
    const data =
      collection === 'fillings' ? { name: row.en, surcharge: row.surcharge ?? null } : { name: row.en }
    const doc = await payload.create({ collection, locale: 'en', data, req, context })

    await payload.update({ collection, id: doc.id, locale: 'nl', data: { name: row.nl }, req, context })
    ids[key] = doc.id
  }

  return ids
}

// ---------------------------------------------------------------------------------------------
// Categories, from the card

type CategoryKey = 'proefhapjes' | 'bento' | 'indulgent' | 'specialty' | 'nibbles'

const CATEGORIES: {
  key: CategoryKey
  slug: string
  catalogue: 'cakes' | 'nibbles'
  photo: PhotoKey
  price?: number
  priceFrom?: boolean
  name: Pair
  tagline: Pair
  note?: Pair
}[] = [
  {
    key: 'proefhapjes',
    slug: 'proefhapjes',
    catalogue: 'cakes',
    photo: 'proefhapjes',
    price: 29,
    name: { en: 'Proefhapjes', nl: 'Proefhapjes' },
    tagline: { en: 'Monthly Limited Editions', nl: 'Maandelijkse limited editions' },
    note: {
      en: 'a little taste of what’s baking at Thuis',
      nl: 'een klein voorproefje van wat er bij Thuis gebakken wordt',
    },
  },
  {
    key: 'bento',
    slug: 'bento',
    catalogue: 'cakes',
    photo: 'bento',
    price: 25,
    priceFrom: true,
    name: { en: 'Cheeky Bento Cakes', nl: 'Cheeky Bento Cakes' },
    tagline: { en: 'Mini Cakes for Big Moments', nl: 'Kleine taartjes voor grote momenten' },
    note: {
      en: 'personalisation available on request',
      nl: 'personalisatie mogelijk op aanvraag',
    },
  },
  {
    key: 'indulgent',
    slug: 'indulgent',
    catalogue: 'cakes',
    photo: 'indulgent',
    price: 52,
    priceFrom: true,
    name: { en: 'Indulgent Cakes', nl: 'Indulgent Cakes' },
    tagline: {
      en: 'For life’s sweetest moments, or simply just because.',
      nl: 'Voor de zoetste momenten van het leven, of gewoon zomaar.',
    },
  },
  {
    key: 'specialty',
    slug: 'specialty',
    catalogue: 'cakes',
    photo: 'basque',
    name: { en: 'Specialty Cakes', nl: 'Specialty Cakes' },
    tagline: { en: 'Two favourites, baked the one way', nl: 'Twee favorieten, op één manier gebakken' },
  },
  {
    key: 'nibbles',
    slug: 'nibbles',
    catalogue: 'nibbles',
    photo: 'cookies-and-cream',
    name: { en: 'Nibbles', nl: 'Lekkernijen' },
    tagline: { en: 'Cookies and brownies, by the half dozen', nl: 'Koekjes en brownies, per zes' },
  },
]

// ---------------------------------------------------------------------------------------------
// Items, from the card

type Size = {
  label: Pair
  price: number
  diameter?: number
  layers?: number
  servings?: number
}

type ItemSeed = {
  category: CategoryKey
  title: Pair
  slug: Pair
  description: Pair
  photos: PhotoKey[]
  configurable?: boolean
  sizes: Size[]
  allergens: AllergenKey[]
  occasions?: OccasionKey[]
}

const CAKE_ALLERGENS: AllergenKey[] = ['gluten', 'egg', 'milk']

const ITEMS: ItemSeed[] = [
  {
    category: 'proefhapjes',
    title: { en: 'This month’s Proefhapjes', nl: 'Proefhapjes van deze maand' },
    slug: { en: 'proefhapjes-box', nl: 'proefhapjes-doos' },
    description: {
      en: 'A little taste of what’s baking at Thuis: a box of small bakes that changes every month, and is gone when it is gone.\n\nWhat is in this month’s box is written here when the month begins.',
      nl: 'Een klein voorproefje van wat er bij Thuis gebakken wordt: een doos kleine baksels die elke maand anders is, en op is als het op is.\n\nWat er deze maand in de doos zit, staat hier zodra de maand begint.',
    },
    photos: ['proefhapjes', 'proefhapjes-2'],
    sizes: [{ label: { en: 'One box', nl: 'Eén doos' }, price: 29 }],
    allergens: CAKE_ALLERGENS,
    occasions: ['justBecause'],
  },
  {
    category: 'bento',
    title: { en: 'Cheeky Bento Cake', nl: 'Cheeky Bento Cake' },
    slug: { en: 'cheeky-bento-cake', nl: 'cheeky-bento-taart' },
    description: {
      en: 'A mini cake for a big moment — just enough for two, in its own little box.\n\nChoose the sponge and the filling. A name, a message or a doodle on top is available on request; write it in your special requests.',
      nl: 'Een klein taartje voor een groot moment — precies genoeg voor twee, in een eigen doosje.\n\nKies de biscuit en de vulling. Een naam, tekst of tekening erop kan op aanvraag; zet het bij je wensen.',
    },
    photos: ['bento', 'bento-2'],
    configurable: true,
    sizes: [
      { label: { en: 'Bento', nl: 'Bento' }, price: 25, diameter: 10, layers: 2, servings: 2 },
    ],
    allergens: CAKE_ALLERGENS,
    occasions: ['birthday', 'babyShower'],
  },
  {
    category: 'indulgent',
    title: { en: 'Indulgent Layer Cake', nl: 'Indulgent laagjestaart' },
    slug: { en: 'indulgent-layer-cake', nl: 'indulgent-laagjestaart' },
    description: {
      en: 'For life’s sweetest moments, or simply just because. Tall layers of sponge and filling, finished by hand.\n\nChoose the sponge and the filling; ganache adds €3.',
      nl: 'Voor de zoetste momenten van het leven, of gewoon zomaar. Hoge lagen biscuit en vulling, met de hand afgewerkt.\n\nKies de biscuit en de vulling; ganache kost €3 extra.',
    },
    photos: ['indulgent', 'indulgent-2'],
    configurable: true,
    sizes: [
      { label: { en: '15 cm', nl: '15 cm' }, price: 52, diameter: 15, layers: 3, servings: 10 },
      { label: { en: '20 cm', nl: '20 cm' }, price: 72, diameter: 20, layers: 3, servings: 20 },
    ],
    allergens: CAKE_ALLERGENS,
    occasions: ['birthday', 'justBecause'],
  },
  {
    category: 'specialty',
    title: { en: 'Burnt Basque Cheesecake', nl: 'Burnt Basque Cheesecake' },
    slug: { en: 'burnt-basque-cheesecake', nl: 'burnt-basque-cheesecake' },
    description: {
      en: 'Dark and caramelised outside, soft and creamy in the middle. Baked hot and fast, the way it is made in San Sebastián.',
      nl: 'Donker en gekaramelliseerd aan de buitenkant, zacht en romig van binnen. Heet en snel gebakken, zoals in San Sebastián.',
    },
    photos: ['basque', 'basque-2'],
    sizes: [{ label: { en: 'Whole cheesecake', nl: 'Hele cheesecake' }, price: 56 }],
    allergens: CAKE_ALLERGENS,
  },
  {
    category: 'specialty',
    title: { en: 'Carrot Cake', nl: 'Carrot Cake' },
    slug: { en: 'carrot-cake', nl: 'worteltaart' },
    description: {
      en: 'Spiced, moist and full of carrot, layered with cream cheese.',
      nl: 'Gekruid, smeuïg en vol wortel, met lagen roomkaas.',
    },
    photos: ['carrot', 'carrot-2'],
    sizes: [{ label: { en: 'Whole cake', nl: 'Hele taart' }, price: 49 }],
    allergens: [...CAKE_ALLERGENS, 'nuts'],
    occasions: ['birthday'],
  },
  {
    category: 'nibbles',
    title: { en: 'Chocolate Chip Cookies', nl: 'Chocolate chip cookies' },
    slug: { en: 'chocolate-chip-cookies', nl: 'chocolate-chip-koekjes' },
    description: {
      en: 'A chewy browned butter based cookie dough, packed with chocolate.',
      nl: 'Taai koekjesdeeg op basis van bruine boter, vol chocolade.',
    },
    photos: ['chocolate-chip'],
    sizes: [{ label: { en: '6 large cookies', nl: '6 grote koekjes' }, price: 10.5 }],
    allergens: [...CAKE_ALLERGENS, 'soy'],
  },
  {
    category: 'nibbles',
    title: { en: 'Cookies & Cream Cookies', nl: 'Cookies & Cream koekjes' },
    slug: { en: 'cookies-and-cream-cookies', nl: 'cookies-and-cream-koekjes' },
    description: {
      en: 'A chewy browned butter based cookie dough, with crushed chocolate biscuits and white chocolate.',
      nl: 'Taai koekjesdeeg op basis van bruine boter, met verkruimelde chocoladekoekjes en witte chocolade.',
    },
    photos: ['cookies-and-cream'],
    sizes: [{ label: { en: '6 large cookies', nl: '6 grote koekjes' }, price: 10.5 }],
    allergens: [...CAKE_ALLERGENS, 'soy'],
  },
  {
    category: 'nibbles',
    title: { en: 'Brownies', nl: 'Brownies' },
    slug: { en: 'brownies', nl: 'brownies' },
    description: {
      en: 'Fudgy brownies that stick to the roof of your mouth.',
      nl: 'Smeuïge brownies die aan je gehemelte blijven plakken.',
    },
    photos: ['brownies'],
    sizes: [{ label: { en: '6 large brownies', nl: '6 grote brownies' }, price: 12 }],
    allergens: [...CAKE_ALLERGENS, 'soy'],
  },
]

// ---------------------------------------------------------------------------------------------
// The sample Occasion page

const birthdayPage = (locale: 'en' | 'nl', photos: Record<PhotoKey, number>) => {
  const en = locale === 'en'

  return {
    title: en ? 'Birthday cakes' : 'Verjaardagstaarten',
    slug: en ? 'birthday-cakes' : 'verjaardagstaarten',
    hero: {
      type: 'highImpact' as const,
      richText: richText(
        heading('h1', en ? 'Birthday cakes' : 'Verjaardagstaarten'),
        p(
          en
            ? 'A sample page, to show what a page of your own looks like. Change the words, swap the photographs, or delete it.'
            : 'Een voorbeeldpagina, om te laten zien hoe een eigen pagina eruitziet. Pas de tekst aan, vervang de foto’s, of verwijder hem.',
        ),
      ),
      links: [],
      media: photos['birthday-hero'],
    },
    layout: [
      {
        blockType: 'content' as const,
        columns: [
          {
            size: 'half' as const,
            richText: richText(
              heading('h2', en ? 'Small, for two' : 'Klein, voor twee'),
              p(
                en
                  ? 'A Cheeky Bento Cake says happy birthday without needing a party. Add a name or a message on top.'
                  : 'Een Cheeky Bento Cake zegt gefeliciteerd zonder dat er een feest voor nodig is. Zet er een naam of tekst op.',
              ),
            ),
          },
          {
            size: 'half' as const,
            richText: richText(
              heading('h2', en ? 'Tall, for everyone' : 'Hoog, voor iedereen'),
              p(
                en
                  ? 'An Indulgent Cake feeds the whole table. Pick the sponge and the filling, and tell Jana what the day is for.'
                  : 'Een Indulgent Cake is genoeg voor de hele tafel. Kies de biscuit en de vulling, en vertel Jana waar de dag om draait.',
              ),
            ),
          },
        ],
      },
      { blockType: 'mediaBlock' as const, media: photos['birthday-sprinkles'] },
      {
        blockType: 'cta' as const,
        richText: richText(
          heading('h2', en ? 'Something else in mind?' : 'Iets anders in gedachten?'),
          p(
            en
              ? 'Send a photo of what you are imagining, and Jana will say what she can do.'
              : 'Stuur een foto van wat je voor ogen hebt, en Jana laat weten wat ze kan maken.',
          ),
        ),
        links: [
          {
            link: {
              type: 'custom' as const,
              url: en ? '/custom-order' : '/nl/maatwerk',
              label: en ? 'Ask for a custom cake' : 'Vraag een taart op maat',
              appearance: 'default' as const,
            },
          },
        ],
      },
    ],
  }
}

// ---------------------------------------------------------------------------------------------

const seedCatalogue = async (ctx: Ctx, photos: Record<PhotoKey, number>, folder: number) => {
  const { payload, req } = ctx

  // Items leave their Sponges and Fillings empty, which offers every one.
  await createNamed(ctx, 'sponges', Object.fromEntries(SPONGES.map((row) => [row.en, row])))
  await createNamed(
    ctx,
    'fillings',
    Object.fromEntries(FILLINGS.map((row) => [row.en, row])),
  )
  const occasions = await createNamed(ctx, 'occasions', OCCASIONS)

  const allergens = {} as Record<AllergenKey, number>

  for (const [key, row] of Object.entries(ALLERGENS) as [AllergenKey, (typeof ALLERGENS)[AllergenKey]][]) {
    const data = await allergenIcon(row.initial)
    const icon = await payload.create({
      collection: 'media',
      data: { alt: '', folder },
      file: { data, mimetype: 'image/png', name: `placeholder-allergen-${key}.png`, size: data.length },
      req,
      context,
    })
    const doc = await payload.create({
      collection: 'allergens',
      locale: 'en',
      data: { name: row.en, icon: icon.id },
      req,
      context,
    })

    await payload.update({ collection: 'allergens', id: doc.id, locale: 'nl', data: { name: row.nl }, req, context })
    allergens[key] = doc.id
  }

  const categories = {} as Record<CategoryKey, number>

  for (const [order, row] of CATEGORIES.entries()) {
    const doc = await payload.create({
      collection: 'categories',
      locale: 'en',
      data: {
        name: row.name.en,
        slug: row.slug,
        tagline: row.tagline.en,
        note: row.note?.en ?? null,
        photograph: photos[row.photo],
        price: row.price ?? null,
        priceFrom: row.priceFrom ?? false,
        catalogue: row.catalogue,
        order: order + 1,
      },
      req,
      context,
    })

    await payload.update({
      collection: 'categories',
      id: doc.id,
      locale: 'nl',
      data: { name: row.name.nl, tagline: row.tagline.nl, note: row.note?.nl ?? null },
      req,
      context,
    })
    categories[row.key] = doc.id
  }

  for (const item of ITEMS) {
    const shared = {
      _status: 'published' as const,
      category: categories[item.category],
      photographs: item.photos.map((key) => photos[key]),
      configurable: item.configurable ?? false,
      allergens: item.allergens.map((key) => allergens[key]),
      occasions: (item.occasions ?? []).map((key) => occasions[key]),
    }
    const sizes = (locale: 'en' | 'nl', ids: (string | null | undefined)[] = []) =>
      item.sizes.map((size, index) => ({
        id: ids[index] ?? null,
        label: size.label[locale],
        price: size.price,
        diameter: size.diameter ?? null,
        layers: size.layers ?? null,
        servings: size.servings ?? null,
      }))

    const doc = await payload.create({
      collection: 'items',
      locale: 'en',
      draft: false,
      data: {
        ...shared,
        title: item.title.en,
        slug: item.slug.en,
        description: paragraphs(item.description.en),
        sizes: sizes('en').map(({ id: _id, ...size }) => size),
      },
      req,
      context,
    })

    await payload.update({
      collection: 'items',
      id: doc.id,
      locale: 'nl',
      draft: false,
      data: {
        _status: 'published',
        title: item.title.nl,
        slug: item.slug.nl,
        description: paragraphs(item.description.nl),
        sizes: sizes('nl', doc.sizes.map((size) => size.id)),
      },
      req,
      context,
    })
  }

  const page = await payload.create({
    collection: 'pages',
    locale: 'en',
    draft: false,
    data: { _status: 'published', occasion: occasions.birthday, ...birthdayPage('en', photos) },
    req,
    context,
  })

  await payload.update({
    collection: 'pages',
    id: page.id,
    locale: 'nl',
    draft: false,
    data: { _status: 'published', ...birthdayPage('nl', photos) },
    req,
    context,
  })

  payload.logger.info(`Seeded ${ITEMS.length} Items in ${CATEGORIES.length} Categories.`)
}

/** Photographs into the page-content globals' empty slots; their words are left as they are. */
const seedGlobalPhotographs = async ({ payload, req }: Ctx, photos: Record<PhotoKey, number>) => {
  const home = await payload.findGlobal({ slug: 'home', locale: 'en', depth: 0, req })

  if (home.hero && home.about) {
    await payload.updateGlobal({
      slug: 'home',
      locale: 'en',
      req,
      context,
      data: {
        _status: 'published',
        hero: { ...home.hero, photograph: home.hero.photograph ?? photos['home-hero'] },
        about: { ...home.about, photograph: home.about.photograph ?? photos['home-about'] },
      },
    })
  }

  const about = await payload.findGlobal({ slug: 'about', locale: 'en', depth: 0, req })

  if (about.heading && !about.photograph) {
    await payload.updateGlobal({
      slug: 'about',
      locale: 'en',
      req,
      context,
      data: { _status: 'published', photograph: photos.about },
    })
  }

  const customOrder = await payload.findGlobal({ slug: 'custom-order', locale: 'en', depth: 0, req })

  if (customOrder.heading && !customOrder.photograph) {
    await payload.updateGlobal({
      slug: 'custom-order',
      locale: 'en',
      req,
      context,
      data: { _status: 'published', photograph: photos['custom-order'] },
    })
  }

  const contact = await payload.findGlobal({ slug: 'contact', locale: 'en', depth: 0, req })

  if (contact.heading && !contact.details?.photograph) {
    await payload.updateGlobal({
      slug: 'contact',
      locale: 'en',
      req,
      context,
      data: {
        _status: 'published',
        details: { ...contact.details, photograph: photos.contact },
      },
    })
  }
}

/** The cross-contamination statement every Allergen list sits beside, when nobody has set it yet. */
const seedStatement = async ({ payload, req }: Ctx) => {
  const statement = await payload.findGlobal({
    slug: 'cross-contamination',
    locale: 'en',
    fallbackLocale: false,
    depth: 0,
    req,
  })

  if (!statement.statement) {
    await payload.updateGlobal({
      slug: 'cross-contamination',
      locale: 'en',
      req,
      context,
      data: {
        _status: 'published',
        statement:
          'Everything is baked in a home kitchen where gluten, egg, milk, soy and nuts are all used, so traces of any of them cannot be ruled out.',
      },
    })
    await payload.updateGlobal({
      slug: 'cross-contamination',
      locale: 'nl',
      req,
      context,
      data: {
        _status: 'published',
        statement:
          'Alles wordt gebakken in een thuiskeuken waar gluten, ei, melk, soja en noten worden gebruikt, dus sporen daarvan zijn niet uit te sluiten.',
      },
    })
  }
}

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const ctx = { payload, req }
  const { totalDocs: existing } = await payload.count({ collection: 'categories', req })

  if (existing > 0) {
    payload.logger.info('The catalogue already has Categories; placeholder seed skipped.')
    return
  }

  const folder = await payload.create({
    collection: 'payload-folders',
    data: { name: 'Placeholder photos', folderType: ['media'] },
    req,
    context,
  })
  const photos = await uploadPhotos(ctx, folder.id)

  await seedCatalogue(ctx, photos, folder.id)
  await seedGlobalPhotographs(ctx, photos)
  await seedStatement(ctx)
}

/**
 * Nothing to undo on its own. Once seeded, the content is Jana's; rolling this back must not
 * erase her edits. The placeholder photographs are removed by deleting the folder they are in.
 */
export async function down(_args: MigrateDownArgs): Promise<void> {}
