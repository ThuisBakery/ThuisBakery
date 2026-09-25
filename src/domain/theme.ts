/**
 * The customer's theme choice (ADR-0007). System is the default and follows the device;
 * Light and Dark override it. The stylesheet reads the choice from `data-theme` on the root
 * element, and the browser keeps it in localStorage — never a cookie, because the site ships
 * no non-essential cookie (docs/agents/build-conventions.md).
 */
export type Theme = 'system' | 'light' | 'dark'

/** In the order the header's control cycles through them. */
export const THEMES: readonly Theme[] = ['system', 'light', 'dark']

export const DEFAULT_THEME: Theme = 'system'

/** The localStorage key the choice is kept under. */
export const THEME_STORAGE_KEY = 'thuisbakery-theme'

/** The root element's attribute that the stylesheet's tokens key on. */
export const THEME_ATTRIBUTE = 'data-theme'

/** A stored or attribute value as a Theme; anything unrecognised, or nothing, is System. */
export const parseTheme = (value: unknown): Theme =>
  THEMES.find((theme) => theme === value) ?? DEFAULT_THEME

/** The theme the control moves to next: System → Light → Dark → System. */
export const nextTheme = (theme: Theme): Theme =>
  THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length] ?? DEFAULT_THEME

/**
 * The script that applies the stored choice to the root element while the page is still
 * being parsed, before first paint, so a statically generated page never shows the other
 * theme first. It must run on its own, so it repeats `parseTheme` in plain ES5. Storage that
 * is missing or blocked throws, and leaves the page on System.
 */
export const themeScript = `(function(){var t;try{t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)})}catch(e){}if(${JSON.stringify(THEMES)}.indexOf(t)<0)t=${JSON.stringify(
  DEFAULT_THEME,
)};document.documentElement.setAttribute(${JSON.stringify(THEME_ATTRIBUTE)},t)})()`
