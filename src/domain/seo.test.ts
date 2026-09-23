import { describe, expect, it } from 'vitest'

import {
  DESCRIPTION_LENGTH,
  descriptionFallback,
  isIndexed,
  metaDescription,
  metaTitle,
  pageRichTexts,
  summary,
} from './seo'

/** Lexical JSON as Payload stores it: a root of paragraphs and headings. */
const richText = (...blocks: ({ heading: string } | string)[]) => ({
  root: {
    type: 'root',
    children: blocks.map((each) =>
      typeof each === 'string'
        ? { type: 'paragraph', children: [{ type: 'text', text: each }] }
        : { type: 'heading', tag: 'h1', children: [{ type: 'text', text: each.heading }] },
    ),
  },
})

describe('metaTitle', () => {
  it('uses the title Jana wrote, as she wrote it', () => {
    expect(metaTitle({ title: 'Wedding cakes in Uithoorn' }, 'Wedding cake')).toBe(
      'Wedding cakes in Uithoorn',
    )
  })

  it('falls back to `<name> — ThuisBakery` when the field is blank', () => {
    expect(metaTitle({ title: '' }, 'Apple pie')).toBe('Apple pie — ThuisBakery')
    expect(metaTitle({ title: '   ' }, 'Apple pie')).toBe('Apple pie — ThuisBakery')
    expect(metaTitle({ title: null }, 'Apple pie')).toBe('Apple pie — ThuisBakery')
    expect(metaTitle(null, 'Apple pie')).toBe('Apple pie — ThuisBakery')
  })

  it('trims stray whitespace from a written title', () => {
    expect(metaTitle({ title: '  Apple pie  ' }, 'Apple pie')).toBe('Apple pie')
  })
})

describe('metaDescription', () => {
  it('uses the description Jana wrote', () => {
    expect(metaDescription({ description: 'Baked to order.' }, 'Anything else')).toBe(
      'Baked to order.',
    )
  })

  it('falls back to the text it is given when the field is blank', () => {
    expect(metaDescription({ description: ' ' }, 'A classic apple pie.')).toBe(
      'A classic apple pie.',
    )
    expect(metaDescription(null, 'A classic apple pie.')).toBe('A classic apple pie.')
  })

  it('truncates a long fallback at a word, marking the cut', () => {
    const long = `${'Buttery pastry and sharp apples '.repeat(10)}end`
    const description = metaDescription(null, long) ?? ''

    expect(description.length).toBeLessThanOrEqual(DESCRIPTION_LENGTH)
    expect(description.endsWith('…')).toBe(true)
    expect(long.startsWith(description.slice(0, -1))).toBe(true)
    expect(description.slice(0, -1).endsWith(' ')).toBe(false)
    // Cut between words, never through one.
    expect(long[description.length - 1]).toBe(' ')
  })

  it('does not truncate a fallback that already fits', () => {
    const exact = 'a'.repeat(DESCRIPTION_LENGTH)

    expect(metaDescription(null, exact)).toBe(exact)
  })

  it('collapses the line breaks and runs of spaces rich text leaves', () => {
    expect(metaDescription(null, 'First line.\nSecond   line.')).toBe('First line. Second line.')
  })

  it('leaves out a description when there is nothing to say', () => {
    expect(metaDescription(null, '')).toBeUndefined()
    expect(metaDescription({ description: '' }, '  \n ')).toBeUndefined()
  })

  it('does not truncate what Jana wrote herself: the counter already told her the length', () => {
    const written = 'x '.repeat(100).trim()

    expect(metaDescription({ description: written }, '')).toBe(written)
  })
})

describe('summary', () => {
  it('reads the prose of each rich text in order, as one line', () => {
    expect(summary([richText('One.', 'Two.'), richText('Three.')])).toBe('One. Two. Three.')
  })

  it('leaves out headings, which repeat the title', () => {
    expect(summary([richText({ heading: 'Christmas' }, 'Order by the 18th.')])).toBe(
      'Order by the 18th.',
    )
  })

  it('skips anything that is not rich text', () => {
    expect(summary([null, undefined, 'plain', richText('Kept.')])).toBe('Kept.')
  })
})

describe('isIndexed', () => {
  it('keeps the Enquiry receipt out of search, and nothing else', () => {
    expect(isIndexed('enquirySent')).toBe(false)
    expect(isIndexed('home')).toBe(true)
    expect(isIndexed('cakes')).toBe(true)
    expect(isIndexed('contact')).toBe(true)
  })
})

describe('pageRichTexts', () => {
  it('reads a marketing page top to bottom: the hero, then each block’s rich text', () => {
    const hero = richText('Hero.')
    const callToAction = richText('Call.')
    const left = richText('Left.')
    const right = richText('Right.')

    expect(
      pageRichTexts({
        hero: { richText: hero },
        layout: [
          { blockType: 'cta', richText: callToAction },
          { blockType: 'mediaBlock', media: 3 },
          { blockType: 'content', columns: [{ richText: left }, { richText: right }] },
        ],
      }),
    ).toEqual([hero, callToAction, left, right])
  })

  it('copes with a page that has no hero or no blocks', () => {
    expect(pageRichTexts({ hero: null, layout: null })).toEqual([])
  })
})

describe('descriptionFallback', () => {
  it('cuts an Item’s from its description', () => {
    expect(descriptionFallback('items', { description: richText('A classic.') })).toBe('A classic.')
  })

  it('cuts a marketing page’s from its own words, having no description field', () => {
    expect(
      descriptionFallback('pages', {
        hero: { richText: richText({ heading: 'Christmas' }, 'Order early.') },
        layout: [{ blockType: 'cta', richText: richText('Ask Jana.') }],
      }),
    ).toBe('Order early. Ask Jana.')
  })
})
