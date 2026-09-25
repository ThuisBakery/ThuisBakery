import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Footer, Header } from '@/payload-types'

import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { ThemeScript } from './ThemeScript'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

const header: Header = {
  id: 1,
  links: [
    { page: 'cakes', label: 'Cakes' },
    { page: 'nibbles', label: 'Nibbles' },
    { page: 'about', label: 'About' },
    { page: 'contact', label: 'Contact' },
  ],
  callToAction: { page: 'customOrder', label: 'Custom order' },
}

const dutchHeader: Header = {
  id: 1,
  links: [
    { page: 'cakes', label: 'Taarten' },
    { page: 'nibbles', label: 'Lekkernijen' },
    { page: 'about', label: 'Over Jana' },
    { page: 'contact', label: 'Contact' },
  ],
  callToAction: { page: 'customOrder', label: 'Maatwerk' },
}

describe('SiteHeader', () => {
  it('offers Dutch, in Dutch, on the same page', () => {
    render(<SiteHeader locale="en" page="cakes" header={header} />)

    const switcher = screen.getByRole('link', { name: 'In het Nederlands' })

    expect(switcher.getAttribute('href')).toBe('/nl/taarten')
    expect(switcher.getAttribute('lang')).toBe('nl')
    expect(switcher.getAttribute('hreflang')).toBe('nl')
  })

  it('offers English, in English, on the same page', () => {
    render(<SiteHeader locale="nl" page="about" header={header} />)

    const switcher = screen.getByRole('link', { name: 'In English' })

    expect(switcher.getAttribute('href')).toBe('/about')
    expect(switcher.getAttribute('lang')).toBe('en')
  })

  it('lands on the path it is given, where the page is not a coded one', () => {
    render(
      <SiteHeader locale="en" page="cakes" alternate="/nl/taarten/appeltaart" header={header} />,
    )

    expect(screen.getByRole('link', { name: 'In het Nederlands' }).getAttribute('href')).toBe(
      '/nl/taarten/appeltaart',
    )
  })

  it('links the navigation from the global, in the page’s own locale', () => {
    render(<SiteHeader locale="nl" page="home" header={dutchHeader} />)

    const nav = screen.getByRole('navigation', { name: 'Hoofdmenu' })
    const links = within(nav)
      .getAllByRole('link')
      .map((link) => [link.textContent, link.getAttribute('href')])

    expect(links).toEqual([
      ['Taarten', '/nl/taarten'],
      ['Lekkernijen', '/nl/lekkernijen'],
      ['Over Jana', '/nl/over-jana'],
      ['Contact', '/nl/contact'],
      ['Maatwerk', '/nl/maatwerk'],
    ])
  })

  it('links the wordmark to the home page of the same locale', () => {
    render(<SiteHeader locale="nl" page="cakes" header={dutchHeader} />)

    expect(screen.getByRole('link', { name: 'ThuisBakery' }).getAttribute('href')).toBe('/nl')
  })
})

describe('the theme toggle', () => {
  const theme = () => document.documentElement.getAttribute('data-theme')

  it('starts on System, which follows the device', () => {
    render(<SiteHeader locale="en" page="home" header={header} />)

    expect(screen.getByRole('button', { name: 'Theme: System. Switch to Light' })).toBeTruthy()
    expect(theme()).toBe('system')
  })

  it('cycles System, Light, Dark and back, and the page follows each', () => {
    render(<SiteHeader locale="en" page="home" header={header} />)

    fireEvent.click(screen.getByRole('button', { name: 'Theme: System. Switch to Light' }))
    expect(theme()).toBe('light')

    fireEvent.click(screen.getByRole('button', { name: 'Theme: Light. Switch to Dark' }))
    expect(theme()).toBe('dark')

    fireEvent.click(screen.getByRole('button', { name: 'Theme: Dark. Switch to System' }))
    expect(theme()).toBe('system')
  })

  it('remembers the choice on the next page', () => {
    render(<SiteHeader locale="en" page="home" header={header} />)
    fireEvent.click(screen.getByRole('button', { name: 'Theme: System. Switch to Light' }))
    fireEvent.click(screen.getByRole('button', { name: 'Theme: Light. Switch to Dark' }))
    cleanup()
    document.documentElement.removeAttribute('data-theme')

    render(<SiteHeader locale="en" page="cakes" header={header} />)

    expect(screen.getByRole('button', { name: 'Theme: Dark. Switch to System' })).toBeTruthy()
    expect(theme()).toBe('dark')
  })

  it('names the themes in Dutch on a Dutch page', () => {
    localStorage.setItem('thuisbakery-theme', 'light')

    render(<SiteHeader locale="nl" page="home" header={dutchHeader} />)

    expect(screen.getByRole('button', { name: 'Thema: Licht. Wissel naar Donker' })).toBeTruthy()
  })

  it('falls back to System on a stored value it does not know', () => {
    localStorage.setItem('thuisbakery-theme', 'sepia')

    render(<SiteHeader locale="en" page="home" header={header} />)

    expect(screen.getByRole('button', { name: 'Theme: System. Switch to Light' })).toBeTruthy()
    expect(theme()).toBe('system')
  })

  it('still switches, starting from System, when the browser blocks storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })

    const errors = vi.fn()
    window.addEventListener('error', errors)

    render(<SiteHeader locale="en" page="home" header={header} />)
    expect(theme()).toBe('system')

    fireEvent.click(screen.getByRole('button', { name: 'Theme: System. Switch to Light' }))
    window.removeEventListener('error', errors)

    expect(screen.getByRole('button', { name: 'Theme: Light. Switch to Dark' })).toBeTruthy()
    expect(theme()).toBe('light')
    expect(errors).not.toHaveBeenCalled()
  })
})

/*
 * The layout's pre-paint script, run as the browser runs it: once, on its own, before React.
 * React does not execute a rendered script, so the test does.
 */
describe('the pre-paint theme script', () => {
  const runThemeScript = () => {
    const { container } = render(<ThemeScript />)

    new Function(container.querySelector('script')?.textContent ?? '')()

    return document.documentElement.getAttribute('data-theme')
  }

  it('applies the stored choice to the page before it is painted', () => {
    localStorage.setItem('thuisbakery-theme', 'dark')

    expect(runThemeScript()).toBe('dark')
  })

  it('leaves a first visit on System', () => {
    expect(runThemeScript()).toBe('system')
  })

  it('leaves a stored value it does not know on System', () => {
    localStorage.setItem('thuisbakery-theme', '"><img>')

    expect(runThemeScript()).toBe('system')
  })

  it('leaves the page on System, without throwing, when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError')
    })

    expect(runThemeScript()).toBe('system')
  })
})

const footer: Footer = {
  id: 1,
  tagline: 'Baked at home in Uithoorn.',
  links: [
    { page: 'home', label: 'Home' },
    { page: 'cakes', label: 'Cakes' },
    { page: 'nibbles', label: 'Nibbles' },
    { page: 'customOrder', label: 'Custom order' },
    { page: 'about', label: 'About' },
    { page: 'contact', label: 'Contact' },
    { page: 'privacy', label: 'Privacy' },
  ],
}

describe('SiteFooter', () => {
  it('links every page in the global, in the page’s own locale', () => {
    render(<SiteFooter locale="en" page="home" footer={footer} />)

    const nav = screen.getByRole('navigation', { name: 'All pages' })
    const hrefs = within(nav)
      .getAllByRole('link')
      .map((link) => link.getAttribute('href'))

    expect(hrefs).toEqual([
      '/',
      '/cakes',
      '/nibbles',
      '/custom-order',
      '/about',
      '/contact',
      '/privacy',
    ])
  })

  it('carries the language switcher too, to the same page', () => {
    render(<SiteFooter locale="en" page="privacy" footer={footer} />)

    expect(screen.getByRole('link', { name: 'In het Nederlands' }).getAttribute('href')).toBe(
      '/nl/privacy',
    )
  })
})
