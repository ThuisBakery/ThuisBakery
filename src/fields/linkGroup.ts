import type { ArrayField, Field } from 'payload'

import { link, type LinkAppearances } from './link'

/** The template's `linkGroup`: an array of `link`s. See `./link.ts`. */
type LinkGroupType = (options?: {
  appearances?: LinkAppearances[] | false
  overrides?: Partial<ArrayField>
}) => Field

export const linkGroup: LinkGroupType = ({ appearances, overrides = {} } = {}) => {
  const generatedLinkGroup: ArrayField = {
    name: 'links',
    type: 'array',
    fields: [link(appearances === undefined ? {} : { appearances })],
    admin: {
      initCollapsed: true,
    },
  }

  // The template deep-merges; the only overrides it passes are `maxRows`.
  return {
    ...generatedLinkGroup,
    ...overrides,
    admin: { ...generatedLinkGroup.admin, ...overrides.admin },
  } as ArrayField
}
