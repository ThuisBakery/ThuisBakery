'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

/**
 * The one motion primitive (ADR-0004: entry reveal, hover scale, `active` states, nothing
 * else; the hover and press states are ADR-0007's, in `pressable.ts`). Content arrives in
 * reading order as it scrolls in.
 *
 * Rendered visible, and hidden only once this has run and found the element **below** the
 * viewport. So anything above the fold never flickers, a page without JavaScript shows
 * everything, and under `prefers-reduced-motion` nothing is ever hidden. The styles are in
 * `styles.css`, behind `prefers-reduced-motion: no-preference`.
 */
export const Reveal = ({
  as: Tag = 'div',
  delay = 0,
  id,
  className,
  children,
}: {
  as?: 'div' | 'li'
  /** Milliseconds, to stagger neighbours. */
  delay?: number
  id?: string
  className?: string
  children: ReactNode
}) => {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = ref.current

    if (
      !element ||
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      element.getBoundingClientRect().top < window.innerHeight
    ) {
      return
    }

    element.dataset['reveal'] = 'pending'

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          element.dataset['reveal'] = 'shown'
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  const style = delay ? ({ '--reveal-delay': `${delay}ms` } as CSSProperties) : undefined

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement & HTMLLIElement>}
      id={id}
      className={className}
      style={style}
    >
      {children}
    </Tag>
  )
}
