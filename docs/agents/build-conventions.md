# Build conventions

Settled in [issue #16](https://github.com/ThuisBakeryTech/ThuisBakery/issues/16). Migrations and
environment variables have their own decision record: see
[ADR-0005](../adr/0005-database-migration-workflow.md).

## Package manager

**pnpm.** One lockfile at the repo root; not a monorepo. Payload's documentation and templates
assume pnpm throughout, so their snippets paste in unmodified, and Vercel detects `pnpm-lock.yaml`
with no configuration.

## TypeScript

`strict: true` plus every additional strictness flag **except**
`noPropertyAccessFromIndexSignature`, which bans `obj.foo` in favour of `obj['foo']` and is style,
not safety.

`exactOptionalPropertyTypes` is **provisional**. Payload's generated `payload-types.ts` has a
history of not surviving strict optional checking, and there is no way to exempt a single non-`.d.ts`
file from a compiler flag — `skipLibCheck` covers declaration files only, and a `@ts-nocheck` comment
is wiped by the next `generate:types`. So if the generated file does not pass, **drop that one flag
repo-wide** rather than weakening anything else. It is the least valuable flag in the set.

`src/migrations` is **excluded from the typecheck**, decided when the first migration failed the
build (issue #29). `payload migrate:create` emits `{ db, payload, req }` on every migration and most
bodies use only `db`, so `noUnusedParameters` rejects generated code that is not ours to edit — and
unlike lint and format, a compiler flag cannot be waived for one file. Excluding the directory keeps
the flag for code we write; dropping the flag repo-wide would have been the larger concession.

What this costs: a migration is never typechecked. It is still checked where it matters — `payload
migrate` runs it against a real database on every preview deployment (ADR-0005), which catches more
than `tsc` would.

Aliases: `@/*` for application code, `@payload-config` per Payload's template.

`payload-types.ts` is **committed**, with a `generate:types` script. A dirty diff on that file is the
signal that someone changed a collection without regenerating. It is ignored by ESLint and Prettier:
generated code does not answer to our standards.

## Lint and format

The ESLint and Prettier setups that Next and Payload ship, unmodified. **No pre-commit hook** — this
is a solo repo, and the Vercel preview build already fails on lint and type errors.

Two carve-outs, both recorded when the scaffold landed (issue #29):

- **Prettier does not touch Markdown.** `CONTEXT.md`, the ADRs and these docs are hand-wrapped
  prose; reflowing them would bury their history in a formatting diff, and prose is not what
  Prettier is here for. `.prettierignore` holds `*.md` and `docs/`.
- **Payload's template wraps Next's ESLint config in `FlatCompat`**, which crashes on
  `eslint-config-next` 16's native flat config. `eslint.config.mjs` imports Next's flat config
  directly instead. The rule sets themselves — Next's, and Payload's softening of them — are
  untouched.

The ignore lists for generated code appear in three places (`.prettierignore`, `eslint.config.mjs`,
`vitest.config.mts` coverage). They have to be kept in step by hand; a new generated file means three
edits.

## Testing

**Vitest.** Behaviour only, never styles. No snapshot tests.

Coverage is **measured and reported, never gated**. A threshold is not the mechanism that decides
what deserves a test — the `tdd` skill is: seams are written down and confirmed before any test is
written, per feature. There is no repo-wide number to negotiate with.

Two structural rules make that workable:

- **`src/domain` holds pure logic**: no Payload import, no React, no I/O. The Estimate calculation,
  the Lead time cutoff arithmetic, Enquiry validation, slug and locale resolution. If a behaviour is
  worth testing, it moves here first, and that migration is the design win. (Estimate, Lead time and
  Enquiry are defined in `CONTEXT.md`.)
- **`page.tsx` fetches and does nothing else.** A presentational component takes the fetched data as
  props and is what tests render. Testing an async server component directly would mean mocking
  Payload's local API — asserting that mocks return what they were told to, which passes just as
  happily when the real query is wrong. Splitting the page gives a real render test, real prop shapes
  from `payload-types.ts`, and no mocking anywhere. A page where the split feels unnatural is telling
  you something about the page.

Collection configs are not tested.

## CI

One GitHub Actions workflow on pull requests: install, `vitest run --coverage` (reporting only, no
threshold), `tsc --noEmit`.

Lint and migrations are deliberately **not** in CI — the Vercel preview build runs both already, and
running them twice buys nothing.

One step beyond that list is unavoidable: `next typegen` runs before `tsc`, because `tsconfig.json`
includes `next-env.d.ts` and `.next/types`, which only a Next build or typegen produces. Without it
the typecheck fails on missing files rather than on real type errors.

## Environment variables

**Vercel is the source of truth** for preview and production. Local is a pulled copy via
`vercel env pull`, never authored by hand. A committed `.env.example` documents the *names* only.

The exception is `DATABASE_URL` (and `DATABASE_URL_UNPOOLED`), which the Neon integration injects at
deployment time and which are deliberately invisible in Vercel's environment settings because they
differ per preview branch. Never set them by hand there. The one connection string pasted manually is
the long-lived Neon `dev` branch, in local `.env.local`.
