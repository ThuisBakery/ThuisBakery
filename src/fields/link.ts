import type { Field, GroupField } from 'payload'

import { LINK_TARGETS } from '@/domain/page'

/**
 * The link field from Payload's website template, kept as the template writes it so Jana
 * gets the documented experience (ADR-0003). One change: the template links internally to
 * `pages` and `posts`, and this site has no posts, so the internal targets are marketing
 * pages and Items. A coded page — `/cakes`, `/nl/maatwerk` — is a custom URL; the layout
 * is localized, so each locale's blocks carry that locale's URL.
 */
export type LinkAppearances = 'default' | 'outline'

export const appearanceOptions: Record<LinkAppearances, { label: string; value: string }> = {
  default: { label: 'Default', value: 'default' },
  outline: { label: 'Outline', value: 'outline' },
}

type LinkType = (options?: {
  appearances?: LinkAppearances[] | false
  disableLabel?: boolean
  overrides?: Partial<GroupField>
}) => Field

export const link: LinkType = ({ appearances, disableLabel = false, overrides = {} } = {}) => {
  const linkResult: GroupField = {
    name: 'link',
    type: 'group',
    admin: {
      hideGutter: true,
    },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'type',
            type: 'radio',
            admin: {
              layout: 'horizontal',
              width: '50%',
            },
            defaultValue: 'reference',
            options: [
              { label: 'Internal link', value: 'reference' },
              { label: 'Custom URL', value: 'custom' },
            ],
          },
          {
            name: 'newTab',
            type: 'checkbox',
            admin: {
              style: {
                alignSelf: 'flex-end',
              },
              width: '50%',
            },
            label: 'Open in new tab',
          },
        ],
      },
    ],
  }

  const linkTypes: Field[] = [
    {
      name: 'reference',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => siblingData?.['type'] === 'reference',
      },
      label: 'Document to link to',
      relationTo: [...LINK_TARGETS],
      required: true,
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        condition: (_, siblingData) => siblingData?.['type'] === 'custom',
      },
      label: 'Custom URL',
      required: true,
    },
  ]

  if (!disableLabel) {
    linkResult.fields.push({
      type: 'row',
      fields: [
        ...linkTypes,
        {
          name: 'label',
          type: 'text',
          admin: {
            width: '50%',
          },
          label: 'Label',
          required: true,
        },
      ],
    })
  } else {
    linkResult.fields = [...linkResult.fields, ...linkTypes]
  }

  if (appearances !== false) {
    const appearanceOptionsToUse = appearances
      ? appearances.map((appearance) => appearanceOptions[appearance])
      : [appearanceOptions.default, appearanceOptions.outline]

    linkResult.fields.push({
      name: 'appearance',
      type: 'select',
      admin: {
        description: 'Choose how the link should be rendered.',
      },
      defaultValue: 'default',
      options: appearanceOptionsToUse,
    })
  }

  // The template deep-merges; the only overrides it passes are an `admin.condition`.
  return {
    ...linkResult,
    ...overrides,
    admin: { ...linkResult.admin, ...overrides.admin },
  } as GroupField
}
