# Bilingual URL structure and the SEO baseline

Status: accepted (2026-09-19), amended 2026-09-21 (Business Profile address, issue #17)

The site is bilingual English/Dutch. **English sits at the bare root and Dutch lives under a `/nl`
prefix.** There is no automatic language detection anywhere: a single `proxy.ts` rewrite (never a
redirect) maps unprefixed paths onto the `/en` tree, and visitors change language through an
explicit switcher. Slugs and static path segments are fully localized. A cake that has not been
translated simply has no URL in the other locale. Structured data is `Bakery` + `Product`/`offers`
+ `BreadcrumbList` + `Organization`, and nothing that carries policy risk.

This supersedes the "Dutch at the site root" constraint recorded on the map during charting.

## Why English at the root

This was decided by the owner against this repo's own recommendation, and the reasoning on both
sides is worth keeping.

The case for Dutch at the root: the customer is someone in Uithoorn typing Dutch into Google to
collect a cake in person, so the commercially important pages are the Dutch ones, and the bare
domain is what inbound links and direct traffic land on.

The case that won: the owner reads English, will be looking at the site daily, and Uithoorn has a
substantial international population. The SEO cost is real but modest — Google treats `/en/` and
`/nl/` subdirectories as equivalent structures and indexes both; the root-versus-prefix distinction
is not a ranking mechanism. What actually changes is that a Dutch speaker typing the bare domain
lands on English, and root link equity accrues to the English version.

Consequence: the language switcher matters more than it otherwise would, because the default
landing locale is now the *wrong* one for the primary customer. It must be visually prominent, not
a utility-bar afterthought.

## Why no automatic language detection

Google instructs: *"Avoid automatically redirecting users from one language version of a site to a
different language version"* — such redirects stop users and crawlers seeing all versions.

The mechanism matters more than the instruction. Detection means reading `Accept-Language`, but
*"the Googlebot crawler usually originates from the USA. In addition, the crawler sends HTTP
requests without setting `Accept-Language`."* Googlebot therefore arrives with no language
preference at all and falls through to the no-header default, so detection does nothing for the
crawler while adding a request-time branch for humans.

Third reason, specific to this project: detection makes the HTML vary per visitor, which means
`Vary: Accept-Language`, which breaks the static generation that ADR-0001's database and hosting
case depends on. Public pages must never read the database at request time.

## Route shape

One `app/[locale]/[...segments]` tree. `proxy.ts` rewrites any path not starting with `/nl` onto
`/en<path>`; `/nl/…` passes through. A rewrite, not a redirect — the URL the visitor and Googlebot
see stays unprefixed.

Two sibling trees (`app/(en)` and `app/nl`, no proxy) were the alternative, and were genuinely
preferred while the host was undecided, because no research pass could confirm that a third-party
adapter would run a Next 16 `proxy.ts` at the edge or keep the rewritten page CDN-cacheable. ADR-0001
moved hosting to Vercel, where `proxy.ts` is first-party, which removed the objection. The spike
(issue #15) should still confirm the rewritten page is served statically — as verification, not as a
fork in the road.

Locale is read with `next/root-params` rather than prop-drilled. This only works because every route
sits under a root dynamic segment, which is the concrete reason to prefer one tree over two.

## Localized slugs

Slugs *and* static segments are localized: `/cakes/apple-pie` and `/nl/taarten/appeltaart`. The
catch-all resolves the whole path against Payload's localized `slug` field, so full localization
costs nothing over localizing the slug alone, and an English URL reading `/taarten/` is a permanent
tell. Static segments live in the dictionary as a route map, not as route folders.

`generateStaticParams` enumerates both locales' paths so every public page is statically generated.

## Untranslated content

Payload's field `fallback` defaults to `true`, which would silently serve Dutch text under an
English URL with `<html lang="en">`. That is the default behaviour, not an edge case: every cake
starts life filled in one locale only.

**An untranslated cake gets no URL in the other locale.** It is absent from `generateStaticParams`,
its page 404s, it is absent from that locale's sitemap, and — critically — the translated page must
then omit its `hreflang` alternate. An alternate pointing at a 404 breaks reciprocity, and Google
ignores non-reciprocal annotations, which can poison the whole set. The catalogue may still *list*
the cake with a badge linking to the other locale; it is the separate URL that is forbidden, not the
link.

Rejected: publishing the fallback text (thin, near-duplicate, contradicts its own `lang` attribute)
and publishing a stub page (manufactures a thin page per untranslated cake). Thin pages on a
brand-new domain with no authority are a bad trade.

This requires querying with `fallbackLocale: 'none'` to detect emptiness per document. `fallback`
stays `true` in the config, because it is correct for fields where one language's value serves both
(price, ingredient names).

Editor-facing rule: **a cake is ready in a locale when its title, slug and description are filled in
that locale.** Everything else falls back.

`defaultLocale` is `en`, matching the root. This reinforces the policy: a cake drafted in Dutch
first is genuinely absent in English rather than silently falling back.

## Language switching

An explicit switcher in the header and footer, labelled **in the target language** — "In het
Nederlands" on English pages, "In English" on Dutch ones. Not a flag: a flag is a country, not a
language. This is the pattern `ns.nl` uses, which is the closest well-executed Dutch comparable.

**No suggestion banner.** A client-side banner keyed on `navigator.languages` with a `localStorage`
dismissal was designed in detail and then dropped: both serious Dutch bilingual sites checked
(`ns.nl`, `rijksmuseum.nl`) ship a switcher and no banner. It is purely additive and can be added
later if the switcher proves insufficient. Recorded here so a future session does not "discover" the
gap and re-add it by accident.

## Metadata and canonicals

- Every locale URL **self-canonicalises**. English never canonicalises to Dutch or vice versa —
  that would collapse the cluster and defeat hreflang.
- `hreflang` alternates are **self-referencing and reciprocal**, fully qualified, emitted from
  `generateMetadata` on the page (not the layout, since alternates are per-URL). `x-default` points
  at the English root.
- Per-page title and description are editable per locale via `@payloadcms/plugin-seo`, which adds a
  `meta` field group plus a search-result preview with character counters — worth having for a
  non-technical editor. It does **not** provide hreflang, canonicals, sitemaps or JSON-LD; those are
  ours.
- Titles and descriptions have computed fallbacks (`<cake name> — ThuisBakery`; a truncation of the
  description) so a blank field is impossible. Making the fields required would just teach the
  editor to paste the title in twice.

## Structured data

Ship: **`Bakery`** on home/contact (`name`, `url`, `telephone`, `image`,
`openingHoursSpecification`, `priceRange`, and `areaServed` rather than `address`), **`Product` with
`offers`** on individual cake pages, **`BreadcrumbList`** on cake pages, **`Organization`** and
**`WebSite`** sitewide.

Do not ship `aggregateRating` or `Review`. Self-collected ratings on your own product pages are a
structured-data policy risk, and structured data does not affect ranking at all — only rich-result
eligibility. These are the only two items in the candidate set that can subtract rather than add.

`Product`/`offers` is only viable because prices are published and visibly rendered (issue #14).
Google's rule is absolute: *"Don't mark up content that is not visible to readers of the page."*
Every marked-up value — price, hours, phone — must be rendered on the page carrying the markup. This
is a constraint on the content model (issue #11), not a markup detail.

The website never prints the street address; `areaServed` is therefore permanent, not a launch-time
placeholder.

### Amendment, 2026-09-21: the Business Profile withholds the address too (issue #17)

This ADR originally left the Google Business Profile's address to a separate owner-side decision.
It has been taken, and it lands the same way: **the address is withheld on the Profile as well, and
Jana is registered as a service-area business covering Uithoorn.**

This was decided against this repo's recommendation, and both sides are worth keeping.

The case for showing it: Google ranks the local pack partly on **proximity to the searcher**,
measured from the listed address, so a real Uithoorn address is materially stronger for a query
like "taart Uithoorn" than none. Jana also genuinely qualifies as a storefront — pickup is the
entire fulfilment model, so customers really are served at the location.

The case that won: showing an address commits her to Google's storefront rule — **permanent
signage on the house, staffed during stated hours** — and that is a change to where she and her
family live, not a marketing setting. The owner declined it.

The cost, stated plainly: a service-area listing is a visibly weaker class of listing, and the
address being hidden does not stop proximity being computed from it — so the ranking cost of a
home in a village is paid either way, without the strength of a full listing in return. Combined
with issue #7's finding that the Profile *is* the ranking lever, this is the largest deliberate SEO
concession the project makes.

Recorded here rather than on the launch checklist because it is **hard to reverse** — flipping a
Profile address later can trigger re-verification — and because a future reader finding this ADR
would otherwise assume the website rule above settled the whole question. `areaServed` is now
permanent in both places, and NAP carries no street address anywhere (see
`docs/launch-checklist.md`).

## What is code-side and what is not

Code: the route tree and proxy rewrite, localized slugs and route map, hreflang and canonicals,
JSON-LD, a Payload-driven sitemap referenced from `robots.txt` (admin blocked, both locale trees
permitted), CMS-editable metadata with fallbacks, and image discipline as an LCP concern (explicit
dimensions, modern formats, priority on the hero, lazy below the fold).

Not code, and not this team's to decide: the Google Business Profile and its address, review
solicitation, local directory listings, NAP consistency, and Search Console verification. Per
Google's own documentation the local pack is ranked from the Business Profile — relevance, distance
and prominence, where prominence is driven by links and reviews — so the highest-leverage local SEO
work on this project is explicitly off-site. The site's job is to be the fast, crawlable,
consistent corroboration of a well-run profile. This should temper how much build budget goes to
SEO machinery: less than instinct suggests.
