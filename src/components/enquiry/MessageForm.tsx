'use client'

import { useRef, useState, type FormEvent } from 'react'

import { DICTIONARY } from '@/domain/dictionary'
import { validateEnquiry, type EnquiryField } from '@/domain/enquiry'
import { amsterdamArrival } from '@/domain/pickup-date'
import type { Locale } from '@/domain/routes'
import { HONEYPOT_FIELD, withPhotoProblem, type Receipt } from '@/domain/submit-enquiry'

import {
  ContactFields,
  Honeypot,
  INPUT,
  LEGEND,
  SendFooter,
  postEnquiry,
  toConfirmation,
  useProblems,
  type Submit,
} from './form-parts'

type Values = {
  message: string
  name: string
  email: string
  phone: string
  [HONEYPOT_FIELD]: string
}

/** The fields in the order they appear, which is the order problems are fixed in. */
const FIELD_ORDER: readonly EnquiryField[] = ['message', 'name', 'email', 'phone']

/**
 * Contact's form (ADR-0003): an Estimate-free Enquiry that is a general question and how to
 * reply, nothing else. Custom order, the other Estimate-free Enquiry, is a stepped sheet of
 * its own (`CustomOrderForm`, ADR-0007).
 *
 * It goes to the same route and becomes the same Submission as an Item page's Enquiry, told
 * apart by `enquiryType`, and is validated by the same function the route handler uses.
 */
export const MessageForm = ({
  locale,
  contactHref,
  submit = postEnquiry,
  onSent,
}: {
  locale: Locale
  /** Where to get in touch directly when sending fails. */
  contactHref: string
  submit?: Submit
  onSent?: (receipt: Receipt | null) => void
}) => {
  const words = DICTIONARY[locale].enquiry
  const formRef = useRef<HTMLFormElement>(null)

  const [values, setValues] = useState<Values>({
    message: '',
    name: '',
    email: '',
    phone: '',
    [HONEYPOT_FIELD]: '',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'failed'>('idle')

  const validate = (current: Values) =>
    validateEnquiry(
      { enquiryType: 'contact', ...current },
      // A question carries no date, so the pickup rules are never applied.
      { pickup: { arrival: amsterdamArrival(new Date()), leadTime: null, closedUntil: null } },
    )

  const shown = useProblems({
    locale,
    order: FIELD_ORDER,
    own: withPhotoProblem(validate(values), null) ?? {},
    calendar: null,
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

    const checked = withPhotoProblem(validate(values), null)

    if (checked) {
      shown.focusFirst(checked)
      return
    }

    setStatus('sending')

    const reply = await submit({ enquiryType: 'contact', locale, ...values }, null)

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
      <div>
        <label htmlFor="enquiry-message" className={LEGEND}>
          {words.contactMessage}
        </label>
        <textarea
          {...fieldProps('message')}
          rows={5}
          value={values.message}
          onChange={(event) => change('message', event.target.value)}
          className={INPUT}
        />
        {problemFor('message')}
      </div>

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
        busy={status === 'sending'}
        contactHref={contactHref}
        send={words.sendMessage}
      />
    </form>
  )
}
