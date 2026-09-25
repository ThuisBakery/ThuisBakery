'use client'

import { useRef, useState, type FormEvent, type ReactNode } from 'react'

import { CHIP, CHOICE_CARD } from '@/components/site/pressable'
import { DICTIONARY } from '@/domain/dictionary'
import {
  MAX_QUANTITY,
  isQuantity,
  validateEnquiry,
  type EnquiryField,
  type ItemOffer,
} from '@/domain/enquiry'
import { estimate } from '@/domain/estimate'
import type { StoredLeadTime } from '@/domain/lead-time'
import { formatEuros } from '@/domain/menu'
import type { Locale } from '@/domain/routes'
import { HONEYPOT_FIELD, withPhotoProblem, type Receipt } from '@/domain/submit-enquiry'

import { downscalePhoto } from './downscale-photo'
import { EstimateSummary } from './EstimateSummary'
import {
  ClosedNotice,
  ContactFields,
  Honeypot,
  INPUT,
  LEGEND,
  PhotoField,
  RequestedPickupDateField,
  SendFooter,
  postEnquiry,
  toConfirmation,
  usePhoto,
  useRequestedPickupCalendar,
  useProblems,
  type FieldProps,
  type Submit,
} from './form-parts'

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

/**
 * The Enquiry form on an Item page: Size, quantity, Sponge and Filling with a running
 * Estimate, a Requested pickup date held to the Lead time and Closed until, Special requests,
 * and how to reach the customer.
 *
 * It is the one place the Item page shows its offer and the only place a customer chooses
 * from it. Every Size is printed with its price, a single one included (ADR-0002), and the
 * first Size, Sponge and Filling in Jana's order start chosen, so the Estimate has a figure
 * from the first render.
 *
 * It validates with the same function the route handler does, so the customer is told what
 * is wrong before anything is sent — and the server still decides. Takes the Item's offer as
 * plain data, so a test renders it with no network and no Payload. What it shares with the
 * Estimate-free forms is in `form-parts.tsx`.
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
  submit?: Submit
  /** Shrinks a chosen photo before it is sent. Throws when the file is not one. */
  downscale?: (file: File) => Promise<Blob>
  onSent?: (receipt: Receipt | null) => void
}) => {
  const words = DICTIONARY[locale].enquiry
  const itemWords = DICTIONARY[locale].item
  const formRef = useRef<HTMLFormElement>(null)

  const [values, setValues] = useState<Values>({
    size: offer.sizes[0]?.id ?? '',
    quantity: '1',
    sponge: offer.sponges[0] ? String(offer.sponges[0].id) : '',
    filling: offer.fillings[0] ? String(offer.fillings[0].id) : '',
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
  const [status, setStatus] = useState<'idle' | 'sending' | 'failed'>('idle')

  const calendar = useRequestedPickupCalendar({ locale, leadTime, closedUntil })

  const validate = (current: Values) =>
    validateEnquiry({ enquiryType: 'item', ...current }, { item: offer, pickup: calendar.rules })

  const photo = usePhoto({
    downscale,
    onChoose: () => {
      shown.clearServerProblem('photo')
      shown.touch('photo')
    },
  })

  const shown = useProblems({
    locale,
    order: FIELD_ORDER,
    own: withPhotoProblem(validate(values), photo.issue) ?? {},
    calendar,
    formRef,
  })
  const { fieldProps, problemFor } = shown

  const change = (field: keyof Values, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    shown.clearServerProblem(field as EnquiryField)

    if (field === 'quantity') {
      const count = Number(value)

      if (value.trim() !== '' && isQuantity(count)) {
        setEstimateQuantity(count)
      }
    }
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    shown.attempt()

    const checked = withPhotoProblem(validate(values), photo.issue)

    if (checked) {
      shown.focusFirst(checked)
      return
    }

    setStatus('sending')

    const reply = await submit(
      { enquiryType: 'item', locale, item: offer.id, ...values },
      photo.photo,
    )

    if (reply.status === 'accepted') {
      // Stays "sending" while the confirmation page loads, so it cannot be sent twice.
      ;(onSent ?? toConfirmation(locale))(reply.receipt)
    } else if (reply.status === 'invalid') {
      setStatus('idle')
      shown.showServerProblems(reply.problems)
    } else {
      setStatus('failed')
    }
  }

  const size = offer.sizes.find((each) => each.id === values.size)
  const filling = offer.fillings.find((each) => String(each.id) === values.filling) ?? null
  const figure = size ? estimate({ size, quantity: estimateQuantity, filling }) : null

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="relative mt-6 grid gap-8">
      <ClosedNotice locale={locale} calendar={calendar} notice={closedNotice} />

      <Choice
        field="size"
        legend={words.size}
        stacked
        options={offer.sizes.map(({ id, label, price, diameter, layers, servings }) => ({
          value: id,
          label,
          aside: formatEuros(price, locale),
          detail:
            [
              typeof diameter === 'number' ? itemWords.diameter(diameter) : null,
              typeof layers === 'number' ? itemWords.layers(layers) : null,
              typeof servings === 'number' ? itemWords.servings(servings) : null,
            ]
              .filter((each) => each !== null)
              .join(' · ') || undefined,
        }))}
        value={values.size}
        onChange={(value) => change('size', value)}
        fieldProps={fieldProps}
        problem={problemFor('size')}
      />

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

      <RequestedPickupDateField
        locale={locale}
        calendar={calendar}
        value={values.requestedPickupDate}
        onChange={(value) => change('requestedPickupDate', value)}
        fieldProps={fieldProps}
        problem={problemFor('requestedPickupDate')}
      />

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

      <PhotoField
        locale={locale}
        photo={photo}
        fieldProps={fieldProps}
        problem={problemFor('photo')}
      />

      <ContactFields
        locale={locale}
        values={values}
        onChange={change}
        fieldProps={fieldProps}
        problemFor={problemFor}
      />

      <Honeypot
        value={values[HONEYPOT_FIELD]}
        onChange={(value) => change(HONEYPOT_FIELD, value)}
      />

      <SendFooter
        locale={locale}
        status={status}
        hasProblems={shown.attempted && Object.keys(shown.problems).length > 0}
        busy={status === 'sending' || photo.reading}
        contactHref={contactPath}
        send={words.send}
      />
    </form>
  )
}

/**
 * One choice from a few — a Size, Sponge or Filling — as radio buttons. The label is the
 * option's name alone; a price or Surcharge sits beside it, and what a Size is beneath it,
 * as its description. `stacked` gives each option its own full-width row.
 */
const Choice = ({
  field,
  legend,
  stacked = false,
  options,
  value,
  onChange,
  fieldProps,
  problem,
}: {
  field: EnquiryField
  legend: string
  stacked?: boolean
  options: {
    value: string
    label: string
    aside?: string | undefined
    detail?: string | undefined
  }[]
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
      <div className={stacked ? 'mt-2 grid gap-2' : 'mt-2 flex flex-wrap gap-2'}>
        {options.map((option) => {
          const id = `enquiry-${field}-${option.value}`
          const describedBy = [
            option.aside ? `${id}-aside` : null,
            option.detail ? `${id}-detail` : null,
          ].filter((each) => each !== null)

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
                aria-describedby={describedBy.length > 0 ? describedBy.join(' ') : undefined}
                className="peer absolute inset-0 z-10 opacity-0"
              />
              <div className={stacked ? CHOICE_CARD : CHIP}>
                <label htmlFor={id} className={stacked ? 'text-base' : undefined}>
                  {option.label}
                </label>
                {option.aside ? (
                  <span
                    id={`${id}-aside`}
                    className={stacked ? 'ml-auto tabular-nums' : 'tabular-nums opacity-75'}
                  >
                    {option.aside}
                  </span>
                ) : null}
                {option.detail ? (
                  <span id={`${id}-detail`} className="basis-full opacity-75">
                    {option.detail}
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
