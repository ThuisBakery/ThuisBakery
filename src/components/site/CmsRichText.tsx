import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { ComponentProps, ReactNode } from 'react'

import { referenceHref, type LinkReference } from '@/domain/page'

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

/**
 * Lexical rich text whose internal links resolve through `targets`, the same way a marketing
 * page's block links do: to this locale's path, or to no link at all — never to a 404. Used
 * wherever Jana writes rich text: marketing pages, About and Privacy.
 */
export const CmsRichText = ({
  data,
  targets,
  className = '',
}: {
  data: ComponentProps<typeof RichText>['data']
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
