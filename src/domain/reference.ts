/**
 * A Submission's reference: what the confirmation page shows the customer, and what they
 * quote to Jana when they follow up. Random rather than the database id, which would tell
 * any customer how many Enquiries the bakery has had.
 *
 * Eight characters from 32 — about a trillion references — in two groups of four, from an
 * alphabet without the pairs that read alike: 0 and O, 1 and I.
 */
export const REFERENCE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

/** `random(max)` returns a whole number from 0 up to, not including, `max`. */
export const enquiryReference = (random: (max: number) => number): string => {
  const characters = Array.from(
    { length: 8 },
    () => REFERENCE_ALPHABET[random(REFERENCE_ALPHABET.length)] ?? REFERENCE_ALPHABET[0],
  ).join('')

  return `${characters.slice(0, 4)}-${characters.slice(4)}`
}
