'use client'

import { useRef, useState, type FormEvent } from 'react'

import { DICTIONARY } from '@/domain/dictionary'
import { validateEnquiry, type EnquiryField, type EnquiryType } from '@/domain/enquiry'
import type { StoredLeadTime } from '@/domain/lead-time'
import type { Locale } from '@/domain/routes'
import { HONEYPOT_FIELD, withPhotoProblem, type Receipt } from '@/domain/submit-enquiry'

import { downscalePhoto } from './downscale-photo'
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
  type Submit,
} from './form-parts'

type Values = {
  message: string
  requestedPickupDate: string
  name: string
  email: string
  phone: string
  [HONEYPOT_FIELD]: string
}

/** The fields in the order they appear, which is the order problems are fixed in. */
const FIELD_ORDER: readonly EnquiryField[] = [
  'message',
  'requestedPickupDate',
  'photo',
  'name',
  'email',
  'phone',
]

/**
 * The two Estimate-free Enquiry forms (ADR-0003): no Item, no Size, no Estimate.
 *
 * - **Custom order** — "tell me what you're imagining". The bespoke path, so it asks for a
 *   Requested pickup date, held to the site's Lead time and Closed until, and takes an
 *   Inspiration photo on the same terms as an Item page's form.
 * - **Contact** — a general question, and how to reply. Nothing else.
 *
 * Both go to the same route and become the same Submission as an Item page's Enquiry, told
 * apart by `enquiryType`, and are validated by the same function the route handler uses.
 */
export const MessageForm = ({
  locale,
  enquiryType,
  leadTime,
  closedUntil,
  closedNotice,
  contactHref,
  submit = postEnquiry,
  downscale = downscalePhoto,
  onSent,
}: {
  locale: Locale
  enquiryType: Exclude<EnquiryType, 'item'>
  /** The site-wide Lead time a Requested pickup date is held to. */
  leadTime: StoredLeadTime | null
  /** The Closed until global's date, as stored. */
  closedUntil: string | null | undefined
  /** What Jana wrote to say she is closed, in this locale. */
  closedNotice: string | null | undefined
  /** Where to get in touch directly when sending fails. */
  contactHref: string
  submit?: Submit
  /** Shrinks a chosen photo before it is sent. Throws when the file is not one. */
  downscale?: (file: File) => Promise<Blob>
  onSent?: (receipt: Receipt | null) => void
}) => {
  const words = DICTIONARY[locale].enquiry
  const customOrder = enquiryType === 'custom-order'
  const formRef = useRef<HTMLFormElement>(null)

  const [values, setValues] = useState<Values>({
    message: '',
    requestedPickupDate: '',
    name: '',
    email: '',
    phone: '',
    [HONEYPOT_FIELD]: '',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'failed'>('idle')

  const calendar = useRequestedPickupCalendar({ locale, leadTime, closedUntil })

  /** What this form sends: a Contact question carries no date. */
  const body = (current: Values): Record<string, string> => {
    const { requestedPickupDate, ...rest } = current

    return customOrder ? { ...rest, requestedPickupDate } : rest
  }

  const validate = (current: Values) =>
    validateEnquiry({ enquiryType, ...body(current) }, { pickup: calendar.rules })

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

    const { message, ...rest } = body(values)
    const reply = await submit({ enquiryType, locale, message, ...rest }, photo.photo)

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

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="relative grid gap-8">
      {customOrder ? (
        <ClosedNotice locale={locale} calendar={calendar} notice={closedNotice} />
      ) : null}

      <div>
        <label htmlFor="enquiry-message" className={LEGEND}>
          {customOrder ? words.customOrderMessage : words.contactMessage}
        </label>
        <textarea
          {...fieldProps('message', customOrder ? ['enquiry-message-hint'] : [])}
          rows={customOrder ? 7 : 5}
          value={values.message}
          onChange={(event) => change('message', event.target.value)}
          className={INPUT}
        />
        {customOrder ? (
          <p id="enquiry-message-hint" className="mt-1.5 text-sm text-ink-muted">
            {words.customOrderMessageHint}
          </p>
        ) : null}
        {problemFor('message')}
      </div>

      {customOrder ? (
        <>
          <RequestedPickupDateField
            locale={locale}
            calendar={calendar}
            value={values.requestedPickupDate}
            onChange={(value) => change('requestedPickupDate', value)}
            fieldProps={fieldProps}
            problem={problemFor('requestedPickupDate')}
          />
          <PhotoField
            locale={locale}
            photo={photo}
            fieldProps={fieldProps}
            problem={problemFor('photo')}
          />
        </>
      ) : null}

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
        contactHref={contactHref}
        send={customOrder ? words.send : words.sendMessage}
      />
    </form>
  )
}
