'use client'

import { useId, useRef, useState, type FormEvent, type RefObject } from 'react'

import { FormSheet } from '@/components/site/FormSheet'
import { BUTTON, CHIP } from '@/components/site/pressable'
import {
  CUSTOM_ORDER_OCCASIONS,
  PEOPLE,
  customOrderMessage,
  isCustomOrderOccasion,
  type CustomOrderOccasion,
} from '@/domain/custom-order'
import { DICTIONARY } from '@/domain/dictionary'
import { validateEnquiry, type EnquiryField } from '@/domain/enquiry'
import { CUSTOM_ORDER_STEPS, CUSTOM_ORDER_STEP_FIELDS } from '@/domain/enquiry-steps'
import type { StoredLeadTime } from '@/domain/lead-time'
import { parseCalendarDate } from '@/domain/pickup-date'
import type { Locale } from '@/domain/routes'
import { HONEYPOT_FIELD, withPhotoProblem, type Receipt } from '@/domain/submit-enquiry'

import { downscalePhoto } from './downscale-photo'
import { EnquiryConfirmation } from './EnquiryConfirmation'
import {
  ClosedNotice,
  ContactFields,
  Honeypot,
  INPUT,
  LEGEND,
  PhotoField,
  postEnquiry,
  usePhoto,
  useProblems,
  useRequestedPickupCalendar,
  type Submit,
} from './form-parts'
import { PickupCalendar } from './PickupCalendar'
import { StepFooter, StepProgress, useSteps } from './steps'
import { Stepper } from './Stepper'

type Values = {
  occasion: CustomOrderOccasion | ''
  /** The customer's own words: this form's Special requests. */
  idea: string
  people: number
  requestedPickupDate: string
  name: string
  email: string
  phone: string
  [HONEYPOT_FIELD]: string
}

/** The fields in the order the steps ask for them, which is the order problems are fixed in. */
const FIELD_ORDER = CUSTOM_ORDER_STEPS.flatMap((step) => CUSTOM_ORDER_STEP_FIELDS[step])

/**
 * Custom order as a stepped sheet (ADR-0007), the same pattern as an Item's Enquiry with no
 * Item and no Estimate: the Idea (what it is for, and the customer's own words), When (the
 * Requested pickup date, held to the site's Lead time and Closed until, and roughly how many
 * people), an optional Inspiration photo, then how to reach the customer.
 *
 * What it sends is the Custom order Enquiry the route handler has always taken. The Occasion
 * and the head count are not fields of it: they are written into the message above the
 * customer's words (`custom-order.ts`), so validation, the Submission and the emails are
 * untouched. The Idea step owns the message, so a problem with it opens that step.
 *
 * It opens from anywhere on the site, through `CustomOrderHost`, which is why it is told
 * where focus goes back to on closing.
 */
export const CustomOrderForm = ({
  locale,
  leadTime,
  closedUntil,
  closedNotice,
  contactPath,
  open,
  onOpenChange,
  returnFocus,
  onSent,
  submit = postEnquiry,
  downscale = downscalePhoto,
}: {
  locale: Locale
  /** The site-wide Lead time a Requested pickup date is held to. */
  leadTime: StoredLeadTime | null
  /** The Closed until global's date, as stored. */
  closedUntil: string | null | undefined
  /** What Jana wrote to say she is closed, in this locale. */
  closedNotice: string | null | undefined
  /** Where to get in touch directly when sending fails. */
  contactPath: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The control focus returns to on closing: the one that opened the sheet. */
  returnFocus: RefObject<HTMLElement | null>
  /** Called once Jana has the Enquiry and the sheet shows the confirmation. */
  onSent?: () => void
  submit?: Submit
  /** Shrinks a chosen photo before it is sent. Throws when the file is not one. */
  downscale?: (file: File) => Promise<Blob>
}) => {
  const words = DICTIONARY[locale].enquiry
  const customWords = DICTIONARY[locale].customOrder
  const formRef = useRef<HTMLFormElement>(null)
  const formId = useId()

  const [values, setValues] = useState<Values>({
    occasion: '',
    idea: '',
    people: PEOPLE.start,
    requestedPickupDate: '',
    name: '',
    email: '',
    phone: '',
    [HONEYPOT_FIELD]: '',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'failed' | 'sent'>('idle')
  const [receipt, setReceipt] = useState<Receipt | null>(null)

  const calendar = useRequestedPickupCalendar({ locale, leadTime, closedUntil })

  /** The Enquiry as it is sent: the Occasion and head count folded into the message. */
  const body = ({ occasion, idea, people, ...rest }: Values) => ({
    message: customOrderMessage(locale, { occasion, people, idea }),
    ...rest,
  })

  const validate = (current: Values) =>
    validateEnquiry({ enquiryType: 'custom-order', ...body(current) }, { pickup: calendar.rules })

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
    datePicked: true,
  })
  const { fieldProps, problemFor } = shown

  const stepper = useSteps({
    steps: CUSTOM_ORDER_STEPS,
    fields: CUSTOM_ORDER_STEP_FIELDS,
    shown,
  })

  const change = <K extends keyof Values>(field: K, value: Values[K], owner: EnquiryField) => {
    setValues((current) => ({ ...current, [field]: value }))
    shown.clearServerProblem(owner)
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
      { enquiryType: 'custom-order', locale, ...body(values) },
      photo.photo,
    )

    if (reply.status === 'accepted') {
      setReceipt(reply.receipt)
      setStatus('sent')
      stepper.focusTitle()
      onSent?.()
    } else if (reply.status === 'invalid' && stepper.showServerProblems(reply.problems)) {
      setStatus('idle')
    } else {
      setStatus('failed')
    }
  }

  const sheet = {
    open,
    onOpenChange,
    titleRef: stepper.titleRef,
    kicker: DICTIONARY[locale].somethingCustom,
    closeLabel: DICTIONARY[locale].close,
    returnFocus,
  }

  if (status === 'sent') {
    const pickup = parseCalendarDate(values.requestedPickupDate)

    return (
      <FormSheet
        {...sheet}
        title={words.sentToJana}
        footer={
          <button type="button" onClick={() => onOpenChange(false)} className={`${BUTTON} w-full`}>
            {customWords.done}
          </button>
        }
      >
        <EnquiryConfirmation
          locale={locale}
          email={values.email}
          replyDays={receipt?.leadTimeDays ?? leadTime?.days ?? null}
          reference={receipt?.reference ?? null}
          rows={[
            {
              term: customWords.for,
              value: values.occasion ? customWords.occasions[values.occasion] : null,
            },
            { term: customWords.howManyPeople, value: customWords.peopleLine(values.people) },
            {
              term: DICTIONARY[locale].sent.requestedPickupDate,
              value: pickup ? calendar.display(pickup) : null,
            },
            { term: customWords.yourIdea, value: values.idea.trim() },
          ]}
          estimate={null}
          contactPath={contactPath}
        />
      </FormSheet>
    )
  }

  const { step } = stepper

  return (
    <FormSheet
      {...sheet}
      title={words.steps[step].title}
      header={
        <StepProgress
          label={words.progress}
          steps={CUSTOM_ORDER_STEPS}
          index={stepper.index}
          name={(each) => words.steps[each].name}
        />
      }
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
        {step === 'idea' ? (
          <>
            <p className="leading-relaxed text-ink-muted">{words.intro}</p>
            <fieldset>
              <legend className={LEGEND}>{customWords.occasion}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {CUSTOM_ORDER_OCCASIONS.map((occasion) => {
                  const id = `custom-order-occasion-${occasion}`

                  return (
                    <div key={occasion} className="relative">
                      <input
                        type="radio"
                        id={id}
                        name="occasion"
                        value={occasion}
                        checked={values.occasion === occasion}
                        onChange={(event) =>
                          isCustomOrderOccasion(event.target.value)
                            ? change('occasion', event.target.value, 'message')
                            : undefined
                        }
                        className="peer absolute inset-0 z-10 opacity-0"
                      />
                      <div className={CHIP}>
                        <label htmlFor={id}>{customWords.occasions[occasion]}</label>
                      </div>
                    </div>
                  )
                })}
              </div>
            </fieldset>
            <div>
              <label htmlFor="enquiry-message" className={LEGEND}>
                {customWords.idea}
              </label>
              <textarea
                {...fieldProps('message', ['enquiry-message-hint'])}
                rows={5}
                value={values.idea}
                onChange={(event) => change('idea', event.target.value, 'message')}
                className={INPUT}
              />
              <p id="enquiry-message-hint" className="mt-1.5 text-sm text-ink-muted">
                {customWords.ideaHint}
              </p>
              {problemFor('message')}
            </div>
          </>
        ) : null}

        {step === 'when' ? (
          <>
            <ClosedNotice locale={locale} calendar={calendar} notice={closedNotice} />
            <PickupCalendar
              locale={locale}
              calendar={calendar}
              value={values.requestedPickupDate}
              onChange={(value) => change('requestedPickupDate', value, 'requestedPickupDate')}
              fieldProps={fieldProps}
              problem={problemFor('requestedPickupDate')}
            />
            <div>
              <Stepper
                label={customWords.people}
                value={values.people}
                min={PEOPLE.min}
                max={PEOPLE.max}
                step={PEOPLE.step}
                onChange={(people) => setValues((current) => ({ ...current, people }))}
                fewer={customWords.fewerPeople}
                more={customWords.morePeople}
                field={{
                  id: 'custom-order-people',
                  name: 'people',
                  'aria-invalid': undefined,
                  'aria-describedby': 'custom-order-people-hint',
                  onBlur: () => {},
                }}
                problem={null}
              />
              <p id="custom-order-people-hint" className="mt-1.5 text-sm text-ink-muted">
                {customWords.peopleHint}
              </p>
            </div>
          </>
        ) : null}

        {step === 'photo' ? (
          <>
            <PhotoField
              locale={locale}
              photo={photo}
              fieldProps={fieldProps}
              problem={problemFor('photo')}
            />
            <p className="text-sm text-ink-muted">{customWords.photoHint}</p>
          </>
        ) : null}

        {step === 'you' ? (
          <ContactFields
            locale={locale}
            values={values}
            onChange={(field, value) => change(field, value, field)}
            fieldProps={fieldProps}
            problemFor={problemFor}
          />
        ) : null}

        <Honeypot
          value={values[HONEYPOT_FIELD]}
          onChange={(value) => setValues((current) => ({ ...current, [HONEYPOT_FIELD]: value }))}
        />
      </form>
    </FormSheet>
  )
}
