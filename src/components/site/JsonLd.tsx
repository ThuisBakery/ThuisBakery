import { serialiseMarkup, type Thing } from '@/domain/structured-data'

/** A page's JSON-LD (`src/domain/structured-data.ts`), one script per thing marked up. */
export const JsonLd = ({ data }: { data: readonly Thing[] }) =>
  data.map((each) => (
    <script
      key={String(each['@type'])}
      type="application/ld+json"
      // JSON-LD is data, not markup: `<` is escaped so no value can close the tag.
      dangerouslySetInnerHTML={{ __html: serialiseMarkup(each) }}
    />
  ))
