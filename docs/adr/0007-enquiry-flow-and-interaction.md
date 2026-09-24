# The Enquiry flow and the interaction language

Status: accepted (2026-09-24). Supersedes parts of ADR-0004, listed below.

Reaching a sent Enquiry took two pages that only held links, a price label that was the only
clickable part of a Category, and an Item page whose choices sat below the fold on a phone and
took several scrolls to complete. We decided that **the homepage lists Items, the Item page is for
deciding, and the Enquiry is a stepped sheet** that opens over it. Custom order uses the same sheet.
We also decided to **drop the parts of ADR-0004 that made the site hard to press**.

Settled against a throwaway prototype, captured on branch `prototype/enquiry-flow`
(`prototype/enquiry-flow/`). It compared an inline form with a sticky Estimate bar (A) against
the stepped sheet (B), across five palettes and both themes. B won.

## The flow

- **Home lists Items, grouped visually but not by link.** A Category is a label on an Item's tile,
  never a destination on the way to one. Three of the four cake Categories hold one Item, so the
  Home → `/cakes#<category>` → Item hop was a whole page that held one link. The whole tile is
  the link.
- **The Item page is for deciding.** Before any scroll on a phone it shows the title, price,
  servings, a short description and **Ask Jana for this cake**. The rest of the description sits
  behind "More". One main photograph with thumbnails. On desktop the photograph and the details
  column both stay in view. Allergens and the Cross-contamination statement are in the details
  column. Occasion links and sibling Items move to a compact row at the foot.
- **The Enquiry is a stepped sheet**: Size (with a quantity stepper), then Flavour (Configurable
  Items only), then Requested pickup date, then You. The Estimate and the Next / **Send to Jana**
  button stay pinned at the foot of every step. The confirmation appears in the same sheet. The
  sheet is a bottom sheet on a phone and a side panel on desktop.
- **Custom order is the same sheet**: Idea (Occasion chips and free text), When and how many
  people, Inspiration photo, You. It opens from the header, the homepage and the foot of every
  Item page, with no scroll first.

The route map is unchanged. `/cakes` still exists for search and deep links. Item pages are still
the SEO destinations of ADR-0003, and every Size and price that `Product`/`offers` marks up is still
printed on the Item page itself, not only inside the sheet (ADR-0002). This partly reverses #36,
which made the form's choices the only place the offer was printed.

## What this supersedes in ADR-0004

- **"No buy buttons anywhere."** Every Item page has one primary call to action, and every
  interactive element looks pressable: pointer, hover and press states.
- **The illustrated menu as Category cells.** The homepage menu is Item tiles. Unequal cells stay,
  and so does the rule against equal-width product-grid cards.
- **Cormorant Garamond for display**, replaced by **Bricolage Grotesque**. Geist stays for body,
  prices and forms. Parisienne stays for the wordmark only if Jana wants it.
- **Corner radius 0 everywhere**, replaced by soft 12px corners and pill buttons. Sharp corners
  were a print-fidelity argument, and they were part of why nothing looked pressable.
- **Dark mode follows the OS with no override**, replaced by System / Light / Dark in the header.
  System stays the default.

**The palette is not superseded.** Jana's card colours stay, including the dark inversion. Four
alternatives (olive and brick, terracotta and slate, monochrome and pistachio, forest and amber)
were built and remain in the prototype for Jana to see. A change there is her call.

## Considered and rejected

- **Inline form with a sticky Estimate bar (A).** It keeps the offer on the indexed page, but it is
  still one long scroll, which is the problem we started from.
- **Category tiles that skip to the Item when a Category holds one Item.** It breaks the day Jana
  adds a second Bento.

## Open

- Whether Special requests and the Inspiration photo share the last step with contact details, or
  get their own optional "Anything else?" step. Both are in the prototype.
- "Send to Jana" and "Ask Jana for this cake" are English copy. The Dutch wording is Jana's to set.
