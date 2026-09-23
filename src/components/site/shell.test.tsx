import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { Footer, Header } from '@/payload-types'

import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

afterEach(cleanup)

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
