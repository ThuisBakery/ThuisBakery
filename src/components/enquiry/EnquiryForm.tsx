'use client'

import { useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from 'react'

import { DICTIONARY } from '@/domain/dictionary'
import {
  MAX_QUANTITY,
  isQuantity,
  validateEnquiry,
  type EnquiryField,
  type EnquiryProblem,
  type EnquiryProblems,
  type ItemOffer,
} from '@/domain/enquiry'
import { estimate } from '@/domain/estimate'
import { MAX_PHOTO_BYTES } from '@/domain/inspiration-photo'
import { leadTimeOf, type CalendarDate, type StoredLeadTime } from '@/domain/lead-time'
import { formatEuros } from '@/domain/menu'
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

import { downscalePhoto } from './downscale-photo'
import { EstimateSummary } from './EstimateSummary'
import { keepReceipt } from './receipt-storage'

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
const toConfirmation = (locale: Locale) => (receipt: Receipt | null) => {
  if (receipt) {
    keepReceipt(receipt)
  }

  window.location.assign(pagePath('enquirySent', locale))
}

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

type Values = {
  size: string
  quantity: string
  sponge: string
  filling: string
  requestedPickupDate: string
  specialRequests: string
  name: string
  email: string
  phone: string
  [HONEYPOT_FIELD]: string
}

/** The fields in the order they appear, which is the order problems are fixed in. */
const FIELD_ORDER: readonly EnquiryField[] = [
  'size',
  'quantity',
  'sponge',
  'filling',
  'requestedPickupDate',
  'specialRequests',
  'photo',
  'name',
  'email',
  'phone',
]

/** Fields answered by choosing rather than typing: missing one reads "choose", not "fill in". */
const CHOICE_FIELDS: ReadonlySet<EnquiryField> = new Set(['size', 'sponge', 'filling'])

const INPUT =
  'mt-2 block min-h-12 w-full border border-rule bg-raised px-3 py-2 text-base text-ink aria-[invalid=true]:border-2 aria-[invalid=true]:border-ink'

const LEGEND = 'font-sans text-[13px] tracking-wide text-ink-muted'

/**
 * The Enquiry form on an Item page: Size, quantity, Sponge and Filling with a running
 * Estimate, a Requested pickup date held to the Lead time and Closed until, Special requests,
 * and how to reach the customer.
 *
 * It validates with the same function the route handler does, so the customer is told what
 * is wrong before anything is sent — and the server still decides. Takes the Item's offer as
 * plain data, so a test renders it with no network and no Payload.
 */
export const EnquiryForm = ({
  locale,
  offer,
  leadTime,
  closedUntil,
  closedNotice,
  contactPath,
  submit = postEnquiry,
  downscale = downscalePhoto,
  onSent,
}: {
  locale: Locale
  offer: ItemOffer
  /** The Lead time this Item is held to: its override, else the site's. */
  leadTime: StoredLeadTime | null
  /** The Closed until global's date, as stored. */
  closedUntil: string | null | undefined
  /** What Jana wrote to say she is closed, in this locale. */
  closedNotice: string | null | undefined
  /** Where to get in touch directly when sending fails. */
  contactPath: string
  submit?: (body: Record<string, unknown>, photo: Blob | null) => Promise<EnquiryReply>
  /** Shrinks a chosen photo before it is sent. Throws when the file is not one. */
  downscale?: (file: File) => Promise<Blob>
  onSent?: (receipt: Receipt | null) => void
}) => {
  const words = DICTIONARY[locale].enquiry
  const itemWords = DICTIONARY[locale].item
  const formRef = useRef<HTMLFormElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  const [values, setValues] = useState<Values>({
    size: offer.sizes[0]?.id ?? '',
    quantity: '1',
    sponge: '',
    filling: '',
    requestedPickupDate: '',
    specialRequests: '',
    name: '',
    email: '',
    phone: '',
    [HONEYPOT_FIELD]: '',
  })
  // The quantity the Estimate shows: the last whole number typed, so clearing the field to
  // retype it does not blank the figure.
  const [estimateQuantity, setEstimateQuantity] = useState(1)
  const [touched, setTouched] = useState<ReadonlySet<EnquiryField>>(new Set())
  const [attempted, setAttempted] = useState(false)
  const [serverProblems, setServerProblems] = useState<EnquiryProblems>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'failed'>('idle')
  // The photo as it will be sent — already downscaled — or what is wrong with the one chosen.
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [photoIssue, setPhotoIssue] = useState<EnquiryProblem | null>(null)
  const [readingPhoto, setReadingPhoto] = useState(false)

  const minute = useSyncExternalStore(subscribeToMinutes, currentMinute, noMinuteOnServer)
  const arrival = minute === null ? null : amsterdamArrival(new Date(minute * 60_000))
  const lead = leadTimeOf(leadTime)
  const until = closedUntilDate(closedUntil)
  const earliest = arrival
    ? earliestPickupDate({ arrival, leadTime: lead, closedUntil: until })
    : null
  // Before the browser knows the date, a set Closed until is assumed to be ahead.
  const closed = until !== null && (arrival ? isClosed(until, arrival.date) : true)

  const display = (date: CalendarDate) => formatDisplayDate(date, locale, arrival?.date)

  const validate = (current: Values) =>
    validateEnquiry(
      { enquiryType: 'item', ...current },
      {
        item: offer,
        pickup: {
          arrival: arrival ?? amsterdamArrival(new Date()),
          leadTime: lead,
          closedUntil: until,
        },
      },
    )

  const validation = validate(values)
  const ownProblems: EnquiryProblems = {
    ...(validation.ok ? {} : validation.problems),
    ...(photoIssue ? { photo: photoIssue } : {}),
  }
  const problems: EnquiryProblems = { ...serverProblems }

  for (const field of FIELD_ORDER) {
    const problem = ownProblems[field]

    if (problem && (attempted || touched.has(field))) {
      problems[field] = problem
    }
  }

  const message = (field: EnquiryField, problem: EnquiryProblem): string => {
    switch (problem) {
      case 'required':
        return CHOICE_FIELDS.has(field) ? words.problems.unknownChoice : words.problems.required
      case 'invalidQuantity':
        return words.problems.invalidQuantity(MAX_QUANTITY)
      case 'tooSoon':
        return words.problems.tooSoon(earliest ? display(earliest) : null)
      case 'closed':
        return words.problems.closed(until ? display(until) : null)
      default:
        return words.problems[problem]
    }
  }

  const change = (field: keyof Values, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setServerProblems(({ [field as EnquiryField]: _, ...rest }) => rest)

    if (field === 'quantity') {
      const count = Number(value)

      if (value.trim() !== '' && isQuantity(count)) {
        setEstimateQuantity(count)
      }
    }
  }

  const choosePhoto = async (file: File | undefined) => {
    setServerProblems(({ photo: _, ...rest }) => rest)
    setPhoto(null)
    setPhotoIssue(null)
    touch('photo')

    if (!file) {
      return
    }

    setReadingPhoto(true)

    try {
      const downscaled = await downscale(file)

      if (downscaled.size > MAX_PHOTO_BYTES) {
        setPhotoIssue('tooLarge')
      } else {
        setPhoto(downscaled)
      }
    } catch {
      setPhotoIssue('notAnImage')
    } finally {
      setReadingPhoto(false)
    }
  }

  const removePhoto = () => {
    if (photoRef.current) {
      photoRef.current.value = ''
    }

    void choosePhoto(undefined)
  }

  const touch = (field: EnquiryField) => setTouched((current) => new Set(current).add(field))

  const focusFirst = (found: EnquiryProblems) => {
    const field = FIELD_ORDER.find((each) => found[each])

    if (field) {
      formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus()
    }
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAttempted(true)

    const checked = validate(values)

    if (!checked.ok || photoIssue) {
      focusFirst({
        ...(checked.ok ? {} : checked.problems),
        ...(photoIssue ? { photo: photoIssue } : {}),
      })
      return
    }

    setStatus('sending')

    const reply = await submit({ enquiryType: 'item', locale, item: offer.id, ...values }, photo)

    if (reply.status === 'accepted') {
      // Stays "sending" while the confirmation page loads, so it cannot be sent twice.
      ;(onSent ?? toConfirmation(locale))(reply.receipt)
    } else if (reply.status === 'invalid') {
      setServerProblems(reply.problems)
      setStatus('idle')
      focusFirst(reply.problems)
    } else {
      setStatus('failed')
    }
  }

  const size = offer.sizes.find((each) => each.id === values.size)
  const filling = offer.fillings.find((each) => String(each.id) === values.filling) ?? null
  const figure = size ? estimate({ size, quantity: estimateQuantity, filling }) : null

  const hasProblems = Object.keys(problems).length > 0

  const fieldProps = (field: EnquiryField, describedBy: string[] = []) => {
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

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="relative mt-6 grid gap-8">
      {closed && until ? (
        <div className="border-l-2 border-accent bg-raised px-4 py-3 text-sm leading-relaxed">
          {closedNotice ? <p className="font-display text-lg">{closedNotice}</p> : null}
          <p>{words.closedUntil(display(until))}</p>
        </div>
      ) : null}

      {offer.sizes.length > 1 ? (
        <Choice
          field="size"
          legend={words.size}
          options={offer.sizes.map(({ id, label, price }) => ({
            value: id,
            label,
            aside: formatEuros(price, locale),
          }))}
          value={values.size}
          onChange={(value) => change('size', value)}
          fieldProps={fieldProps}
          problem={problemFor('size')}
        />
      ) : (
        <input type="hidden" name="size" value={values.size} />
      )}

      <div>
        <label htmlFor="enquiry-quantity" className={LEGEND}>
          {words.quantity}
        </label>
        <input
          {...fieldProps('quantity')}
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_QUANTITY}
          step={1}
          value={values.quantity}
          onChange={(event) => change('quantity', event.target.value)}
          className={`${INPUT} max-w-32`}
        />
        {problemFor('quantity')}
      </div>

      {offer.sponges.length > 0 ? (
        <Choice
          field="sponge"
          legend={itemWords.sponge}
          options={offer.sponges.map(({ id, name }) => ({ value: String(id), label: name }))}
          value={values.sponge}
          onChange={(value) => change('sponge', value)}
          fieldProps={fieldProps}
          problem={problemFor('sponge')}
        />
      ) : null}

      {offer.fillings.length > 0 ? (
        <Choice
          field="filling"
          legend={itemWords.filling}
          options={offer.fillings.map(({ id, name, surcharge }) => ({
            value: String(id),
            label: name,
            aside:
              typeof surcharge === 'number' && surcharge > 0
                ? `+${formatEuros(surcharge, locale)}`
                : undefined,
          }))}
          value={values.filling}
          onChange={(value) => change('filling', value)}
          fieldProps={fieldProps}
          problem={problemFor('filling')}
        />
      ) : null}

      {figure ? (
        <EstimateSummary locale={locale} estimate={figure} id="enquiry-estimate" live />
      ) : null}

      <div>
        <label htmlFor="enquiry-requestedPickupDate" className={LEGEND}>
          {words.requestedPickupDate}
        </label>
        <input
          {...fieldProps('requestedPickupDate', ['enquiry-requestedPickupDate-hint'])}
          type="date"
          min={earliest ? formatCalendarDate(earliest) : undefined}
          value={values.requestedPickupDate}
          onChange={(event) => change('requestedPickupDate', event.target.value)}
          className={`${INPUT} max-w-60`}
        />
        <div id="enquiry-requestedPickupDate-hint" className="mt-1.5 text-sm text-ink-muted">
          {earliest ? <p>{words.earliest(display(earliest))}</p> : null}
          <p>{words.requestedPickupDateHint}</p>
        </div>
        {problemFor('requestedPickupDate')}
      </div>

      <div>
        <label htmlFor="enquiry-specialRequests" className={LEGEND}>
          {words.specialRequests}
        </label>
        <textarea
          {...fieldProps('specialRequests', ['enquiry-specialRequests-hint'])}
          rows={4}
          value={values.specialRequests}
          onChange={(event) => change('specialRequests', event.target.value)}
          className={INPUT}
        />
        <p id="enquiry-specialRequests-hint" className="mt-1.5 text-sm text-ink-muted">
          {words.specialRequestsHint}
        </p>
        {problemFor('specialRequests')}
      </div>

      <div>
        <label htmlFor="enquiry-photo" className={LEGEND}>
          {words.photo}
        </label>
        <input
          {...fieldProps('photo', ['enquiry-photo-hint'])}
          ref={photoRef}
          type="file"
          accept="image/*"
          onChange={(event) => void choosePhoto(event.target.files?.[0])}
          className="mt-2 block w-full text-sm file:mr-3 file:min-h-11 file:border file:border-rule file:bg-raised file:px-4 file:py-2 file:text-ink"
        />
        <p id="enquiry-photo-hint" className="mt-1.5 text-sm text-ink-muted">
          {words.photoHint}
        </p>
        {photo ? (
          <button
            type="button"
            onClick={removePhoto}
            className="mt-2 text-sm underline underline-offset-4 hover:text-accent"
          >
            {words.removePhoto}
          </button>
        ) : null}
        {problemFor('photo')}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <TextField
          field="name"
          label={words.name}
          autoComplete="name"
          value={values.name}
          onChange={(value) => change('name', value)}
          fieldProps={fieldProps}
          problem={problemFor('name')}
        />
        <TextField
          field="email"
          label={words.email}
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(value) => change('email', value)}
          fieldProps={fieldProps}
          problem={problemFor('email')}
        />
        <TextField
          field="phone"
          label={words.phone}
          type="tel"
          autoComplete="tel"
          value={values.phone}
          onChange={(value) => change('phone', value)}
          fieldProps={fieldProps}
          problem={problemFor('phone')}
        />
      </div>

      {/* A field no person sees or reaches. Anything typed into it is a bot's. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input
            type="text"
            name={HONEYPOT_FIELD}
            tabIndex={-1}
            autoComplete="off"
            value={values[HONEYPOT_FIELD]}
            onChange={(event) => change(HONEYPOT_FIELD, event.target.value)}
          />
        </label>
      </div>

      {status === 'failed' ? (
        <div role="alert" className="border-l-2 border-ink px-4 py-2 text-sm leading-relaxed">
          <p>{words.failed}</p>
          <a href={contactPath} className="underline underline-offset-4 hover:text-accent">
            {words.contactDirectly}
          </a>
        </div>
      ) : attempted && hasProblems ? (
        <p role="alert" className="border-l-2 border-ink px-4 py-2 text-sm">
          {words.checkFields}
        </p>
      ) : null}

      <div>
        <button
          type="submit"
          disabled={status === 'sending' || readingPhoto}
          className="min-h-12 bg-accent px-8 py-3.5 text-sm tracking-wide text-accent-ink motion-safe:transition-transform motion-safe:duration-200 motion-safe:active:translate-y-px disabled:opacity-60"
        >
          {status === 'sending' ? words.sending : words.send}
        </button>
      </div>
    </form>
  )
}

type FieldProps = (
  field: EnquiryField,
  describedBy?: string[],
) => {
  id: string
  name: string
  'aria-invalid': boolean | undefined
  'aria-describedby': string | undefined
  onBlur: () => void
}

/**
 * One choice from a few — a Size, Sponge or Filling — as radio buttons. The label is the
 * option's name alone; a price or Surcharge sits beside it as its description.
 */
const Choice = ({
  field,
  legend,
  options,
  value,
  onChange,
  fieldProps,
  problem,
}: {
  field: EnquiryField
  legend: string
  options: { value: string; label: string; aside?: string | undefined }[]
  value: string
  onChange: (value: string) => void
  fieldProps: FieldProps
  problem: ReactNode
}) => {
  const { name, onBlur, 'aria-invalid': invalid } = fieldProps(field)

  return (
    <fieldset
      aria-invalid={invalid}
      aria-describedby={problem ? `enquiry-${field}-problem` : undefined}
    >
      <legend className={LEGEND}>{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const id = `enquiry-${field}-${option.value}`

          return (
            <div key={option.value} className="relative">
              <input
                type="radio"
                id={id}
                name={name}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                onBlur={onBlur}
                aria-describedby={option.aside ? `${id}-aside` : undefined}
                className="peer absolute inset-0 opacity-0"
              />
              <div className="flex min-h-11 items-center gap-1.5 border border-rule px-3 py-2 text-sm peer-checked:border-ink peer-checked:bg-ink peer-checked:text-ground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
                <label htmlFor={id} className="cursor-pointer">
                  {option.label}
                </label>
                {option.aside ? (
                  <span id={`${id}-aside`} className="tabular-nums opacity-75">
                    {option.aside}
                  </span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
      {problem}
    </fieldset>
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
