# Database migration workflow

Status: accepted (2026-09-21)

Payload schema migrations run **automatically on every Vercel deployment**, as part of the build
command:

```
payload migrate && next build
```

Migration files are generated locally with `payload migrate:create` and **committed**. A failed
migration fails the build, so the deployment is rejected rather than shipped against a mismatched
schema.

Because the Vercel–Neon integration gives every preview deployment its own copy-on-write Neon
branch, **the preview deployment is the rehearsal**: each migration runs against a clone of
production before it ever runs against production, automatically and without anyone remembering to
do it.

## Why

ADR-0001 chose Neon Free partly on the strength of "branch before a schema migration" as the backup
story, and noted it as a *habit* that needed somewhere to live. Habits that depend on a person
remembering them at the right moment are not backups.

Migrate-on-deploy puts the habit in the deployment pipeline instead. The only alternative seriously
considered was running migrations by hand against production before pushing, and it is worse on
every axis: the same destructive operation, no rehearsal, a step that can be forgotten, and a window
in which deployed code and database schema disagree.

Payload's `prodMigrations` adapter key — which runs migrations on server initialisation — was
rejected explicitly. Payload's own documentation warns it slows serverless cold starts, and cold
starts on the admin panel are already the acknowledged cost of ADR-0001's choice of Vercel.

## What the rehearsal does not cover

The preview branch catches a migration that **errors**. It does not catch a migration that
**succeeds at destroying data** — and Payload generates migrations from the collection config, where
renaming a field reads as drop-then-add.

Neon Free's point-in-time recovery window is **six hours**. A destructive migration that ships on a
Friday and is noticed on a Monday is unrecoverable. This is the real corruption exposure of the
workflow, and it is a plan limit rather than a pipeline problem.

Three guards, in order of how much they actually protect:

1. **Upgrade Neon to Launch at the first real migration.** ADR-0001 tied this to "real content the
   owner would be upset to retype"; this ADR pulls it forward. It is roughly $3/month, needs no
   migration, and turns a six-hour window into days. It is the only guard that helps after the fact.
2. **Read every generated migration before committing it.** Any `DROP` is a stop-and-think, never a
   rubber stamp.
3. **`migrate:fresh`, `migrate:reset` and `migrate:refresh` never appear in a `package.json`
   script.** They exist to drop everything. They belong only in a terminal someone is watching.

## Known sharp edges

- **Racing deploys.** Two production deployments building simultaneously both run `payload migrate`.
  Drizzle records applied migrations in a table so the window is small, but it is not zero. Not
  worth engineering around at this project's deploy frequency; worth knowing when something looks
  impossible.
- **Neon Free allows 10 branches per project**, and preview branches follow Vercel's deletion
  policy, whose default retention is six months — so branches from closed pull requests linger.
  Production plus a long-lived `dev` branch leaves eight for concurrent previews. Hitting the cap is
  not a failure to design around: it is the same prompt as guard 1, arriving from a different
  direction.
- **Development uses Drizzle push mode**, which syncs schema without migration files. That is
  Payload's default and is correct locally, but it means a schema change is only real once
  `migrate:create` has been run and the file committed.

## Consequences

- `DATABASE_URL` is owned exclusively by the Neon integration, which injects it per deployment. It
  must never be set by hand in Vercel's environment settings, where it would shadow the injected
  per-branch value.
- Local development connects to a single long-lived Neon `dev` branch, consistent with ADR-0001's
  rule that no database is ever run locally.
