# PROTOTYPE: the Enquiry flow (throwaway)

Primary source, not code to promote. Open `index.html` in a browser (it loads its fonts from
Google Fonts and its photographs from `photos/`, which are resized copies of the seeded
placeholders in `src/migrations/placeholder-photos/`). Published while it was being judged at
https://claude.ai/artifact/4Xza6kQWa1M4y9z8rZKrZw

## The question

The live site makes it hard to reach a sent Enquiry: Home, then `/cakes#bento`, then a price
label that is the only link, then an Item page whose choices sit below the fold on a phone and
take several scrolls to complete. How few scrolls and taps can it take, and what should the
site look like doing it?

## The switches

The **Prototype** button (bottom left) switches:

- Item page flow: A, the whole form inline with a sticky Estimate bar; B, the Item page decides
  and "Ask Jana for this cake" opens a stepped sheet
- Last step of B: extras with contact details, or a separate "Anything else?" step
- Palette: Jana's card (today), Olive + Brick, Terracotta + Slate, Mono + Pistachio, Forest + Amber
- Theme: System / Light / Dark (also the site's own toggle, in the header)

A readout shows the route, the sheet step, every field and a tap counter.

## The verdict (2026-09-24)

- **B, the stepped sheet**: Size, Flavour (Configurable Items only), Date, You. Custom order is the
  same sheet: Idea, When, Photo, You.
- Home lists Items, not Categories. A Category is a label on a tile, never a destination.
- Item page: one main photograph with thumbnails, Allergens in the details column, and a compact
  "More for birthdays" row at the foot.
- **Jana's card colours, for now**, with Bricolage Grotesque and Geist, soft corners and pill buttons.
- A System / Light / Dark toggle.
- Still open: the combined or split last step. Recorded in ADR-0007.
