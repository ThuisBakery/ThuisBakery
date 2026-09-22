/**
 * The single-stroke cake stand from the foot of Jana's menu card (ADR-0004's motif). An
 * existing brand mark reproduced, not decoration invented to fill space.
 */
export const CakeStand = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 64 56"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <path d="M32 6c1.6 0 2.6 1.1 2.6 2.4 0 1.6-2.6 3.4-2.6 3.4s-2.6-1.8-2.6-3.4C29.4 7.1 30.4 6 32 6Z" />
    <path d="M12 34c0-11 9-22 20-22s20 11 20 22" />
    <path d="M12 34c3.4 0 3.4 3 6.8 3s3.3-3 6.7-3 3.4 3 6.8 3 3.3-3 6.7-3 3.4 3 6.8 3 3.3-3 6.2-3" />
    <path d="M10 38h44" />
    <path d="M32 38v10" />
    <path d="M20 52c0-2.2 5.4-4 12-4s12 1.8 12 4" />
  </svg>
)
