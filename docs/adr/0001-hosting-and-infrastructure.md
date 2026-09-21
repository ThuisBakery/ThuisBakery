# Hosting and infrastructure

Status: accepted (2026-09-19)

The ThuisBakery site runs on **Vercel Pro**, with **Neon Postgres** (Free plan, Frankfurt) as the
database, and **Vercel Blob** for uploaded media, optimized by **Vercel's own image optimization**.
Vercel functions are pinned to the **`fra1`** region so they sit next to the database. Everything is
a managed service; nothing is self-hosted, in production or locally.

Total running cost is roughly **$20/month** — the Vercel Pro platform fee, which includes one seat
and $20 of usage credit. Neon Free is $0, and Blob storage plus image transformations at this
volume are cents, drawn from that credit.

> **Amended 2026-09-21 (issue #15).** The media leg originally read *Cloudflare R2 for uploaded
> media, Cloudflare Images for responsive transforms*. It was wrong: Vercel optimizes remote images
> natively, so Cloudflare Images was paying an extra vendor for a job the host already does. See
> [Media: why not Cloudflare](#media-why-not-cloudflare) below. Issues #4 and #8 recorded the
> superseded choice.

## Why

Vercel was rejected during charting because the Hobby tier restricts users to non-commercial use.
That objection applies to Hobby only; Pro permits commercial use, so the original reason for
exclusion is gone.

The decisive argument for Vercel is **certainty**. Payload v3 on Next.js 16 needs `draftMode()` to
work (Live Preview depends on it — see ADR context in issue #5), needs a `proxy.ts` rewrite to stay
CDN-cacheable (the unprefixed-Dutch URL structure from issue #6 depends on it), and needs remote
images from object storage to transform correctly. No research pass could confirm these on any
alternative host from documentation alone, and no dated first-hand report of Payload v3 running in
production could be found for Netlify or Render. Vercel is the reference implementation for
Next.js, so these stop being open questions rather than becoming a spike.

## What this costs us

**Payload's admin panel will be slow in bursts.** Vercel is serverless, so Payload rebuilds its
collection config, hooks and connection pool on every cold boot; the reported penalty is around
seven seconds. Public pages are statically generated and served from the edge, so customers do not
feel this — the site's editor does, on every editing session. This was raised explicitly and
accepted by the owner as the price of the certainty above.

It is also roughly three times the cost of the cheapest viable alternative (Render at ~$7/month).

## Rejected alternatives

Recorded because several of these were recommended by this repo's own research and will otherwise
be re-proposed.

- **Netlify** (the original lean, and research #2's recommendation). Free tier fails on a hard
  300-credit monthly cap at 15 credits per production deploy — about 20 deploys before every site
  on the team is paused with no option to buy headroom. Personal is $9/month (not the ~$19 figure
  in research #2, which was stale) but is still serverless, so it buys none of Vercel's certainty.
- **A VPS (Hetzner)**, research #2's actual recommendation. Its case rested on two premises that no
  longer hold: Postgres living on the same box (ruled out — managed databases only) and a hard
  €5–10 budget. With the database managed off-box it keeps all of its operational burden and loses
  both advantages. Also note CX22 appears superseded in the EU by CX23 at €5.49 ex VAT; the
  "€7.99 from 2026-04-01" figure circulating in research #2 is wrong on both amount and date.
- **Render** ($7/month, `0.5c-512mb`, Frankfurt). The cost winner and the runner-up: persistent
  Node process, no cold starts, no containers, git-push deploys. Rejected only because its Payload
  compatibility was unproven and would have required a spike. Its price cliff is also steep — the
  next tier is $25/month with nothing between — and 512 MB is not generous for Payload's admin.
- **Fly.io** (~$6/month, 1 GB, Frankfurt). More memory for less money than Render, but a
  machines-and-`fly.toml` workflow with more operational surface than this project has appetite for.
- **Cloudflare Workers.** Attractive on paper at the time — $5/month, one vendor alongside the R2
  and Images the media leg then assumed (that leg has since moved to Vercel Blob, so the
  one-vendor argument is now weaker still), and
  Hyperdrive is included free so Neon survives. Rejected on timing: Cloudflare's Next.js guide now
  recommends **vinext**, which is in beta, demoting OpenNext to a legacy path, and Payload's own
  Workers template uses **D1**, whose adapter Payload marks beta. Two beta layers under a live
  business site to save $2/month.
- **Google Cloud Run** (~$8.37/month always-warm, and higher in EU regions than that US-based
  figure suggests). Adds Artifact Registry and Cloud Build as dependencies. Note the trap:
  instance-based billing on the same shape is $46.66/month.
- **AWS App Runner.** Closed to new customers. The successor, ECS Express Mode, is
  container-image-only with ECR, an ALB and two IAM roles.
- **WordPress and Squarespace** were both weighed as alternatives to building at all. WordPress is
  not free in any configuration meeting our requirements (bilingual needs WPML) and carries a
  materially larger maintenance and security burden. Squarespace has no native multilingual support
  — its own help centre directs users to Weglot — putting it at roughly €33/month inc. VAT, five
  times this stack, while pulling against the no-auto-redirect decision in issue #6. Both beat this
  stack on editor quality for a non-technical owner; neither beat it on cost or control.

## Database plan and backups

Neon **Free** was chosen over Launch (now pay-as-you-go with no minimum, roughly $3/month). Free's
point-in-time recovery window is short — hours, not days — so the exposure is content entered
between an incident and someone noticing it.

Two things make that acceptable rather than reckless:

1. **Branch per environment.** Local development and previews connect to Neon branches rather than
   a local database, so every environment runs the same managed Postgres. Branching before a schema
   migration is the cheap habit that covers the realistic failure case.
2. **An explicit revisit trigger**, below.

## Media: why not Cloudflare

Vercel's image optimization handles remote images natively, via `next/image` plus
`images.remotePatterns`. That is precisely what Cloudflare Images was in the stack to do, so once
the host is Vercel, Cloudflare Images is redundant.

Its pricing is also no longer per source image — that is the legacy plan. It is now billed **per
transformation, only on cache MISS or STALE**: 5,000 transformations/month included on Hobby, then
$0.05–$0.0812 per 1,000, alongside image cache reads (300K/month included) and writes (100K/month).
A catalogue of a few dozen Items at five widths each is a few hundred transformations, cached
thereafter. It does not register against Pro's $20 credit.

With transforms settled, storage was the only remaining question, and **both candidates are free at
this volume** — R2 gives 10 GB and zero egress; Blob is $0.023/GB-month against the same credit. So
the choice is operational, not financial, and **Vercel Blob wins on setup cost**: no second vendor,
no API tokens, no public custom domain, one `vercel blob create-store`, and Payload ships a
first-party `@payloadcms/storage-vercel-blob` adapter. R2 would need `@payloadcms/storage-s3` —
Payload's `storage-r2` adapter is Workers-only, per issue #4 — plus the account and domain setup.

The lock-in this accepts is small and deliberate: R2's advantages are zero egress and portable S3,
neither of which bites at a bakery's photo volume, and either way the difference is one adapter
line if it ever does.

## Revisit triggers

- **Upgrade Neon to Launch** as soon as the owner has entered real content she would be upset to
  retype. This is a plan change with no migration.
- **Reconsider Cloudflare Workers** once vinext is out of beta *and* Payload documents a
  Postgres-over-Hyperdrive path. At that point the one-vendor story becomes genuinely attractive.
- **Reconsider Render or Fly** if Payload's admin cold-start latency on Vercel proves intolerable in
  practice. This is the risk knowingly accepted above. Issue #15 was written to measure it up front
  and was closed on 2026-09-21 without doing so: the number is unpublished and only a real deploy
  would produce it, and the first build session produces that deploy anyway. **The first editing
  session in the real admin is the measurement.** If Jana waits long enough to notice, this trigger
  fires.

## Assumptions this costing depends on

- Public pages are statically generated and never read the database at request time. Issue #3's
  Neon choice already depends on this; so does the claim that customers never feel a cold start.
- Image transformations stay in the low hundreds per month, which holds only while public pages are
  statically generated and the optimized derivatives stay cached. A cache-busting change to
  `minimumCacheTTL`, image sizes or quality settings re-bills every image.
- Usage stays within Vercel Pro's included $20 credit. Beyond that, usage bills on top of the
  platform fee.
