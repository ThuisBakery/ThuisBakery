/*
 * The interaction language (ADR-0007): everything a customer can press looks pressable. Every
 * link, button, chip and tile has a pointer (set once, in `styles.css`), a hover state, a
 * press state and a visible focus ring (the global `:focus-visible`, which follows these
 * corners). One class string per kind of control, so a page cannot invent a fifth.
 *
 * Hover and press never rely on movement alone. Each has a change that does not move, a
 * shadow, a colour or an opacity, and the movement on top is written `motion-safe:`, so under
 * `prefers-reduced-motion` nothing scales or shifts and the states are still there.
 *
 * Shape: buttons and chips are pills (`rounded-full`); cards, photographs and inputs take
 * the one 12px radius (`rounded-card`). The palette is ADR-0004's and is not touched here:
 * every colour below is a pair already in use.
 */

/** Colour, shadow and scale ease; the global reduced-motion rule flattens the durations. */
const EASE =
  'transition-[color,background-color,border-color,text-decoration-color,box-shadow,opacity,scale] duration-200 ease-out'

/** The press, as movement: only when motion is welcome. */
const PRESS_MOTION = 'motion-safe:active:scale-[0.97]'

/** The shape every button shares: a pill, never wrapping its label. */
const PILL =
  'inline-flex items-center justify-center gap-2 rounded-full text-center tracking-wide whitespace-nowrap'

/** The sizes a pill comes in: a page's action, and the header's smaller controls. */
const LARGE = 'min-h-12 px-8 py-3 text-sm'
const SMALL = 'min-h-11 px-4 py-2 text-[13px]'

/** Olive, lifted by a soft olive shadow on hover. */
const FILLED = [
  PILL,
  EASE,
  PRESS_MOTION,
  'bg-accent text-accent-ink',
  'hover:shadow-[0_6px_18px_color-mix(in_srgb,var(--accent)_35%,transparent)]',
  'active:shadow-none active:brightness-95',
  'disabled:opacity-60 disabled:shadow-none',
].join(' ')

/** Outlined in ink; hover fills it with ink, the pair the site already sets as ground on ink. */
const OUTLINED = [
  PILL,
  EASE,
  PRESS_MOTION,
  'border border-ink',
  'hover:bg-ink hover:text-ground',
  'active:opacity-80',
].join(' ')

/** The primary action on the ground. */
export const BUTTON = `${FILLED} ${LARGE} font-medium`

/** The primary action at the header's size: the Custom order button beside the nav. */
export const BUTTON_SMALL = `${FILLED} ${SMALL}`

/**
 * The primary action on the olive band, inverted. An olive focus ring would vanish there,
 * so the ring takes the band's own ink.
 */
export const BUTTON_ON_ACCENT = [
  PILL,
  LARGE,
  'font-medium',
  EASE,
  PRESS_MOTION,
  'bg-accent-ink text-accent',
  'hover:shadow-[0_6px_18px_rgb(0_0_0/0.22)]',
  'active:shadow-none active:brightness-95',
  'focus-visible:outline-accent-ink',
].join(' ')

/** A secondary control: the language switcher and the menu's open and close. */
export const BUTTON_OUTLINE = `${OUTLINED} ${SMALL}`

/**
 * A secondary action at a page's size: a marketing page's outlined call to action, and the
 * homepage hero's Something custom.
 */
export const BUTTON_OUTLINE_LARGE = `${OUTLINED} ${LARGE}`

/**
 * An outlined round button holding only an icon: the theme control, the quantity stepper
 * and the calendar's months. At the end of its range it is `aria-disabled` rather than
 * disabled, so focus is not lost from under the customer's finger: faded, and still.
 */
export const ICON_BUTTON = [
  OUTLINED,
  'size-11 shrink-0',
  'aria-disabled:cursor-default aria-disabled:opacity-40',
  'aria-disabled:hover:bg-transparent aria-disabled:hover:text-ink motion-safe:aria-disabled:active:scale-100',
].join(' ')

/**
 * Links inside Jana's rich text and the Contact details, styled from outside because the
 * `<a>` elements are rendered by someone else: `INLINE_LINK`, applied to descendants.
 */
export const DESCENDANT_LINKS = [
  '[&_a]:underline [&_a]:underline-offset-4',
  '[&_a]:transition-[color,opacity] [&_a]:duration-200',
  '[&_a:hover]:text-accent [&_a:active]:opacity-70',
].join(' ')

/** The one secondary link style: underlined words, which turn olive on hover. */
export const TEXT_LINK = [
  'inline-flex min-h-11 items-center text-sm tracking-wide underline decoration-rule underline-offset-4',
  EASE,
  'hover:text-accent hover:decoration-current',
  'active:opacity-70',
].join(' ')

/** The secondary link on the olive band, where olive text would vanish: it thickens instead. */
export const TEXT_LINK_ON_ACCENT = [
  'inline-flex min-h-11 items-center text-sm tracking-wide underline underline-offset-4',
  EASE,
  'hover:decoration-2',
  'active:opacity-70',
  'focus-visible:outline-accent-ink',
].join(' ')

/** A link inside running text, where the words around it set the size. */
export const INLINE_LINK = [
  'underline underline-offset-4',
  EASE,
  'hover:text-accent',
  'active:opacity-70',
].join(' ')

/** A navigation link, quieter than the page's own: the header's and the footer's. */
export const NAV_LINK = [EASE, 'hover:text-accent', 'active:opacity-60'].join(' ')

/**
 * One row of a list of Items, name on the left: the catalogue's lists, an Item's siblings and
 * an Occasion page's Items. The row is the link, so the whole of it answers.
 */
export const ROW_LINK = [
  'flex min-h-12 items-baseline justify-between gap-4 py-3',
  EASE,
  'hover:text-accent',
  'active:bg-raised',
].join(' ')

/**
 * A photograph and its words as one link (a menu tile). The photograph's own hover zoom and
 * the heading's colour are set where they are drawn, through `group-hover`.
 */
export const TILE = [
  'group block rounded-card',
  EASE,
  'active:opacity-85',
  'motion-safe:active:scale-[0.99]',
].join(' ')

/** A tile's heading: olive while the tile is hovered, so reduced motion still has a hover. */
export const TILE_HEADING = `${EASE} group-hover:text-accent`

/** A tile's photograph: a slow zoom on hover, only when motion is welcome. */
export const TILE_PHOTOGRAPH =
  'motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.03]'

/**
 * The face of one radio choice, drawn after its hidden `peer` input, which takes the press:
 * a pill for a short choice (a chip), a card for a stacked one with a price. Chosen, it
 * inverts to ground on ink, the pair the rest of the site already sets.
 */
const CHOICE = [
  'flex min-h-11 flex-wrap items-center gap-x-1.5 border border-rule text-sm',
  EASE,
  'peer-hover:border-ink',
  'peer-active:bg-raised motion-safe:peer-active:scale-[0.98]',
  'peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ground',
  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
].join(' ')

export const CHIP = `${CHOICE} rounded-full px-4 py-2`

export const CHOICE_CARD = `${CHOICE} rounded-card px-4 py-3`

/**
 * A day in the Requested pickup date's calendar, drawn after its hidden `peer` radio: a round
 * cell that inverts when chosen, as a chip does. A day that cannot be asked for is disabled,
 * faded and struck through, so the mark does not rely on the fade alone, and answers nothing.
 */
export const DAY = [
  'grid aspect-square min-h-11 place-items-center rounded-full text-[15px] tabular-nums',
  EASE,
  'peer-hover:bg-raised',
  'peer-active:bg-rule motion-safe:peer-active:scale-[0.94]',
  'peer-checked:bg-ink peer-checked:font-semibold peer-checked:text-ground',
  'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent',
  'peer-disabled:text-ink-muted/60 peer-disabled:line-through peer-disabled:peer-hover:bg-transparent',
].join(' ')

/** A text field, date or select: the one radius, and a border that darkens on hover. */
export const FIELD = [
  'block min-h-12 w-full rounded-card border border-rule bg-raised px-3 py-2 text-base text-ink',
  EASE,
  'hover:border-ink-muted',
  'aria-[invalid=true]:border-2 aria-[invalid=true]:border-ink',
].join(' ')

/** A file input: its own button is a small outlined pill. */
export const FILE_FIELD = [
  'block w-full text-sm',
  'file:mr-3 file:min-h-11 file:rounded-full file:border file:border-rule file:bg-raised file:px-4 file:py-2 file:text-ink',
  'file:transition-colors hover:file:border-ink active:file:bg-ground',
].join(' ')

/**
 * A gallery thumbnail, which swaps the main photograph. Faded until hovered or shown; the one
 * shown (`aria-pressed`) is ringed in ink, so the mark does not rely on the fade alone.
 */
export const THUMBNAIL = [
  'block size-14 overflow-hidden rounded-card border-2 border-transparent bg-raised opacity-70 md:size-[4.5rem]',
  EASE,
  PRESS_MOTION,
  'hover:opacity-100',
  'active:opacity-85',
  'aria-pressed:border-ink aria-pressed:opacity-100',
].join(' ')

/**
 * A compact card for another Item: a small photograph, the title and the price, as one
 * link (an Item page's foot). The border darkens on hover, as a field's does.
 */
export const COMPACT_TILE = [
  'group flex min-h-12 items-center gap-4 rounded-card border border-rule bg-raised p-2 pr-4',
  EASE,
  'motion-safe:active:scale-[0.99]',
  'hover:border-ink',
  'active:opacity-85',
].join(' ')

/** A link drawn as a chip: an Occasion or Custom order at the foot of an Item page. */
export const CHIP_LINK = [
  PILL,
  EASE,
  PRESS_MOTION,
  'min-h-11 border border-rule px-4 py-2 text-sm',
  'hover:border-ink',
  'active:bg-raised',
].join(' ')

/** A photograph's frame: the one radius, the raised ground while it loads. */
export const PHOTO_FRAME = 'overflow-hidden rounded-card bg-raised'
