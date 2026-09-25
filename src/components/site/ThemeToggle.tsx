'use client'

import { useLayoutEffect, useSyncExternalStore } from 'react'

import { DICTIONARY } from '@/domain/dictionary'
import type { Locale } from '@/domain/routes'
import {
  DEFAULT_THEME,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  nextTheme,
  parseTheme,
  type Theme,
} from '@/domain/theme'

/*
 * The root element's `data-theme` is the one source of truth on the page: the pre-paint
 * script in the layout sets it from storage, the stylesheet's tokens key on it, and this
 * control reads it back. Storage only carries it from one page load to the next, so a
 * missing or blocked localStorage costs the memory, never the choice on the page.
 */

const listeners = new Set<() => void>()

const appliedTheme = (): Theme => parseTheme(document.documentElement.getAttribute(THEME_ATTRIBUTE))

const storedTheme = (): Theme => {
  try {
    return parseTheme(localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    return DEFAULT_THEME
  }
}

const apply = (theme: Theme) => {
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme)
  listeners.forEach((listener) => listener())
}

const choose = (theme: Theme) => {
  apply(theme)

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Blocked storage: the choice holds for this page, and the next one starts on System.
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

/** Phosphor's circle-half, sun and moon (MIT), as the prototype drew them. */
const ICONS: Record<Theme, string> = {
  system:
    'M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm8,16.37a86.4,86.4,0,0,1,16,3V212.67a86.4,86.4,0,0,1-16,3Zm32,9.26a87.81,87.81,0,0,1,16,10.54V195.83a87.81,87.81,0,0,1-16,10.54ZM40,128a88.11,88.11,0,0,1,80-87.63V215.63A88.11,88.11,0,0,1,40,128Zm160,50.54V77.46a87.82,87.82,0,0,1,0,101.08Z',
  light:
    'M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm72,88a64,64,0,1,1-64-64A64.07,64.07,0,0,1,192,128Zm-16,0a48,48,0,1,0-48,48A48.05,48.05,0,0,0,176,128ZM58.34,69.66A8,8,0,0,0,69.66,58.34l-16-16A8,8,0,0,0,42.34,53.66Zm0,116.68-16,16a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM192,72a8,8,0,0,0,5.66-2.34l16-16a8,8,0,0,0-11.32-11.32l-16,16A8,8,0,0,0,192,72Zm5.66,114.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32-11.32ZM48,128a8,8,0,0,0-8-8H16a8,8,0,0,0,0,16H40A8,8,0,0,0,48,128Zm80,80a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V216A8,8,0,0,0,128,208Zm112-88H216a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16Z',
  dark: 'M233.54,142.23a8,8,0,0,0-8-2,88.08,88.08,0,0,1-109.8-109.8,8,8,0,0,0-10-10,104.84,104.84,0,0,0-52.91,37A104,104,0,0,0,136,224a103.09,103.09,0,0,0,62.52-20.88,104.84,104.84,0,0,0,37-52.91A8,8,0,0,0,233.54,142.23ZM188.9,190.34A88,88,0,0,1,65.66,67.11a89,89,0,0,1,31.4-26A106,106,0,0,0,96,56,104.11,104.11,0,0,0,200,160a106,106,0,0,0,14.92-1.06A89,89,0,0,1,188.9,190.34Z',
}

/**
 * The header's System / Light / Dark control (ADR-0007). One button that cycles, named for
 * the theme it shows and the one it moves to, at every width.
 *
 * On the server, and in the first render that hydrates, it reads System; the real choice
 * follows straight after, from the root element the pre-paint script already set. Only the
 * icon waits for hydration — the page's colours never do.
 */
export const ThemeToggle = ({ locale }: { locale: Locale }) => {
  // Its words are read here, not passed in: the accessible name is a function of the theme,
  // and a server component cannot hand a function to a client one.
  const words = DICTIONARY[locale].theme
  const theme = useSyncExternalStore(subscribe, appliedTheme, () => DEFAULT_THEME)
  const next = nextTheme(theme)

  // Before paint, apply what storage holds. In production the pre-paint script has already
  // done this; in development Strict Mode's remount resets `<html>` to its JSX attributes and
  // clears the one the script set (Next's guide, "Preventing flash before hydration").
  useLayoutEffect(() => {
    apply(storedTheme())
  }, [])

  return (
    <button
      type="button"
      onClick={() => choose(next)}
      aria-label={words.toggle(words.names[theme], words.names[next])}
      className="inline-flex size-9.5 shrink-0 items-center justify-center border border-ink transition-colors duration-300 hover:bg-ink hover:text-ground motion-safe:active:translate-y-px"
    >
      <svg aria-hidden="true" viewBox="0 0 256 256" fill="currentColor" className="size-4.5">
        <path d={ICONS[theme]} />
      </svg>
    </button>
  )
}
