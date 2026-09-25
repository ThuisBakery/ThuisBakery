'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

import { BUTTON, BUTTON_OUTLINE, INLINE_LINK } from '@/components/site/pressable'
import { DICTIONARY } from '@/domain/dictionary'
import type { EnquiryProblems } from '@/domain/enquiry'
import { problemsOn, stepOwning, type StepFields } from '@/domain/enquiry-steps'
import type { Locale } from '@/domain/routes'

import type { useProblems } from './form-parts'

/**
 * The machinery of a stepped Enquiry sheet (ADR-0007), for any list of steps: which step is
 * showing, Next and Back, and where a problem sends the customer. What each step asks is
 * the sheet's own; the steps and the fields they own are the domain's (`enquiry-steps.ts`).
 *
 * Next checks only the step it is on, with the form's own validation, names that step's
 * problems and focuses the first. Back keeps everything, because the values live above the
 * steps. A problem found on sending, by the form or by the route handler, opens the step
 * that owns it. Whenever the step changes, focus moves to its title, so it is announced.
 */
export const useSteps = <S extends string>({
  steps,
  fields,
  shown,
}: {
  steps: readonly [S, ...S[]]
  fields: StepFields<S>
  /** The form's problems, which the steps name and focus. */
  shown: Pick<ReturnType<typeof useProblems>, 'touch' | 'focusFirst' | 'showServerProblems'>
}) => {
  const [index, setIndex] = useState(0)
  const titleRef = useRef<HTMLHeadingElement>(null)
  // Where focus goes once a new step has rendered: its title, or the first of its problems.
  const pendingFocus = useRef<'title' | EnquiryProblems | null>(null)

  useEffect(() => {
    const target = pendingFocus.current

    if (!target) {
      return
    }

    pendingFocus.current = null

    if (target === 'title') {
      titleRef.current?.focus()
    } else {
      shown.focusFirst(target)
    }
  })

  const at = Math.min(index, steps.length - 1)
  const step = steps[at] ?? steps[0]
  const last = at === steps.length - 1

  const goTo = (to: number, focus: 'title' | EnquiryProblems) => {
    pendingFocus.current = focus
    setIndex(to)
  }

  /** Opens the first step that owns one of `problems`, and focuses its first. */
  const open = (problems: EnquiryProblems) => {
    const owner = stepOwning(steps, fields, problems)

    if (owner && owner !== step) {
      goTo(steps.indexOf(owner), problems)
    } else {
      shown.focusFirst(problems)
    }
  }

  return {
    step,
    index: at,
    first: at === 0,
    last,
    titleRef,
    /**
     * Next, or on the last step Send: checks this step against `problems`, the form's whole
     * validation. With a problem on this step it names them and stays; otherwise it moves on.
     * On the last step, `true` means everything is ready to send. A problem left on an
     * earlier step (a date the Lead time has since overtaken) opens that step instead.
     */
    next: (problems: EnquiryProblems | null): boolean => {
      const onThisStep = problemsOn(fields[step], problems)

      fields[step].forEach(shown.touch)

      if (onThisStep) {
        shown.focusFirst(onThisStep)
        return false
      }

      if (!last) {
        goTo(at + 1, 'title')
        return false
      }

      if (problems && stepOwning(steps, fields, problems)) {
        steps.forEach((each) => fields[each].forEach(shown.touch))
        open(problems)
        return false
      }

      return true
    },
    back: () => goTo(Math.max(0, at - 1), 'title'),
    /**
     * The route handler's problems: shown, with the step that owns the first opened. `false`
     * when no step owns any of them (the Item itself was refused), which the customer cannot
     * fix: the sheet treats that as a failure on our side.
     */
    showServerProblems: (problems: EnquiryProblems): boolean => {
      if (!stepOwning(steps, fields, problems)) {
        return false
      }

      shown.showServerProblems(problems)
      open(problems)
      return true
    },
    /** Moves focus to the title once the sheet next renders: its confirmation, say. */
    focusTitle: () => {
      pendingFocus.current = 'title'
    },
  }
}

/**
 * The steps by name, the current one marked for assistive technology as well as by eye, and
 * the ones done filled in: how much is left.
 */
export const StepProgress = <S extends string>({
  label,
  steps,
  index,
  name,
}: {
  label: string
  steps: readonly S[]
  index: number
  /** A step's short name. */
  name: (step: S) => string
}) => (
  <ol aria-label={label} className="mt-3 grid auto-cols-fr grid-flow-col gap-1.5">
    {steps.map((step, position) => (
      <li
        key={step}
        aria-current={position === index ? 'step' : undefined}
        className={`grid gap-1.5 text-xs ${position === index ? 'font-semibold text-ink' : 'text-ink-muted'}`}
      >
        <span
          aria-hidden="true"
          className={`h-1 rounded-full ${position <= index ? 'bg-ink' : 'bg-rule'}`}
        />
        {name(step)}
      </li>
    ))}
  </ol>
)

/**
 * The pinned foot of a stepped sheet: what must stay in view (`aside`, the Estimate on an
 * Item), Back from the second step on, and Next, which is the send button on the last step.
 * Next submits the sheet's form from outside it, by `formId`, so Enter in a field does the
 * same. A failure on our side is owned here, with a direct route to Jana, where it cannot
 * scroll out of sight.
 */
export const StepFooter = ({
  locale,
  formId,
  first,
  last,
  send,
  status,
  busy,
  contactHref,
  onBack,
  aside,
}: {
  locale: Locale
  formId: string
  first: boolean
  last: boolean
  /** The last step's button. */
  send: string
  status: 'idle' | 'sending' | 'failed'
  /** The button waits: sending, or a photo still being read. */
  busy: boolean
  /** Where to get in touch directly when sending fails. */
  contactHref: string
  onBack: () => void
  aside?: ReactNode
}) => {
  const words = DICTIONARY[locale].enquiry

  return (
    <div className="grid gap-3">
      {status === 'failed' ? (
        <div role="alert" className="border-l-2 border-ink px-3 py-1 text-sm leading-relaxed">
          <p>{words.failed}</p>
          <a href={contactHref} className={INLINE_LINK}>
            {words.contactDirectly}
          </a>
        </div>
      ) : null}
      <div className="flex items-center gap-2">
        <div className="mr-auto min-w-0">{aside}</div>
        {first ? null : (
          <button type="button" onClick={onBack} className={BUTTON_OUTLINE}>
            {words.back}
          </button>
        )}
        <button type="submit" form={formId} disabled={busy} className={BUTTON}>
          {status === 'sending' ? words.sending : last ? send : words.next}
        </button>
      </div>
    </div>
  )
}
