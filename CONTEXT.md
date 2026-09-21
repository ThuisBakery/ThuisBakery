# ThuisBakery

The website for Jana's home bakery in Uithoorn: a catalogue of what she bakes, and an enquiry form that starts a conversation with a customer. Pickup only, no payments, no accounts.

## Language

### The catalogue

**Item**:
Something Jana sells, whether or not it is a cake. Cakes, cookies and brownies are all Items.
_Avoid_: Product, Cake (as the general term), Menu item

**Category**:
A tier of the menu, in Jana's own ladder: Proefhapjes, Bento, Indulgent, Specialty, Nibbles. Every Item belongs to exactly one, and it is what the menu page is organised by.
_Avoid_: Tier, Collection, Type, Range

**Occasion**:
What an Item is bought for — birthday, wedding, baby shower. An optional tag on an Item, used to build landing pages, never to organise the menu.
_Avoid_: Category, Event, Use case

**Size**:
A priced variant of one Item, carrying a label, a diameter, a layer count and a serving count. An Item that comes only one way has exactly one Size.
_Avoid_: Variant, Option, Formaat, Portion

**Configurable**:
Said of an Item whose customer chooses a Sponge and a Filling. An Item that is not configurable is sold exactly as described.
_Avoid_: Custom, Build-your-own, Made to order

**Sponge**:
A cake base a customer can choose — Chocolate, Vanilla, Funfetti, Red Velvet. Shared across every configurable Item rather than written out per Item.
_Avoid_: Base, Flavour (which is ambiguous between Sponge and Filling), Cake type

**Filling**:
A topping-and-filling a customer can choose — Cream Cheese, Salted Caramel, Ganache. Shared like Sponge, and may carry a surcharge.
_Avoid_: Topping, Frosting, Icing, Flavour

**Surcharge**:
An amount a Sponge or Filling adds to an Item's price. The only thing besides Size and quantity that the Estimate is allowed to include.
_Avoid_: Upcharge, Add-on, Extra, Modifier

**Allergen**:
One of the substances an Item contains, carrying a name and an icon. Distinct from a dietary claim: "contains egg" is an Allergen, "vegan" is not.
_Avoid_: Dietary info, Intolerance, Ingredient

**Cross-contamination statement**:
The single site-wide notice that Jana bakes in a home kitchen and cannot exclude traces. Sits alongside every Allergen list and is never written per Item.
_Avoid_: Disclaimer, Allergy warning

### Ordering

**Enquiry**:
A customer's request for a specific Item, sent from that Item's page. It is not an order and never becomes one on the website; Jana's reply is what makes it real.
_Avoid_: Order, Booking, Request, Quote, Aanvraag

**Estimate**:
The running figure shown as a customer fills in an Enquiry, covering Size, quantity and Surcharges and nothing else. Always provisional, always labelled as such.
_Avoid_: Price, Total, Quote, Cost

**Special requests**:
Free text on an Enquiry for anything the form does not model — a written message, colours, a theme. Never priced by the Estimate.
_Avoid_: Notes, Comments, Customisation, Wensen

**Inspiration photo**:
One image a customer may attach to an Enquiry to show what they have in mind.
_Avoid_: Attachment, Reference image, Upload

**Requested pickup date**:
The date a customer asks to collect on. Requested, never confirmed: only Jana's reply confirms a date.
_Avoid_: Pickup date, Delivery date, Collection date, Due date

**Lead time**:
How far ahead of a Requested pickup date an Enquiry must arrive, expressed as a number of days *and* a time of day — the pair, not the days alone. Set globally and overridable per Item.
_Avoid_: Notice period, Turnaround, Cutoff (which names only half of it)

**Closed until**:
A single date Jana sets when she is away or full, which blocks earlier Requested pickup dates and shows a notice. The whole of the site's availability logic.
_Avoid_: Blackout, Holiday mode, Calendar, Availability
