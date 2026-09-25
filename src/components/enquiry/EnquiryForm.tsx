'use client'

import { useId, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react'

import { FormSheet } from '@/components/site/FormSheet'
import { BUTTON, CHIP, CHOICE_CARD } from '@/components/site/pressable'
import { DICTIONARY } from '@/domain/dictionary'
import { MAX_QUANTITY, validateEnquiry, type EnquiryField, type ItemOffer } from '@/domain/enquiry'
import { ITEM_STEP_FIELDS, itemEnquirySteps } from '@/domain/enquiry-steps'
import { estimate } from '@/domain/estimate'
import type { StoredLeadTime } from '@/domain/lead-time'
import { formatEuros, sizeDetail } from '@/domain/menu'
import { parseCalendarDate } from '@/domain/pickup-date'
import type { Locale } from '@/domain/routes'
import { HONEYPOT_FIELD, withPhotoProblem, type Receipt } from '@/domain/submit-enquiry'

import { downscalePhoto } from './downscale-photo'
import { EnquiryConfirmation } from './EnquiryConfirmation'
import { EstimateFigure } from './EstimateSummary'
import {
  ClosedNotice,
  ContactFields,
  Honeypot,
  INPUT,
  LEGEND,
  PhotoField,
  postEnquiry,
  usePhoto,
  useRequestedPickupCalendar,
  useProblems,
  type FieldProps,
  type Submit,
} from './form-parts'
import { PickupCalendar } from './PickupCalendar'
import { StepFooter, StepProgress, useSteps } from './steps'
import { Stepper } from './Stepper'

/** A catalogue's name and page: the confirmation's way back to the cakes. */
export type CatalogueLink = { name: string; path: string }

type Values = {
  size: string
  /** A whole number from the stepper, kept as text: the form sends it as it always has. */
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

/**
 * The Enquiry on an Item page, as a stepped sheet (ADR-0007): one decision per screen —
 * Size and how many, then Sponge and Filling when the Item is Configurable, then the
 * Requested pickup date, then Special requests, the Inspiration photo and how to reach the
 * customer. The Estimate, Back and Next stay pinned at the foot; Next is **Send to Jana** on
 * the last step. Once sent, the sheet says so and sums up what was asked.
 *
 * The first Size, Sponge and Filling in Jana's order start chosen, so the Estimate has a
 * figure from the first render and a customer with no preference can go straight through.
 *
 * It validates with the same function the route handler does, one step at a time, and the
 * server still decides: a problem it names opens the step that owns the field. What is sent
 * is the Enquiry the page has always sent. Takes the Item's offer as plain data, so a test
 * renders it with no network and no Payload. What it shares with the Estimate-free forms is
 * in `form-parts.tsx`, and what it shares with any stepped sheet is in `steps.tsx`.
 */
export const EnquiryForm = ({
  locale,
  offer,
  leadTime,
  closedUntil,
  closedNotice,
  contactPath,
  catalogue,
  open,
  onOpenChange,
  returnFocus,
  submit = postEnquiry,
  downscale = downscalePhoto,
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
  /** The catalogue the Item is from: the confirmation's way back. */
  catalogue: CatalogueLink
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The control focus returns to on closing: the one that opened the sheet. */
  returnFocus: RefObject<HTMLElement | null>
  submit?: Submit
  /** Shrinks a chosen photo before it is sent. Throws when the file is not one. */
  downscale?: (file: File) => Promise<Blob>
}) => {
  const words = DICTIONARY[locale].enquiry
  const itemWords = DICTIONARY[locale].item
  const formRef = useRef<HTMLFormElement>(null)
  const formId = useId()

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
  const [status, setStatus] = useState<'idle' | 'sending' | 'failed' | 'sent'>('idle')
  const [receipt, setReceipt] = useState<Receipt | null>(null)

  const steps = itemEnquirySteps(offer)
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
    order: steps.flatMap((step) => ITEM_STEP_FIELDS[step]),
    own: withPhotoProblem(validate(values), photo.issue) ?? {},
    calendar,
    formRef,
    datePicked: true,
  })
  const { fieldProps, problemFor } = shown

  const stepper = useSteps({ steps, fields: ITEM_STEP_FIELDS, shown })

  const change = (field: keyof Values, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    shown.clearServerProblem(field as EnquiryField)
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (status === 'sending' || photo.reading) {
      return
    }

    if (!stepper.next(withPhotoProblem(validate(values), photo.issue))) {
      return
    }

    setStatus('sending')

    const reply = await submit(
      { enquiryType: 'item', locale, item: offer.id, ...values },
      photo.photo,
    )

    if (reply.status === 'accepted') {
      setReceipt(reply.receipt)
      setStatus('sent')
      // The Send button goes with the steps: focus moves to "Sent to Jana", which is announced.
      stepper.focusTitle()
    } else if (reply.status === 'invalid' && stepper.showServerProblems(reply.problems)) {
      setStatus('idle')
    } else {
      setStatus('failed')
    }
  }

  const quantity = Number(values.quantity)
  const size = offer.sizes.find((each) => each.id === values.size)
  const sponge = offer.sponges.find((each) => String(each.id) === values.sponge) ?? null
  const filling = offer.fillings.find((each) => String(each.id) === values.filling) ?? null
  const figure = size ? estimate({ size, quantity, filling }) : null

  if (status === 'sent') {
    const pickup = parseCalendarDate(values.requestedPickupDate)

    return (
      <FormSheet
        open={open}
        onOpenChange={onOpenChange}
        title={words.sentToJana}
        titleRef={stepper.titleRef}
        kicker={offer.title}
        closeLabel={DICTIONARY[locale].close}
        returnFocus={returnFocus}
        footer={
          <a href={catalogue.path} className={`${BUTTON} w-full`}>
            {words.backTo(catalogue.name)}
          </a>
        }
      >
        <EnquiryConfirmation
          locale={locale}
          email={values.email}
          replyDays={receipt?.leadTimeDays ?? leadTime?.days ?? null}
          reference={receipt?.reference ?? null}
          rows={[
            { term: DICTIONARY[locale].sent.item, value: offer.title },
            { term: words.size, value: size ? words.line(size.label, quantity) : null },
            { term: itemWords.sponge, value: sponge?.name },
            { term: itemWords.filling, value: filling?.name },
            {
              term: DICTIONARY[locale].sent.requestedPickupDate,
              value: pickup ? calendar.display(pickup) : null,
            },
            { term: DICTIONARY[locale].sent.specialRequests, value: values.specialRequests.trim() },
          ]}
          estimate={figure}
          contactPath={contactPath}
        />
      </FormSheet>
    )
  }

  const { step } = stepper
  const title =
    step === 'size' && offer.sizes.length === 1 ? words.howManyTitle : words.steps[step].title

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      titleRef={stepper.titleRef}
      kicker={offer.title}
      header={
        <StepProgress
          label={words.progress}
          steps={steps}
          index={stepper.index}
          name={(each) => words.steps[each].name}
        />
      }
      closeLabel={DICTIONARY[locale].close}
      returnFocus={returnFocus}
      footer={
        <StepFooter
          locale={locale}
          formId={formId}
          first={stepper.first}
          last={stepper.last}
          send={words.sendToJana}
          status={status}
          busy={status === 'sending' || photo.reading}
          contactHref={contactPath}
          onBack={stepper.back}
          aside={figure ? <EstimateFigure locale={locale} estimate={figure} /> : null}
        />
      }
    >
      <form
        id={formId}
        ref={formRef}
        noValidate
        onSubmit={onSubmit}
        className="relative mt-5 grid gap-6"
      >
        {step === 'size' ? (
          <>
            <p className="leading-relaxed text-ink-muted">{words.intro}</p>
            <Choice
              field="size"
              legend={words.size}
              stacked
              options={offer.sizes.map((each) => ({
                value: each.id,
                label: each.label,
                aside: formatEuros(each.price, locale),
                detail: sizeDetail(each, locale) ?? undefined,
              }))}
              value={values.size}
              onChange={(value) => change('size', value)}
              fieldProps={fieldProps}
              problem={problemFor('size')}
            />
            <Stepper
              label={words.quantity}
              value={quantity}
              min={1}
              max={MAX_QUANTITY}
              onChange={(count) => change('quantity', String(count))}
              fewer={words.fewer}
              more={words.more}
              field={fieldProps('quantity')}
              problem={problemFor('quantity')}
            />
          </>
        ) : null}

        {step === 'flavour' ? (
          <>
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
          </>
        ) : null}

        {step === 'date' ? (
          <>
            <ClosedNotice locale={locale} calendar={calendar} notice={closedNotice} />
            <PickupCalendar
              locale={locale}
              calendar={calendar}
              value={values.requestedPickupDate}
              onChange={(value) => change('requestedPickupDate', value)}
              fieldProps={fieldProps}
              problem={problemFor('requestedPickupDate')}
            />
          </>
        ) : null}

        {step === 'you' ? (
          <>
            <div>
              <label htmlFor="enquiry-specialRequests" className={LEGEND}>
                {words.specialRequests}
              </label>
              <textarea
                {...fieldProps('specialRequests', ['enquiry-specialRequests-hint'])}
                rows={3}
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
          </>
        ) : null}

        <Honeypot
          value={values[HONEYPOT_FIELD]}
          onChange={(value) => change(HONEYPOT_FIELD, value)}
        />
      </form>
    </FormSheet>
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
