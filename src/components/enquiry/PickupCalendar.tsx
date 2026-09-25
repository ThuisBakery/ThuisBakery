'use client'

import { useState, type ReactNode } from 'react'

import { DAY, ICON_BUTTON } from '@/components/site/pressable'
import { DICTIONARY } from '@/domain/dictionary'
import type { CalendarDate } from '@/domain/lead-time'
import {
  calendarMonth,
  formatCalendarDate,
  formatMonth,
  isMonthAfter,
  parseCalendarDate,
  pickupDateProblem,
  shiftMonth,
  weekdayNames,
  type CalendarMonth,
} from '@/domain/pickup-date'
import type { Locale } from '@/domain/routes'

import { LEGEND, type FieldProps, type RequestedPickupCalendar } from './form-parts'

const monthOf = ({ year, month }: CalendarDate): CalendarMonth => ({ year, month })

/**
 * The Requested pickup date, picked from a month calendar. A day inside the Lead time, or
 * before Closed until, is blocked: it is shown, struck through, and cannot be chosen, so the
 * customer can only ask for a date Jana can do. The route handler still decides.
 *
 * Every day is a radio in one group, named in full for a screen reader ("Thursday 24
 * September"), so the arrow keys walk the days that can be chosen. It opens on the month of
 * the chosen date, else of the earliest one, and cannot page back before that month.
 *
 * The page is built ahead of time, so today is only known in the browser: until it is, the
 * calendar shows nothing to choose from.
 */
export const PickupCalendar = ({
  locale,
  calendar,
  value,
  onChange,
  fieldProps,
  problem,
}: {
  locale: Locale
  calendar: RequestedPickupCalendar
  /** The chosen date, `YYYY-MM-DD`, or empty. */
  value: string
  onChange: (value: string) => void
  fieldProps: FieldProps
  problem: ReactNode
}) => {
  const words = DICTIONARY[locale].enquiry
  const { earliest, display, rules } = calendar
  const [paged, setPaged] = useState<CalendarMonth | null>(null)
  const hintId = 'enquiry-requestedPickupDate-hint'
  const field = fieldProps('requestedPickupDate', [hintId])

  const chosen = parseCalendarDate(value)
  const month = earliest ? (paged ?? monthOf(chosen ?? earliest)) : null
  const atFirst = !month || !earliest || !isMonthAfter(month, monthOf(earliest))

  return (
    <fieldset aria-invalid={field['aria-invalid']} aria-describedby={field['aria-describedby']}>
      <legend className={LEGEND}>{words.requestedPickupDate}</legend>

      {month ? (
        <div className="mt-2 max-w-sm rounded-card border border-rule bg-raised p-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label={words.previousMonth}
              aria-disabled={atFirst || undefined}
              onClick={() => (atFirst ? undefined : setPaged(shiftMonth(month, -1)))}
              className={ICON_BUTTON}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <p aria-live="polite" className="font-medium">
              {formatMonth(month, locale)}
            </p>
            <button
              type="button"
              aria-label={words.nextMonth}
              onClick={() => setPaged(shiftMonth(month, 1))}
              className={ICON_BUTTON}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>

          <Days
            locale={locale}
            month={month}
            value={value}
            onChange={onChange}
            name={field.name}
            onBlur={field.onBlur}
            label={display}
            blocked={(day) => pickupDateProblem(day, rules) !== null}
          />
        </div>
      ) : null}

      <div id={hintId} className="mt-2 text-sm text-ink-muted">
        {earliest ? <p>{words.earliest(display(earliest))}</p> : null}
        <p>{words.requestedPickupDateHint}</p>
      </div>
      {problem}
    </fieldset>
  )
}

const Days = ({
  locale,
  month,
  value,
  onChange,
  name,
  onBlur,
  label,
  blocked,
}: {
  locale: Locale
  month: CalendarMonth
  value: string
  onChange: (value: string) => void
  name: string
  onBlur: () => void
  label: (date: CalendarDate) => string
  blocked: (date: CalendarDate) => boolean
}) => {
  const { leadingBlanks, days } = calendarMonth(month)

  return (
    <div className="mt-2 grid grid-cols-7 gap-0.5 text-center">
      {weekdayNames(locale).map((weekday) => (
        <span key={weekday} aria-hidden="true" className="py-1 text-xs text-ink-muted">
          {weekday}
        </span>
      ))}
      {Array.from({ length: leadingBlanks }, (_, index) => (
        <span key={`blank-${index}`} aria-hidden="true" />
      ))}
      {days.map((day) => {
        const date = formatCalendarDate(day)

        return (
          <div key={date} className="relative">
            <input
              type="radio"
              id={`enquiry-requestedPickupDate-${date}`}
              name={name}
              value={date}
              checked={value === date}
              disabled={blocked(day)}
              aria-label={label(day)}
              onChange={() => onChange(date)}
              onBlur={onBlur}
              className="peer absolute inset-0 z-10 opacity-0"
            />
            <span aria-hidden="true" className={DAY}>
              {day.day}
            </span>
          </div>
        )
      })}
    </div>
  )
}
