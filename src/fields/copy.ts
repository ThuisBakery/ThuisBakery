import type { Field } from 'payload'

/**
 * The fields a page-content singleton (ADR-0003) is written in: Jana fills the sections of a
 * coded page, and the layout stays in code. Shared by the Homepage, About, Contact, Custom
 * order and Privacy globals so each reads the same in the admin.
 */

type CopyOptions = { optional?: boolean; width?: string }

/** A localized line of copy. */
export const words = (name: string, description: string, options: CopyOptions = {}): Field => ({
  name,
  type: 'text',
  required: !options.optional,
  localized: true,
  admin: { description, ...(options.width ? { width: options.width } : {}) },
})

/** A localized paragraph of copy. */
export const paragraph = (
  name: string,
  description: string,
  options: Pick<CopyOptions, 'optional'> = {},
): Field => ({
  name,
  type: 'textarea',
  required: !options.optional,
  localized: true,
  admin: { description },
})

/** A photograph from Media, placed by its focal point. */
export const photograph = (description: string): Field => ({
  name: 'photograph',
  type: 'upload',
  relationTo: 'media',
  admin: {
    description: `${description} Set its focal point on the photograph itself, so the subject stays in frame when the page crops it.`,
  },
})

/** A heading and a list of questions with their answers. */
export const questions = (headingDescription: string): Field => ({
  name: 'faq',
  type: 'group',
  label: 'Questions',
  fields: [
    words('heading', headingDescription),
    {
      name: 'questions',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Question', plural: 'Questions' },
      fields: [
        words('question', 'The question, as a customer would ask it.'),
        paragraph('answer', 'The answer.'),
      ],
    },
  ],
})
