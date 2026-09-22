import type { Field, NumberFieldSingleValidation, TextFieldSingleValidation } from 'payload'

import { parseTimeOfDay } from '@/domain/lead-time'

/**
 * Lead time is a number of days **and** a time of day — the pair, never the days alone
 * (CONTEXT.md). It is set site-wide on the Lead time global and overridable per Item, so
 * the pair is declared once here and used in both places: one field pair, one set of
 * messages, one definition of what a valid time looks like.
 *
 * `required` is what differs between the two. The site-wide Lead time must always have a
 * value; an Item's override must be all or nothing, which `leadTimePairing` below
 * enforces at the document level. Field-level `validate` alone cannot: Payload does not
 * re-run a sibling's validator when only the other field changes, so clearing the days
 * while a time remained would otherwise slip through.
 */

const TIME_FORMAT_MESSAGE = 'Use a 24-hour time, such as 17:00.'

export const PAIRING_MESSAGE =
  'Lead time is a number of days and a time of day together. Set both, or clear both.'

export const leadTimeFields = ({ required }: { required: boolean }): Field[] => [
  {
    name: 'days',
    type: 'number',
    required,
    min: 0,
    label: 'Days',
    ...(required ? { defaultValue: 3 } : {}),
    admin: {
      description: 'Whole days of notice an Enquiry must give.',
      width: '50%',
    },
    validate: ((value) =>
      !required || typeof value === 'number'
        ? true
        : 'A number of days is required.') satisfies NumberFieldSingleValidation,
  },
  {
    name: 'timeOfDay',
    type: 'text',
    required,
    label: 'Time of day (24-hour, Europe/Amsterdam)',
    ...(required ? { defaultValue: '17:00' } : {}),
    admin: {
      description:
        'The time by which an Enquiry must arrive to count as arriving that day. The other half of the Lead time — an Enquiry sent after it has missed the day it was sent on.',
      placeholder: '17:00',
      width: '50%',
    },
    validate: ((value) => {
      if (typeof value !== 'string' || value === '') {
        return required ? 'A time of day is required.' : true
      }

      return parseTimeOfDay(value) === null ? TIME_FORMAT_MESSAGE : true
    }) satisfies TextFieldSingleValidation,
  },
]
