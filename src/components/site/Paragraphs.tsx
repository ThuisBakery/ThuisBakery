/**
 * Jana's paragraphs, as she separated them with a blank line in a plain text field — the
 * page-content singletons' longer copy that does not need rich text.
 */
export const Paragraphs = ({ text, className }: { text: string; className: string }) =>
  text
    .split(/\n\s*\n/)
    .map((each) => each.trim())
    .filter((each) => each !== '')
    .map((each) => (
      <p key={each} className={className}>
        {each}
      </p>
    ))
