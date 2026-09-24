# Design direction

Status: accepted (2026-09-21). Partly superseded by ADR-0007: buy buttons, Category cells, display serif, sharp corners and the missing theme toggle. The palette stands.

The site is built in **Jana's own identity, extracted from the printed menu card she made**, and
laid out as an **illustrated menu**: every Category is a photograph carrying its own name, line and
price. There is no separate gallery section and no separate typographic menu. The two are one
thing, because a customer wants the photograph at the moment they are looking at the price.

Settled against a prototype of six homepage variants, on branch `prototype/013-design-direction`
(`/prototype/design-direction?variant=F`). Variant F is the accepted direction.

## The identity

Jana supplied a printed menu card. Its tokens were **extracted, not invented**. The added rows are
the minimum needed to turn a two-colour poster into a system that can express a form, an error, a
price and a dark mode.

| Role | Value | Source |
| --- | --- | --- |
| Ground | `#EAE3D9` warm cream | her card |
| Raised surface | `#F4EFE6` | derived |
| Ink | `#3E2E26` espresso | her card |
| Muted ink | `#63544A` | derived, 5.69:1 on ground |
| Display + italic | Cormorant Garamond | her card |
| Wordmark | Parisienne script, used **once** per page | her card, which sets "Menu" once in script |
| Motif | single-stroke cake stand | her card |
| Accent | `#4F5A31` deep olive | **added** |
| Functional text | Geist | **added** |

Dark mode inverts her own pair rather than inventing a second palette: ground `#2A1F19`, ink
`#F4EFE6`, accent lifted to `#93A06A` so it still passes on a dark ground.

Every pair in use was measured. Lowest in the system is 5.51:1 (dark-mode accent button), all above
WCAG AA. `#3E2E26` on `#4F5A31` measures 1.75:1 and is **excluded**: espresso ink never sits on
olive.

Dials: `DESIGN_VARIANCE 6`, `MOTION_INTENSITY 4`, `VISUAL_DENSITY 3`.

Corner radius is **0 everywhere**. Print does not round, and both competitors are soft, so sharp
corners are doing differentiation work as well as fidelity work.

## Two anti-default rules deliberately overridden

Both are recorded so a future session does not "correct" them.

**The cream-and-espresso palette stays**, despite being the exact family that generic design
guidance bans as an AI default for artisan and bakery briefs. That ban exists to stop a model
reaching for it unprompted. Jana reached for it first, so it is brand material and it outranks the
default.

**A display serif stays**, for the same reason. It is Cormorant Garamond, chosen to match the
high-contrast old-style face on her card.

The functional split is the concession that makes both survivable: her serif carries display, and
Geist carries prices, forms, allergens and the Estimate, because a high-contrast serif at 14px on a
phone is not readable and this site is judged on a phone.

## Differentiation is register, not hue

Two competitors were examined directly rather than from memory.

`cakesbycaro.com`, the closest comparable and also Amsterdam: ground `#fff9f1`, accent deep
raspberry `#8b2332`, Fredoka (rounded playful sans) with Vollkorn. Its positioning copy is nearly
identical to Jana's.

`dedriegraefjes.nl`: cream ground, geometric sans, hero carousel, bestseller product grid with euro
prices and "Bekijk product" buttons, a cart, a four-step ordering flow, six location tiles.

Two findings shaped the direction:

- **Cream ground is table stakes and cannot be the differentiator.** All three are cream. Changing
  Jana's ground to stand out would discard her identity and still compete on the same axis.
- **Berry is unavailable.** `#8b2332` is Caro's accent. Deep olive is the one warm-adjacent colour
  neither competitor uses.

So the difference is **register**. Both competitors are webshops: carousels, product grids, carts,
rounded friendly sans, volume. Jana's card is the opposite and so is her business, which takes an
Enquiry rather than an order (see `CONTEXT.md`). The site is the quiet, personal, editorial one.

In practice that means: no carousel, no cart affordance, no buy buttons, at most one marquee, sharp
corners, and stillness while both competitors move.

## The illustrated menu

The catalogue is the page. Each of the five Categories is a photograph with its name, tagline,
Jana's italic note where she wrote one, and its price on the same baseline as the name.

The risk this runs is becoming the product grid both competitors already have. Three things are
**binding on the build** because they are what holds it off:

1. **Unequal cells.** Spans run 7/5, then 5/7, then the fifth Category runs full width as a band so
   the menu does not end on a lopsided row. Nothing repeats at equal width. Equal-width cards would
   collapse this straight back into a product grid.
2. **No buy buttons anywhere.** The whole entry is the link.
3. **Type stays at menu-card scale.** The Category name at roughly 34px in her serif, not shrunk
   into product-card labels.

Page order: editorial hero with a photograph bleeding across the lower edge of the viewport, fact
band (lead time, pickup, from-price), illustrated menu, split about Jana, allergen notice, customer
quote, FAQ accordion, closing band. Eight sections, eight distinct layout families, zero eyebrow
labels.

## What was rejected, and why

- **Photography-led editorial** (full-bleed photo hero, bento, scroll rail, marquee). Rejected as a
  cliche. It is what the category already looks like.
- **The enquiry builder on the homepage.** Rejected as "not ideal", and it also contradicted
  ADR-0003, which puts the Enquiry on the Item page and on `/custom-order`. The Estimate keeps the
  behaviour specified in #11; it simply does not live on the homepage. The homepage sends you into
  the menu.
- **A gallery wall as its own section**, taking the edge-to-edge photo band from
  `dedriegraefjes.nl`. Rejected: separating the menu from the cakes was the error F corrects.
- **A hero photograph placed beside the headline.** Rejected as arbitrary placement. A photograph
  needs a compositional reason, not just a slot next to type.

## Consequences

- **Motion budget is small and must stay small.** Entry reveal on sections, a hover scale on menu
  photographs, tactile `active` states. No pinning, no scroll hijack, no carousel. All of it behind
  `prefers-reduced-motion`. This is also why the static-generation and Core Web Vitals commitments
  in ADR-0001 and ADR-0002 stay cheap to keep.
- **Photography is now load-bearing.** Every cell of the illustrated menu is a photograph doing
  real work. The map treats the photography itself as out of scope, which still holds, but the
  build cannot be judged, and arguably should not start, on placeholders. Rough unedited shots are
  enough to validate; finished edits are not required.
- **The direction has not been seen at phone width.** The prototype's collapse rules are declared
  per section (`md:`-prefixed grids, `px-5` gutters) but never visually verified, and the whole
  design read rests on a customer deciding one-handed on a phone. **First check of the build.**
- **Nibbles has no price and no display name from Jana.** It is in the ADR-0003 Category ladder but
  absent from her menu card, which also names Bento as "Cheeky Bento Cakes". Content question for
  Jana, tracked with the Dutch route wording.
- The prototype is throwaway. It is captured on `prototype/013-design-direction` and is a primary
  source, not code to promote. Rewrite properly when building.
