import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { ReactNode } from 'react'

import { Photograph } from '@/components/site/Photograph'
import { DICTIONARY } from '@/domain/dictionary'
import {
  hasHeading,
  linkHref,
  linkTargetKey,
  referenceHref,
  type CmsLink,
  type LinkReference,
} from '@/domain/page'
import type { Locale } from '@/domain/routes'
import type { CallToActionBlock, ContentBlock, Item, MediaBlock, Page } from '@/payload-types'

/** The one secondary link style, as the homepage sets it. */
const TEXT_LINK =
  'inline-flex min-h-11 items-center text-sm tracking-wide underline underline-offset-4 transition-colors duration-200 hover:text-accent'

/** A call to action, as the Item page sets its own; `outline` is the template's second look. */
const BUTTON = {
  default:
    'inline-flex min-h-12 items-center bg-accent px-8 py-3.5 text-sm tracking-wide text-accent-ink motion-safe:transition-transform motion-safe:duration-200 motion-safe:active:translate-y-px',
  outline:
    'inline-flex min-h-12 items-center border border-ink px-8 py-3.5 text-sm tracking-wide transition-colors duration-200 hover:bg-raised motion-safe:active:translate-y-px',
} as const

/**
 * Jana's rich text in the site's register: her serif for headings and body, the functional
 * sans kept for the machinery. Styled from outside because the words are hers and the
 * elements are Lexical's.
 */
const RICH_TEXT = [
  'space-y-4 font-display text-lg leading-relaxed',
  '[&_h1]:text-[40px] [&_h1]:leading-[1.1] [&_h1]:font-medium md:[&_h1]:text-6xl',
  '[&_h2]:text-[34px] [&_h2]:leading-tight [&_h2]:font-semibold',
  '[&_h3]:text-2xl [&_h3]:font-semibold [&_h4]:text-xl [&_h4]:font-semibold',
  '[&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-accent',
  '[&_ul]:list-disc [&_ol]:list-decimal [&_ul,&_ol]:pl-6',
].join(' ')

/** Where each of the template's column sizes sits on the twelve-column grid. */
const COLUMN_SPAN = {
  oneThird: 'md:col-span-4',
  half: 'md:col-span-6',
  twoThirds: 'md:col-span-8',
  full: 'md:col-span-12',
} as const

/**
 * `/<slug>` and `/nl/<slug>` (ADR-0003): a page Jana assembles from the website template's
 * hero and blocks. The template's arrangement is hers to make; how each part looks is the
 * site's, so a page she builds sits in the same register as the coded ones (ADR-0004).
 *
 * Every link on it — a block's, or one inside her rich text — resolves through `targets`,
 * the paths of the pages and Items that exist in this locale. One whose target has none
 * keeps its words and loses its link, rather than leading to a 404.
 *
 * An Occasion page ends at the Items tagged with its Occasion (ADR-0003), each of which
 * links back here from its own page.
 *
 * Takes the Payload document as fetched, so a test renders it with the real shapes.
 */
export const MarketingPage = ({
  locale,
  page,
  targets,
  occasionItems,
}: {
  locale: Locale
  /** The page, populated: the hero's and blocks' photographs. */
  page: Page
  /** The path of every page and Item with a URL in this locale, by `linkTargetKey`. */
  targets: ReadonlyMap<string, string>
  /** The Items tagged with this page's Occasion that have a URL here; empty for any other. */
  occasionItems: readonly Item[]
}) => {
  const words = DICTIONARY[locale]
  const items = occasionItems.flatMap((item) => {
    const href = targets.get(linkTargetKey('items', item.id))

    return href === undefined ? [] : [{ id: item.id, title: item.title, href }]
  })

  return (
    <article className="px-4 pt-6 pb-20 md:px-10 md:pt-10 md:pb-28">
      <div className="mx-auto max-w-[1400px]">
        <Hero page={page} targets={targets} />

        {page.layout.map((block, index) => (
          <div key={block.id ?? index} className="mt-16 md:mt-24">
            {block.blockType === 'content' ? (
              <Content block={block} targets={targets} />
            ) : block.blockType === 'cta' ? (
              <CallToAction block={block} targets={targets} />
            ) : (
              <MediaFigure block={block} />
            )}
          </div>
        ))}

        {items.length > 0 ? (
          <nav aria-label={words.page.occasionItems} className="mt-20 md:mt-28">
            <h2 className="font-display text-[34px] leading-tight font-semibold">
              {words.page.occasionItems}
            </h2>
            <ul className="mt-6 border-t border-rule">
              {items.map((item) => (
                <li key={item.id} className="border-b border-rule">
                  <a
                    href={item.href}
                    className="flex min-h-12 items-baseline justify-between gap-4 py-3 transition-colors duration-200 hover:text-accent active:bg-raised"
                  >
                    <span className="font-display text-xl leading-snug">{item.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </article>
  )
}

/**
 * The template's four heroes. Whatever Jana chooses, the page has exactly one `h1`: her
 * hero's own, or the page title when her hero has none — a marketing page is a search
 * landing page, and one with no heading is a weaker one.
 */
const Hero = ({ page, targets }: { page: Page; targets: ReadonlyMap<string, string> }) => {
  const { type, richText, links, media } = page.hero
  const title = hasHeading(richText, 'h1') ? null : (
    <h1 className="font-display text-[40px] leading-[1.1] font-medium md:text-6xl">{page.title}</h1>
  )

  const words =
    type === 'none' ? (
      title
    ) : (
      <>
        {title}
        {richText ? (
          <CmsRichText data={richText} targets={targets} className={title ? 'mt-6' : ''} />
        ) : null}
        <Links
          links={links}
          targets={targets}
          align={type === 'mediumImpact' ? 'start' : 'center'}
        />
      </>
    )

  if (type === 'highImpact') {
    return (
      <header className="grid gap-8">
        <div className="overflow-hidden bg-raised">
          <Photograph
            media={media}
            sizes="100vw"
            preload
            className="aspect-[4/5] w-full object-cover md:aspect-[16/7]"
          />
        </div>
        <div className="mx-auto max-w-3xl text-center">{words}</div>
      </header>
    )
  }

  if (type === 'mediumImpact') {
    return (
      <header className="grid items-center gap-10 md:grid-cols-12 md:gap-x-12">
        <div className="overflow-hidden bg-raised md:col-span-7">
          <Photograph
            media={media}
            sizes="(min-width: 768px) 58vw, 100vw"
            preload
            className="aspect-[4/5] w-full object-cover md:aspect-[4/3]"
          />
        </div>
        <div className="md:col-span-5">{words}</div>
      </header>
    )
  }

  return <header className="mx-auto max-w-3xl py-8 text-center md:py-16">{words}</header>
}

const Content = ({
  block,
  targets,
}: {
  block: ContentBlock
  targets: ReadonlyMap<string, string>
}) => (
  <div className="grid gap-10 md:grid-cols-12 md:gap-x-12">
    {(block.columns ?? []).map((column, index) => (
      <div key={column.id ?? index} className={COLUMN_SPAN[column.size ?? 'oneThird']}>
        {column.richText ? <CmsRichText data={column.richText} targets={targets} /> : null}
        {column.enableLink && column.link ? (
          <div className="mt-4">
            <CmsLinkView link={column.link} targets={targets} />
          </div>
        ) : null}
      </div>
    ))}
  </div>
)

const CallToAction = ({
  block,
  targets,
}: {
  block: CallToActionBlock
  targets: ReadonlyMap<string, string>
}) => (
  <section className="flex flex-col items-center gap-2 border-y border-rule px-4 py-12 text-center md:py-16">
    {block.richText ? (
      <CmsRichText data={block.richText} targets={targets} className="max-w-2xl" />
    ) : null}
    <Links links={block.links} targets={targets} />
  </section>
)

const MediaFigure = ({ block }: { block: MediaBlock }) => (
  <figure className="overflow-hidden bg-raised">
    <Photograph
      media={block.media}
      sizes="(min-width: 1400px) 1400px, 100vw"
      preload={false}
      className="w-full object-cover"
    />
  </figure>
)

type LinkRow = {
  link: CmsLink & {
    label: string
    newTab?: boolean | null
    appearance?: 'default' | 'outline' | null
  }
  id?: string | null
}

const Links = ({
  links,
  targets,
  align = 'center',
}: {
  links: readonly LinkRow[] | null | undefined
  targets: ReadonlyMap<string, string>
  align?: 'center' | 'start'
}) =>
  links && links.length > 0 ? (
    <div
      className={`mt-8 flex flex-wrap items-center gap-4 ${align === 'center' ? 'justify-center' : 'justify-start'}`}
    >
      {links.map(({ link, id }, index) => (
        <CmsLinkView key={id ?? index} link={link} targets={targets} button />
      ))}
    </div>
  ) : null

/**
 * One of the template's links. A link whose target has no URL in this locale keeps its
 * label as plain text.
 */
const CmsLinkView = ({
  link,
  targets,
  button = false,
}: {
  link: LinkRow['link']
  targets: ReadonlyMap<string, string>
  button?: boolean
}) => {
  const href = linkHref(link, targets)
  const className = button ? BUTTON[link.appearance ?? 'default'] : TEXT_LINK

  if (href === null) {
    return (
      <span className={button ? 'text-sm tracking-wide text-ink-muted' : ''}>{link.label}</span>
    )
  }

  return (
    <a
      href={href}
      className={className}
      {...(link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {link.label}
    </a>
  )
}

/**
 * Lexical rich text whose internal links resolve through `targets`, the same way a block's
 * links do: to this locale's path, or to no link at all.
 */
const CmsRichText = ({
  data,
  targets,
  className = '',
}: {
  data: NonNullable<Page['hero']['richText']>
  targets: ReadonlyMap<string, string>
  className?: string
}) => (
  <RichText data={data} converters={converters(targets)} className={`${RICH_TEXT} ${className}`} />
)

const converters =
  (targets: ReadonlyMap<string, string>): JSXConvertersFunction =>
  ({ defaultConverters }) => ({
    ...defaultConverters,
    link: ({ node, nodesToJSX }) => {
      const children: ReactNode = nodesToJSX({ nodes: node.children })
      const { linkType, doc, url, newTab } = node.fields
      const href =
        linkType === 'internal'
          ? referenceHref(doc as LinkReference | null | undefined, targets)
          : url || null

      if (href === null) {
        return <>{children}</>
      }

      return (
        <a href={href} {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {children}
        </a>
      )
    },
  })
