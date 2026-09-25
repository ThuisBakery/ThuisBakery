'use client'

import { useId, useState, type ReactNode } from 'react'

import { TEXT_LINK } from '@/components/site/pressable'

/**
 * The rest of a description, behind "More". It is in the page from the start, only hidden,
 * so what search engines read is the whole description.
 */
export const More = ({
  more,
  less,
  children,
}: {
  more: string
  less: string
  children: ReactNode
}) => {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <>
      <div id={id} hidden={!open}>
        {children}
      </div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((current) => !current)}
        className={TEXT_LINK}
      >
        {open ? less : more}
      </button>
    </>
  )
}
