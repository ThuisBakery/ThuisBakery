'use client'

import { useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from 'react'

import { BUTTON, FIELD, FILE_FIELD, INLINE_LINK } from '@/components/site/pressable'
import { DICTIONARY } from '@/domain/dictionary'
import {
  MAX_QUANTITY,
  type EnquiryField,
  type EnquiryProblem,
  type EnquiryProblems,
} from '@/domain/enquiry'
import { MAX_PHOTO_BYTES } from '@/domain/inspiration-photo'
import { leadTimeOf, type CalendarDate, type StoredLeadTime } from '@/domain/lead-time'
import {
  amsterdamArrival,
  closedUntilDate,
  earliestPickupDate,
  formatCalendarDate,
  formatDisplayDate,
  isClosed,
} from '@/domain/pickup-date'
import { pagePath, type Locale } from '@/domain/routes'
import {
  ENQUIRY_ENDPOINT,
  HONEYPOT_FIELD,
  PHOTO_FIELD,
  type EnquiryReply,
  type Receipt,
} from '@/domain/submit-enquiry'

import { keepReceipt } from './receipt-storage'

/**
 * What every Enquiry form shares — the one on an Item page and the two Estimate-free ones on
 * Custom order and Contact: sending, the Requested pickup date, the Inspiration photo, how to
 * reach the customer, and telling them what is wrong. One behaviour, so the three forms
 * cannot drift apart in how they treat a customer.
 */

/**
 * Sends an Enquiry as a form, with the downscaled Inspiration photo if there is one. BotID
 * attaches its challenge to this request (`instrumentation-client.ts`). Anything that is not
 * a reply the route could have written is a failure — a refusal from BotID included.
 */
export const postEnquiry = async (
  body: Record<string, unknown>,
  photo: Blob | null,
): Promise<EnquiryReply> => {
  const form = new FormData()

  for (const [key, value] of Object.entries(body)) {
    form.append(key, String(value))
  }

  if (photo) {
    form.append(PHOTO_FIELD, photo, 'inspiration.jpg')
  }

  try {
    const response = await fetch(ENQUIRY_ENDPOINT, { method: 'POST', body: form })
    const reply = (await response.json()) as Partial<EnquiryReply> | null

    return reply?.status === 'accepted' || reply?.status === 'invalid'
      ? (reply as EnquiryReply)
      : { status: 'failed' }
  } catch {
    return { status: 'failed' }
  }
}

/** Keeps the receipt for the confirmation page, then goes there. */
export const toConfirmation = (locale: Locale) => (receipt: Receipt | null) => {
  if (receipt) {
    keepReceipt(receipt)
  }

  window.location.assign(pagePath('enquirySent', locale))
}

export type Submit = (body: Record<string, unknown>, photo: Blob | null) => Promise<EnquiryReply>

/**
 * The page is static and built at deploy time, so "now" is only known in the browser. The
 * server snapshot is `null` — the built HTML carries no date that would be stale — and the
 * browser's is the current minute, which is as fine as the Lead time's cutoff ever needs.
 */
const subscribeToMinutes = (onChange: () => void) => {
  const timer = window.setInterval(onChange, 60_000)

  return () => window.clearInterval(timer)
}
const currentMinute = () => Math.floor(Date.now() / 60_000)
const noMinuteOnServer = () => null

/** The dates a Requested pickup date is held to, as the browser sees them now. */
export const useRequestedPickupCalendar = ({
  locale,
  leadTime,
  closedUntil,
}: {
  locale: Locale
  leadTime: StoredLeadTime | null
  closedUntil: string | null | undefined
}) => {
  const minute = useSyncExternalStore(subscribeToMinutes, currentMinute, noMinuteOnServer)
  const arrival = minute === null ? null : amsterdamArrival(new Date(minute * 60_000))
  const lead = leadTimeOf(leadTime)
  const until = closedUntilDate(closedUntil)
  const earliest = arrival
    ? earliestPickupDate({ arrival, leadTime: lead, closedUntil: until })
    : null
  // Before the browser knows the date, a set Closed until is assumed to be ahead.
  const closed = until !== null && (arrival ? isClosed(until, arrival.date) : true)

  return {
    earliest,
    until,
    closed,
    display: (date: CalendarDate) => formatDisplayDate(date, locale, arrival?.date),
    /** The rules `validateEnquiry` holds the date to. */
    rules: {
      arrival: arrival ?? amsterdamArrival(new Date()),
      leadTime: lead,
      closedUntil: until,
    },
  }
}

export type RequestedPickupCalendar = ReturnType<typeof useRequestedPickupCalendar>

/** Fields answered by choosing rather than typing: missing one reads "choose", not "fill in". */
const CHOICE_FIELDS: ReadonlySet<EnquiryField> = new Set(['size', 'sponge', 'filling'])

/**
 * Which problems a form shows, and where: a field's own once it has been left or the form
 * has been sent, and the server's as soon as they arrive. `order` is the fields in the order
 * they appear, which is the order problems are fixed in.
 */
export const useProblems = ({
  locale,
  order,
  own,
  calendar,
  formRef,
  datePicked = false,
}: {
  locale: Locale
  order: readonly EnquiryField[]
  /** What the form's own validation finds wrong right now. */
  own: EnquiryProblems
  calendar: RequestedPickupCalendar | null
  formRef: RefObject<HTMLFormElement | null>
  /** The date is picked from a calendar, not typed: missing, it reads "choose a date". */
  datePicked?: boolean
}) => {
  const words = DICTIONARY[locale].enquiry
  const [touched, setTouched] = useState<ReadonlySet<EnquiryField>>(new Set())
  const [attempted, setAttempted] = useState(false)
  const [serverProblems, setServerProblems] = useState<EnquiryProblems>({})

  const problems: EnquiryProblems = { ...serverProblems }

  for (const field of order) {
    const problem = own[field]

    if (problem && (attempted || touched.has(field))) {
      problems[field] = problem
    }
  }

  const message = (field: EnquiryField, problem: EnquiryProblem): string => {
    const { earliest, until, display } = calendar ?? {}

    switch (problem) {
      case 'required':
        if (datePicked && field === 'requestedPickupDate') {
          return words.problems.invalidDate
        }

        return CHOICE_FIELDS.has(field) ? words.problems.unknownChoice : words.problems.required
      case 'invalidQuantity':
        return words.problems.invalidQuantity(MAX_QUANTITY)
      case 'tooSoon':
        return words.problems.tooSoon(earliest && display ? display(earliest) : null)
      case 'closed':
        return words.problems.closed(until && display ? display(until) : null)
      default:
        return words.problems[problem]
    }
  }

  const touch = (field: EnquiryField) => setTouched((current) => new Set(current).add(field))

  const focusFirst = (found: EnquiryProblems) => {
    const field = order.find((each) => found[each])

    if (field) {
      // A choice is focused on the option already chosen, where the arrow keys start from,
      // else on the first that can be chosen: a calendar's blocked days cannot take focus.
      const form = formRef.current
      const target =
        form?.querySelector<HTMLElement>(`[name="${field}"]:checked`) ??
        form?.querySelector<HTMLElement>(`[name="${field}"]:not(:disabled)`)

      target?.focus()
    }
  }

  const fieldProps: FieldProps = (field, describedBy = []) => {
    const problem = problems[field]
    const ids = [...describedBy, ...(problem ? [`enquiry-${field}-problem`] : [])]

    return {
      id: `enquiry-${field}`,
      name: field,
      'aria-invalid': problem ? true : undefined,
      'aria-describedby': ids.length > 0 ? ids.join(' ') : undefined,
      onBlur: () => touch(field),
    }
  }

  const problemFor = (field: EnquiryField) => {
    const problem = problems[field]

    return problem ? (
      <p id={`enquiry-${field}-problem`} className="mt-1.5 text-sm font-medium text-ink">
        {message(field, problem)}
      </p>
    ) : null
  }

  return {
    problems,
    attempted,
    /** A send was tried: every problem shows from now on. */
    attempt: () => setAttempted(true),
    touch,
    /** The server's problem with a field is gone once the customer changes it. */
    clearServerProblem: (field: EnquiryField) =>
      setServerProblems(({ [field]: _, ...rest }) => rest),
    showServerProblems: (found: EnquiryProblems) => {
      setServerProblems(found)
      focusFirst(found)
    },
    focusFirst,
    fieldProps,
    problemFor,
  }
}

export type FieldProps = (
  field: EnquiryField,
  describedBy?: string[],
) => {
  id: string
  name: string
  'aria-invalid': boolean | undefined
  'aria-describedby': string | undefined
  onBlur: () => void
}

/** The Inspiration photo as it will be sent — already downscaled — or what is wrong with it. */
export const usePhoto = ({
  downscale,
  onChoose,
}: {
  /** Shrinks a chosen photo before it is sent. Throws when the file is not one. */
  downscale: (file: File) => Promise<Blob>
  /** Called whenever the customer chooses or removes a photo. */
  onChoose: () => void
}) => {
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [issue, setIssue] = useState<EnquiryProblem | null>(null)
  const [reading, setReading] = useState(false)

  const choose = async (file: File | undefined) => {
    onChoose()
    setPhoto(null)
    setIssue(null)

    if (!file) {
      return
    }

    setReading(true)

    try {
      const downscaled = await downscale(file)

      if (downscaled.size > MAX_PHOTO_BYTES) {
        setIssue('tooLarge')
      } else {
        setPhoto(downscaled)
      }
    } catch {
      setIssue('notAnImage')
    } finally {
      setReading(false)
    }
  }

  return { photo, issue, reading, choose }
}

export type Photo = ReturnType<typeof usePhoto>

export const INPUT = `mt-2 ${FIELD}`

export const LEGEND = 'font-sans text-[13px] tracking-wide text-ink-muted'

/** Jana's notice that she is closed, and until when, while Closed until is ahead. */
export const ClosedNotice = ({
  locale,
  calendar,
  notice,
}: {
  locale: Locale
  calendar: RequestedPickupCalendar
  notice: string | null | undefined
}) =>
  calendar.closed && calendar.until ? (
    <div className="border-l-2 border-accent bg-raised px-4 py-3 text-sm leading-relaxed">
      {notice ? <p className="font-display text-lg">{notice}</p> : null}
      <p>{DICTIONARY[locale].enquiry.closedUntil(calendar.display(calendar.until))}</p>
    </div>
  ) : null

export const RequestedPickupDateField = ({
  locale,
  calendar,
  value,
  onChange,
  fieldProps,
  problem,
}: {
  locale: Locale
  calendar: RequestedPickupCalendar
  value: string
  onChange: (value: string) => void
  fieldProps: FieldProps
  problem: ReactNode
}) => {
  const words = DICTIONARY[locale].enquiry
  const { earliest, display } = calendar

  return (
    <div>
      <label htmlFor="enquiry-requestedPickupDate" className={LEGEND}>
        {words.requestedPickupDate}
      </label>
      <input
        {...fieldProps('requestedPickupDate', ['enquiry-requestedPickupDate-hint'])}
        type="date"
        min={earliest ? formatCalendarDate(earliest) : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${INPUT} max-w-60`}
      />
      <div id="enquiry-requestedPickupDate-hint" className="mt-1.5 text-sm text-ink-muted">
        {earliest ? <p>{words.earliest(display(earliest))}</p> : null}
        <p>{words.requestedPickupDateHint}</p>
      </div>
      {problem}
    </div>
  )
}

export const PhotoField = ({
  locale,
  photo,
  fieldProps,
  problem,
}: {
  locale: Locale
  photo: Photo
  fieldProps: FieldProps
  problem: ReactNode
}) => {
  const words = DICTIONARY[locale].enquiry
  const ref = useRef<HTMLInputElement>(null)

  const remove = () => {
    if (ref.current) {
      ref.current.value = ''
    }

    void photo.choose(undefined)
  }

  return (
    <div>
      <label htmlFor="enquiry-photo" className={LEGEND}>
        {words.photo}
      </label>
      <input
        {...fieldProps('photo', ['enquiry-photo-hint'])}
        ref={ref}
        type="file"
        accept="image/*"
        onChange={(event) => void photo.choose(event.target.files?.[0])}
        className={`mt-2 ${FILE_FIELD}`}
      />
      <p id="enquiry-photo-hint" className="mt-1.5 text-sm text-ink-muted">
        {words.photoHint}
      </p>
      {photo.photo ? (
        <button type="button" onClick={remove} className={`mt-2 min-h-11 text-sm ${INLINE_LINK}`}>
          {words.removePhoto}
        </button>
      ) : null}
      {problem}
    </div>
  )
}

/** How to reach the customer: the name, email and optional phone every form asks for. */
export type ContactValues = { name: string; email: string; phone: string }

export const ContactFields = ({
  locale,
  values,
  onChange,
  fieldProps,
  problemFor,
}: {
  locale: Locale
  values: ContactValues
  onChange: (field: keyof ContactValues, value: string) => void
  fieldProps: FieldProps
  problemFor: (field: EnquiryField) => ReactNode
}) => {
  const words = DICTIONARY[locale].enquiry

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <TextField
        field="name"
        label={words.name}
        autoComplete="name"
        value={values.name}
        onChange={(value) => onChange('name', value)}
        fieldProps={fieldProps}
        problem={problemFor('name')}
      />
      <TextField
        field="email"
        label={words.email}
        type="email"
        autoComplete="email"
        value={values.email}
        onChange={(value) => onChange('email', value)}
        fieldProps={fieldProps}
        problem={problemFor('email')}
      />
      <TextField
        field="phone"
        label={words.phone}
        type="tel"
        autoComplete="tel"
        value={values.phone}
        onChange={(value) => onChange('phone', value)}
        fieldProps={fieldProps}
        problem={problemFor('phone')}
      />
    </div>
  )
}

const TextField = ({
  field,
  label,
  type = 'text',
  autoComplete,
  value,
  onChange,
  fieldProps,
  problem,
}: {
  field: EnquiryField
  label: string
  type?: 'text' | 'email' | 'tel'
  autoComplete: string
  value: string
  onChange: (value: string) => void
  fieldProps: FieldProps
  problem: ReactNode
}) => (
  <div>
    <label htmlFor={`enquiry-${field}`} className={LEGEND}>
      {label}
    </label>
    <input
      {...fieldProps(field)}
      type={type}
      autoComplete={autoComplete}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={INPUT}
    />
    {problem}
  </div>
)

/** A field no person sees or reaches. Anything typed into it is a bot's. */
export const Honeypot = ({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) => (
  <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
    <label>
      Website
      <input
        type="text"
        name={HONEYPOT_FIELD}
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  </div>
)

/**
 * The foot of a form: a failure on our side, owned as ours with a direct route to Jana; or,
 * when a send was stopped by the customer's own mistakes, a pointer to them; then the button.
 */
export const SendFooter = ({
  locale,
  status,
  hasProblems,
  busy,
  contactHref,
  send,
}: {
  locale: Locale
  status: 'idle' | 'sending' | 'failed'
  /** A send was tried and there is something to fix. */
  hasProblems: boolean
  /** The button waits: sending, or a photo still being read. */
  busy: boolean
  /** Where to get in touch directly when sending fails. */
  contactHref: string
  /** The button's words. */
  send: string
}) => {
  const words = DICTIONARY[locale].enquiry

  return (
    <>
      {status === 'failed' ? (
        <div role="alert" className="border-l-2 border-ink px-4 py-2 text-sm leading-relaxed">
          <p>{words.failed}</p>
          <a href={contactHref} className={INLINE_LINK}>
            {words.contactDirectly}
          </a>
        </div>
      ) : hasProblems ? (
        <p role="alert" className="border-l-2 border-ink px-4 py-2 text-sm">
          {words.checkFields}
        </p>
      ) : null}

      <div>
        <button type="submit" disabled={busy} className={BUTTON}>
          {status === 'sending' ? words.sending : send}
        </button>
      </div>
    </>
  )
}
