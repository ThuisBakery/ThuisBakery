# Can Payload CMS run on Netlify's free tier?

Research for [#2](https://github.com/ThuisBakery/ThuisBakery/issues/2). Researched 2026-09-19. All vendor facts checked on that date; tiers move.

## Short answer

Technically yes, Payload v3 on Next.js deploys to Netlify. But Netlify's free plan moved to a **credit** model, and 300 credits/month with a **hard stop** (sites pause, visitors get "Site not available") is a poor fit for a live commercial bakery site. The free tier is also explicitly offered at Netlify's "sole discretion" with no service-level commitment and the right to shut projects down without notice.

---

## 1. Does Payload + Next.js actually run on Netlify?

- Payload's own deployment doc: "Payload can be deployed *anywhere that Next.js can run* - including Vercel, Netlify, SST, DigitalOcean, AWS, and more." — https://payloadcms.com/docs/production/deployment (checked 2026-09-19)
- Netlify publishes a first-party guide, "How to deploy Payload CMS to Netlify" — https://developers.netlify.com/guides/deploy-payload-cms-3-to-netlify/ (checked 2026-09-19). **Caveat: this guide is stale.** It still describes Payload 3.0 as "BETA software" and installs via `npx create-payload-app@beta`. Payload 3 went stable long ago (3.81.0 shipped 2026-04-01). Netlify has not refreshed its Payload guide, which is a weak signal about how closely this path is maintained.
- The Netlify Next.js adapter (OpenNext-based) claims zero-config support for App Router, RSC, Server Actions, route handlers, SSR, ISR, middleware, `next/image` via Netlify Image CDN, and i18n; minimum Next.js 13.5 — https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/ (checked 2026-09-19). That covers everything Payload's admin and API need architecturally.
- Adapter limitations that matter here: Node.js middleware has **no filesystem access**; rewrites cannot point at static files in `public/`; header/redirect evaluation order differs from standalone Next.js. Same source.

**Could not verify:** I found no credible, dated, first-hand production report of a Payload v3 site running on Netlify. The Netlify support thread on this (https://answers.netlify.com/t/deploying-payload-cms-to-netlify/89489) is a 2023 build-time dependency error (`copyfiles: not found`), closed in May 2024 by pointing at the guide — not evidence of a working production deployment. This is the single biggest gap in this research. Treat "it works on Netlify" as plausible-but-unproven rather than demonstrated.

## 2. Function limits

From https://docs.netlify.com/build/functions/configuration/ (checked 2026-09-19):

| Limit | Value |
|---|---|
| Synchronous execution | 60 s |
| Scheduled function execution | 30 s |
| Background function execution | 15 min |
| Memory | 1024 MB default; 1024–4096 MB configurable **on credit-based Pro/Enterprise only** |
| Buffered request/response payload | 6 MB (~4.5 MB effective for binary, base64 overhead) |
| Streamed response payload | 20 MB |
| Background request/response payload | 256 KB |

Bundle size: **250 MB unzipped per function**, an AWS Lambda limit Netlify cannot raise — https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/legacy-runtime/troubleshooting/ (checked 2026-09-19).

Assessment: 60 s and 1 GB are comfortable for Payload's admin and REST/GraphQL routes. The 250 MB bundle is the one to watch — a Payload admin bundle plus a DB adapter plus rich-text and plugin deps is large, though I found no report of Payload specifically breaching it. The **6 MB payload cap applies to media uploads**: a 12 MP cake photo straight off a camera can exceed ~4.5 MB post-base64. Uploading direct-to-S3/R2 rather than through the function sidesteps this, and Payload needs external object storage anyway (below).

## 3. Cold starts

Payload connects to the database, builds collections, registers hooks and establishes a connection pool on every cold boot. On a persistent server that happens once; on serverless it happens per cold start. Reported Payload cold-start penalty on Vercel serverless is **around seven seconds** (https://allaboutpayload.com/blog/fixing-cold-starts-vercel-payload-nextjs — secondary source, no date verified; treat the number as indicative, not authoritative). Netlify Functions have the same ephemeral model, so expect comparable behaviour.

The practical impact lands on the admin panel, not visitors: the public catalogue pages can be statically generated or ISR-cached, so Jana's customers rarely touch a cold function. Jana herself will feel multi-second waits, and the admin fires many parallel requests per edit when collections have relationships — each a potential cold invocation.

## 4. What Payload needs that serverless does not give

- **Persistent disk — confirmed problem.** Payload's deployment doc warns about ephemeral filesystems and directs you to cloud storage adapters (S3, Azure Blob, GCS). Local media uploads are not an option on Netlify. Budget for an S3-compatible bucket (Cloudflare R2, Backblaze B2).
- **Background jobs — confirmed constraint with a documented workaround.** Payload's jobs-queue docs say not to configure `autoRun` on "Vercel, Lambda, or other serverless environments where long-running background processes aren't supported," and to instead have an external cron hit `GET /api/payload-jobs/handle-schedules` and `GET /api/payload-jobs/run` — https://github.com/payloadcms/payload/blob/main/docs/jobs-queue/overview.mdx (checked 2026-09-19). Netlify Scheduled Functions cover this, but they have a **30 s** ceiling. For v1 (catalogue + enquiry email) there may be no jobs at all.
- **Database connections.** Payload's Postgres adapter uses a Drizzle connection pool sized for a persistent server; serverless creates and destroys connections far faster than that pool assumes and can exhaust Postgres connection limits. Use a pooled/serverless-native Postgres (Neon with pooling, or a Mongo Atlas equivalent) rather than a plain Postgres box. (Secondary source; consistent with Payload's own serverless guidance but not stated in Payload's docs — flagging as not fully verified.)
- **Websockets:** Payload v3 does not require them for the admin or Live Preview; Live Preview works over `postMessage` in an iframe. Not a blocker.
- **Long migrations:** run from CI or locally against the DB, not through a function. The 60 s sync cap would otherwise bite.

## 5. Commercial use on the free tier

**Not prohibited.** Netlify's Self-Serve Subscription Agreement (https://www.netlify.com/legal/self-serve-subscription-agreement/, checked 2026-09-19) contains no clause restricting business or commercial use of the Free Usage Tier — unlike Vercel Hobby, which is the reason Vercel was rejected. What it *does* say:

- "Netlify's Free Usage Tier is made available by Netlify to allow users to experience Netlify's Services, but the Free Usage Tier is offered at Netlify's sole discretion."
- Netlify may "change the terms and conditions applicable to the Free Usage Tier, or to discontinue it," and may "disable or remove any website project on Netlify's Free Usage Tier without notice at our sole discretion."
- Free tier projects run in a shared environment with "no service level commitments"; Netlify "may shut down Free Usage Tier website projects without notice for any reason or no reason."

So the legal blocker is gone, but it is replaced by an operational one: no SLA and discretionary termination for a business's only shopfront.

## 6. The credit model — the actual problem

Netlify's free plan is now **300 credits/month, hard limit** (no auto-recharge, no credit purchase). From https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/ (checked 2026-09-19):

| Resource | Cost |
|---|---|
| Production deploy | **15 credits each** |
| Compute (functions, incl. scheduled/background) | 10 credits per GB-hour |
| Bandwidth | 20 credits per GB |
| Web requests | 2 credits per 10,000 |
| Form submissions | free |
| Deploy previews / branch deploys | free |

When the 300 credits are gone, **all web projects on the team are paused** and visitors see a "Site not available" page until the cycle resets. Unused credits do not roll over on Free.

Doing the arithmetic for a small bakery site:

- **Deploys dominate.** 300 credits ÷ 15 = **20 production deploys per month, and nothing else**. A build-out month will blow through that on git pushes alone. Even in steady state, 20/month is a tight leash on fixing a typo.
- **Compute is fine at this traffic.** 10 credits/GB-hour at 1 GB memory = 1 credit per ~360 function-seconds. 100 credits buys ~36,000 function-seconds — thousands of requests even at a 7 s cold boot.
- **Bandwidth and requests are fine.** 20 credits/GB and 2 credits/10k requests: a low-traffic site with image-heavy pages served through the Netlify Image CDN might use 2–4 GB/month = 40–80 credits.

A realistic quiet month: 8 deploys (120) + bandwidth (60) + compute (40) + requests (10) ≈ **230 of 300**. That is not comfortable headroom — it is one busy week from the site going dark, with no way to pay for a top-up. The next step up, Netlify Personal at roughly $19/month for 1,000 credits, is **above the 5–10 EUR budget** in the map.

## 7. Alternatives under 10 EUR/month

- **Payload Cloud is not an option.** Payload's own cloud pricing page states deployment of new projects is "currently paused" (https://payloadcms.com/cloud-pricing, checked 2026-09-19); existing projects continue. Reporting attributes the shutdown to the Figma acquisition. Self-hosting is the only path for a new project.
- **A VPS.** Hetzner CX22 (2 vCPU, 4 GB RAM, 40 GB disk, 20 TB traffic) — pricing I saw reported at roughly €4.35–5.99/month ex-VAT, with a **secondary report of an increase to €7.99/month from 2026-04-01**. I could not verify current CX22 pricing from hetzner.com directly (the pricing table is rendered client-side and did not come back in the fetch) — **confirm on hetzner.com/cloud before committing.** Even at €7.99 it is inside budget, and a persistent Node process is what Payload is actually architected for: no cold starts, no 250 MB bundle ceiling, local disk for media, `autoRun` jobs work as designed, and Postgres can live on the same box. The cost is that you own patching, backups, TLS renewal and uptime — real work for a site with no ops owner.
- **Netlify Personal** (~$19/mo) — over budget.
- **Cloudflare Workers.** Cloudflare published a first-party writeup of Payload running entirely on their stack (https://blog.cloudflare.com/payload-cms-workers/). Potentially very cheap, but it is a newer path and I did not verify its current maturity, D1/R2 requirements, or free-tier fit. Worth a follow-up ticket if Netlify is dropped.

---

## Recommendation

**Keep Netlify, but plan for the Personal plan, not the free tier — and if the 5–10 EUR budget is hard, put the site on a Hetzner VPS instead.**

The free tier clears the bar that killed Vercel: there is no commercial-use prohibition. It fails a different bar. 300 credits at 15 credits per production deploy means about 20 deploys a month before a **hard pause that takes the site offline**, with no option to buy headroom, on a plan Netlify's own agreement says it may shut down "for any reason or no reason" with no SLA. That is an unacceptable failure mode for a business's only web presence, and it is not a risk you can buy your way out of without leaving the budget.

Of the two viable paths, **the VPS is the better fit for Payload specifically**: Payload v3 is a persistent-server CMS that has been made to run on serverless, not one designed for it. On a VPS the cold-start penalty, the 250 MB bundle ceiling, the 6 MB upload cap, the ephemeral-disk media problem and the connection-pool mismatch all simply stop existing, for roughly the price of the free tier's absence of guarantees. It also fits the budget with room for the database.

**The main risk with the VPS recommendation is operational ownership.** There is no ops person on this project. A VPS means someone patches the OS, renews certificates, monitors uptime, and restores from backup at 11pm when the box dies. Netlify absorbs all of that. If nobody will own that work, the honest choice is Netlify Personal at ~$19/month and a revised budget — paying the platform to be the ops team. Choosing the VPS to save 10 EUR and then not maintaining it is worse than either.

**The main unverified fact** is that I found no dated, first-hand production report of Payload v3 running on Netlify, and Netlify's own Payload guide still describes Payload 3 as beta. If Netlify is chosen, spike a throwaway deploy before committing the spec. Hetzner's current CX22 price also needs confirming directly.
