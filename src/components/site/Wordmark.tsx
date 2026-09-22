import { cn } from '@/lib/utils'

/**
 * The business name in Parisienne, as Jana's card sets it — and, like her card, **once per
 * page** (ADR-0004). The header carries it; nothing else on a page may.
 */
export const Wordmark = ({ className }: { className?: string }) => (
  <span className={cn('font-script leading-none', className)}>ThuisBakery</span>
)
