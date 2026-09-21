# Page inventory and the CMS ownership boundary

Status: accepted (2026-09-21)

The site launches with **nine coded routes per locale** plus an open-ended collection of
CMS-authored marketing pages. The catalogue splits in two — configurable cakes and fixed-price
nibbles — because they are bought differently. The Enquiry stays welded to the Item it prices, with
two additional, Estimate-free forms for the intents an Item page cannot serve.

The ownership rule: **pages that carry the conversion path or the structured data are coded routes
with CMS-editable content; everything else is a layout-builder page Jana assembles herself.** This
is a deliberate deviation from Payload's documented recommendation, and the reasoning is recorded
below so a future session does not "correct" it.

## The inventory

| Page | English | Dutch | Owner |
| --- | --- | --- | --- |
| Home | `/` | `/nl` | coded route, CMS fields |
| Cakes | `/cakes` | `/nl/taarten` | coded route, CMS fields |
| Nibbles | `/nibbles` | `/nl/lekkernijen` | coded route, CMS fields |
| Item (cake) | `/cakes/<slug>` | `/nl/taarten/<slug>` | generated from Items |
| Item (nibble) | `/nibbles/<slug>` | `/nl/lekkernijen/<slug>` | generated from Items |
| Custom order | `/custom-order` | `/nl/maatwerk` | coded route, CMS fields |
| About | `/about` | `/nl/over-jana` | coded route, CMS fields |
| Contact | `/contact` | `/nl/contact` | coded route, CMS fields |
| Privacy | `/privacy` | `/nl/privacy` | CMS rich text |
| Marketing pages | `/<slug>` | `/nl/<slug>` | layout builder, Jana |

`lekkernijen` and `over-jana` are provisional; Jana has final say on Dutch wording. The page name and
the Category name need not match.

Marketing pages sit at the bare root because that is where they rank. The catch-all resolves a
single unmatched segment against the Pages collection, which means **the coded segments above are
reserved slugs** and Payload must reject them at validation time rather than producing a page that
is shadowed by a route and silently unreachable.

## Why the catalogue splits in two

A cake is a conversation; a box of brownies is a quantity. Proefhapjes, Bento, Indulgent and
Specialty are cake-shaped and Configurable; Nibbles is fixed. `cakesbycaro.com` — the closest
comparable, also Amsterdam, also pickup-only — makes exactly this split, with a configurator for
cakes and a flat `/treats` page for brownies and cupcakes.

The split is **not** Category. It is one level above it, modelled as a property *on* Category so
that adding a sixth Category later is a content change rather than a code change.

Item URLs nest under their catalogue page. The cost is that moving an Item between the two changes
its URL and needs a redirect; this was accepted because it is rare, and because the alternatives
(everything under `/cakes/`, which lies about nibbles; or a neutral prefix, which reads worse) are
permanent costs paid to avoid an occasional one.

## Why Category pages do not ship

Five Categories could be five URLs. Two of them — Bento above all — are terms a customer plausibly
searches. "Proefhapjes" and "Nibbles" are Jana's internal ladder, not search language. Shipping all
five means three thin pages on a domain with no authority, which is the same trade ADR-0002 already
refused for untranslated cakes.

So: one `/cakes` page with the four cake Categories as anchored sections. Search Console will show
within a quarter which Category terms draw impressions, and promoting a section to its own page then
is cheap. Retiring three thin pages is not.

## Why the Enquiry stays on the Item page

`cakesbycaro.com` puts its configurator on the homepage and treats `/custom-order` as its final
step. That works for her because reviews and Instagram drive direct traffic to the root.

ThuisBakery has neither, and SEO is this map's stated top priority — so Item pages have to be the
destinations, not a step on the way to one. Issue #11's per-Item Enquiry with its running Estimate
stands unchanged.

Three forms, one Payload collection, distinguished by an enquiry-type field:

- **Item page** — Enquiry with Estimate, scoped to that Item's Sizes. The commercial path.
- **`/custom-order`** — no Estimate, no Item. "Tell me what you're imagining." The bespoke path.
- **`/contact`** — no Estimate, no Item. General questions.

The second and third are genuinely different intents and were kept apart on that basis. If the
form count ever has to come down, merge `/custom-order` into `/contact`; do not weaken the per-Item
form.

## Why About and Contact are two pages

This was initially recommended as one page, on the grounds that a Contact page with no printed
address (ADR-0002) and no retail opening hours is thin. `cakesbycaro.com/contact` disproves it: form,
email, Instagram, opening hours, collection policy and a four-item FAQ is a substantial page, and it
is the natural home for the visibly-rendered `Bakery` values that ADR-0002 requires.

Contact carries the `Bakery` markup and the FAQ. About carries Jana's story and photograph.

## Why the CMS boundary sits where it does

Payload's documented recommendation is the full layout builder. The blocks documentation calls
blocks "perfect for... a page builder", and the official website template ships a `Pages` collection
in which every page is assembled from Hero / Content / Media / CallToAction / Archive blocks. There
is no documented caveat against it.

That template is built for agencies shipping sites whose content is unknown at design time. This
site's content is known, and the pages handed to the builder would be precisely the ones carrying
`Product`/`offers` markup, reciprocal hreflang pairs and the conversion path. Two consequences
decided it:

1. An editor can assemble a page with no `H1`, three heroes, or a broken hreflang pair. On the
   catalogue and Item pages that is a commercial defect, not a cosmetic one.
2. The design direction (issue #13) would have to hold up across every permutation an editor might
   assemble, rather than across nine known layouts. That is a materially larger design job bought
   in exchange for flexibility on pages nobody wants flexed.

So the builder gets a sandbox rather than the house. Inside that sandbox it is used *fully* — the
template's block set, unmodified — so Jana gets the documented Payload experience where the blast
radius is one marketing page.

This also settles Occasion pages. They were previously going to be either hand-coded (two at launch)
or generated per tag (rejected as thin-page manufacturing). They are now simply marketing pages,
written by Jana when she has something to say — which is the filter that stops them being thin in
the first place.

## Initial CMS configuration

What must exist in Payload before content entry begins:

- **Globals.** `Header` and `Footer`, localized. Payload names globals "the primary way to structure
  singletons in Payload, such as a header navigation", so the nav is seeded configuration, not code.
  `Header` seeds with four links — Cakes, Nibbles, About, Contact — plus a Custom order call to
  action. `Footer` seeds with every page in the inventory.
- **`Pages` collection.** The website template's block set, draft + autosave enabled for Live
  Preview, `slug` localized, reserved-slug validation against the coded segments.
- **Page-content singletons** for the coded routes, holding their editable fields: home hero and
  featured Items, catalogue intros, About body, Contact details and FAQ, Custom order intro,
  Privacy body.
- **`localization`**: `locales: ['en', 'nl']`, `defaultLocale: 'en'`, `fallback: true` — with
  per-document emptiness detected via `fallbackLocale: 'none'`, per ADR-0002.

Admin UI language is Payload's separate `i18n` config, not `localization`. Which language Jana's
admin runs in is issue #10's decision, not this one.

## Navigation

Four nav links — Cakes, Nibbles, About, Contact — plus **Custom order as a button**, because it is a
conversion path rather than a section. The language switcher sits adjacent, labelled in the target
language, and visually prominent as ADR-0002 requires: the default landing locale is English while
the primary customer is Dutch, so the switcher is load-bearing here in a way it would not otherwise
be.

Marketing and Occasion pages stay **out** of the nav. They are search landing pages, reached from
Google and from in-page links. Putting them in the nav is how a five-item menu becomes eleven.

## Internal linking

One of the few SEO levers a new site fully controls, so it is specified rather than left to build
time.

- Home → `/cakes` (primary call to action) and `/nibbles`
- `/cakes` → every cake Item; `/nibbles` → every nibble Item
- Item → its Category section, two or three sibling Items, and `/custom-order`
- Occasion page → its tagged Items; **each tagged Item links back to the Occasion page**
- About → `/cakes`; Contact → `/custom-order`
- Footer → every page, in both locales' own terms

Every page ends at an Enquiry, but the *proximate* call to action differs: home sends you to the
catalogue, the catalogue to an Item, the Item to its form.

The Item → Occasion backlink is the one most likely to be forgotten, and without it Occasion pages
are orphans. It is recorded here for that reason.

Derived links (Item → siblings, Item → Occasion) are computed in code from Item data. Editorial
links (featured Items on home, body links inside marketing pages) are CMS. Neither is a nav global.

## Analytics and legal pages

**Vercel Web Analytics**, enabled at launch. Pro includes no free event allowance — Hobby's 50,000
does not carry over — but events are $0.03 per 1,000 against Pro's $20 usage credit, so bakery
traffic costs cents.

It sets **no cookies**: Vercel's privacy documentation states visitors are identified by "a hash
created from the incoming request", discarded after 24 hours, with no cross-site identifier.

Therefore: **a privacy policy, and no consent banner.** No terms of service — the site takes no
money and forms no contract; Jana's reply is what makes an Enquiry real. This makes "ship no
non-essential cookies" a standing constraint rather than a happy accident: anything added later that
sets one re-opens the banner question and costs a conversion step on a site whose entire job is one
form.

Google Analytics 4 was rejected on exactly that basis, not on capability.
