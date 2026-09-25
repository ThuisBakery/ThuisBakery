'use client'

import type { ReactNode } from 'react'

import { ICON_BUTTON } from '@/components/site/pressable'

import { LEGEND, type FieldProps } from './form-parts'

/**
 * A count chosen with minus and plus, never typed: how many of an Item. It cannot go below
 * `min` or above `max`, so there is nothing to mistype and nothing to correct. The figure is
 * an `output`, announced politely as it changes.
 */
export const Stepper = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  fewer,
  more,
  field,
  problem,
}: {
  label: string
  value: number
  min: number
  max: number
  /** How far one press moves the count. */
  step?: number
  onChange: (value: number) => void
  /** The minus and plus buttons' accessible names. */
  fewer: string
  more: string
  /** The count's field, as `useProblems` gives it, or as much of it as a count needs. */
  field: Pick<ReturnType<FieldProps>, 'id' | 'name' | 'aria-describedby'>
  /** What is wrong with the count; a count that is never validated has nothing here. */
  problem?: ReactNode
}) => {
  const atMin = value - step < min
  const atMax = value + step > max
  const labelId = `${field.id}-label`

  return (
    <div role="group" aria-labelledby={labelId} aria-describedby={field['aria-describedby']}>
      <div className="flex items-center justify-between gap-4">
        <span id={labelId} className={LEGEND}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={fewer}
            aria-disabled={atMin || undefined}
            onClick={() => (atMin ? undefined : onChange(value - step))}
            className={`${ICON_BUTTON} text-lg`}
          >
            <span aria-hidden="true">−</span>
          </button>
          <output
            id={field.id}
            name={field.name}
            tabIndex={-1}
            className="min-w-10 text-center text-lg font-semibold tabular-nums"
          >
            {value}
          </output>
          <button
            type="button"
            aria-label={more}
            aria-disabled={atMax || undefined}
            onClick={() => (atMax ? undefined : onChange(value + step))}
            className={`${ICON_BUTTON} text-lg`}
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
      </div>
      {problem}
    </div>
  )
}
