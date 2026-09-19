# Where does the Next.js + Payload application run?

Research for the application-hosting decision. Researched **2026-09-19**. Every figure below was fetched from the vendor's own site on that date, or is explicitly flagged as unverified. Nothing here is recalled pricing.

Fixed context: Neon Postgres (Frankfurt, `aws-eu-central-1`) and Cloudflare R2 are already decided. Payload v3 is a persistent-server CMS; the question is only where the Node process lives.

All prices are the vendor's own currency and tax basis, stated per item. No FX conversion has been applied — treat USD and EUR figures as roughly interchangeable at this scale, but the invoice will differ.

---

## 1. Railway

Source: https://railway.com/pricing (retrieved 2026-09-19)

| Plan | Monthly fee | Included credit |
|---|---|---|
| Free Trial | $0 | $5 one-time, 30 days |
| Free | $0 | $1/month |
| **Hobby** | **$5** | **$5/month of usage credit** |
| Pro | $20 | $20/month |

So **yes, the Hobby plan still exists and still includes $5/month of usage credit**. The $5 is a credit against usage, not an allowance on top of it — you pay `max(plan fee, actual usage)`.

Resource rates, same page:

- Memory **$10 per GB/month**
- CPU **$20 per vCPU/month**
- Volumes $0.15/GB
- Egress $0.05/GB
- Billing is per-second, and "stopped services incur no costs".

**Real cost of one always-on service.** A 1 GB always-on service is $10/month in memory alone before any CPU. A mostly-idle Node process uses a small fraction of a vCPU, so a realistic all-in for a low-traffic Payload instance is roughly **$10–14/month** on the Hobby plan (the $5 credit is absorbed immediately). At 512 MB it is about **$5–8/month**, i.e. close to the plan floor. Note this is a modelled figure from Railway's published per-GB rate, not a quoted price.

**Sleep / scale to zero.** Railway does not sleep services by default, but it has an **opt-in** feature, formerly "App Sleeping", now called **Serverless**.
Source: https://docs.railway.com/reference/app-sleeping (retrieved 2026-09-19)
- A service sleeps only after **5–10 minutes with no outbound traffic**.
- "The first request made to a slept service wakes it" and there is a cold boot; "the first request sent to a slept service may return a **502 Bad Gateway**".
- Critically for us: **database connections, telemetry and inter-service communication all count as outbound traffic and prevent sleep.** A Payload app holding a Neon pool will rarely qualify. Treat this feature as not applicable — which is what we want.

**EU region.** Railway has exactly one European region: **EU West Metal — Amsterdam, Netherlands (`europe-west4-drams3a`)**. There is **no Frankfurt region**.
Source: https://docs.railway.com/reference/regions (retrieved 2026-09-19)
Amsterdam → Frankfurt is a short hop (~10 ms), so a Neon database in `aws-eu-central-1` is fine, but it is a cross-provider, cross-city hop rather than same-region.

**Deploy limits.** **Could not verify.** `docs.railway.com/reference/limits` returns 404, and the deployments reference page does not mention deploy counts or build minutes. The only limit found was ephemeral storage: **1 GB on Free, 100 GB on paid** (https://docs.railway.com/reference/deployments, retrieved 2026-09-19). The pricing page states Hobby allows up to 48 vCPU / 48 GB per service, 6 replicas, 7-day log history. I found no published cap on number of deploys.

---

## 2. Render

**Free tier spins down — confirmed, with a number.**
Source: https://render.com/docs/free (retrieved 2026-09-19)
- Free web services spin down after **15 minutes without inbound traffic**.
- Restarting takes **"about one minute"**, during which users see a loading page.

A one-minute cold start is disqualifying for a public bakery site, and worse than the ~7 s serverless figure that pushed us off Netlify functions. **Render free is not viable.**

**Instance types.** Confirmed from https://render.com/docs/compute-plans (retrieved 2026-09-19):

| Plan ID | CPU | RAM | Legacy name |
|---|---|---|---|
| `free` | 0.1 | 512 MB | — |
| `0.5c-512mb` | 0.5 | 512 MB | Starter |
| `1c-2g` | 1 | 2 GB | Standard |
| `2c-4g` | 2 | 4 GB | Pro |

The naming changed on 2026-08-26 and Render states "There are no changes to pricing" (https://render.com/docs/compute-plans-update, retrieved 2026-09-19).

> ⚠️ **NOT VERIFIED: the price of the smallest paid Render instance.** `render.com/pricing` is client-side rendered and returns no pricing text to a fetcher; `render.com/docs/service-tiers`, `/docs/instance-types` and `/docs/billing` all 404; `/docs/compute-plans` and `/docs/web-services` both defer to `/pricing#compute` without quoting a number. Render's own article confirms only that "Render's paid tiers eliminate spin-down entirely" (https://render.com/articles/platforms-with-a-real-free-tier-for-developers-in-2026, retrieved 2026-09-19). **Someone must open render.com/pricing in a browser to get the Starter figure.** I have deliberately not written down a remembered number.

**EU region.** Render has **Frankfurt, Germany** — same city and effectively same AWS region as the Neon database. Full list: Oregon, Ohio, Virginia, **Frankfurt**, Singapore.
Source: https://render.com/docs/regions (retrieved 2026-09-19)

**Build-minute / bandwidth caps.** **Not verified as concrete numbers.** The free-tier doc says free services "count against your monthly included amounts" and directs the reader to the dashboard's "Monthly Included Usage" section rather than publishing figures (https://render.com/docs/free, retrieved 2026-09-19). So the caps exist but Render does not publish them on a fetchable page.

---

## 3. Fly.io

Source: https://fly.io/docs/about/pricing/ (retrieved 2026-09-19)

- `shared-cpu-1x` **512 MB: $3.19–$4.18/month** depending on region. **Amsterdam (`ams`) is $3.32/month.**
- `shared-cpu-1x` **1 GB: $5.70–$7.45/month** depending on region. The exact `ams` 1 GB figure was not isolated from the table; expect ≈ **$6/month**. Flagged as approximate.
- Outbound transfer **$0.02/GB** for North America and Europe. Inbound free.
- **No plan or organization fee**: "Plans get complicated, so we just charge based on usage."

**Free allowance: effectively none.** The pricing page mentions no free compute tier. The only free items named are **the first 10 single-hostname certificates per organization** and community support. The historical "free allowances" section is gone. A credit card is required on the organization. **The old 3×256 MB free VM allowance should be treated as dead.**

**Regions.** Both **Amsterdam (`ams`)** and **Frankfurt (`fra`)** exist and both support Gateway and Managed Postgres.
Source: https://fly.io/docs/reference/regions/ (retrieved 2026-09-19)
Fly is the only candidate here that can sit in Frankfurt *and* cost under $7.

**Docker requirement — the important nuance.** Fly does **not** strictly require you to write a Dockerfile. Build resolution order is: explicit image → `[build]` section of `fly.toml` (which may name a buildpack) → `--dockerfile` → local Dockerfile → auto-detection.
Source: https://fly.io/docs/launch/deploy/ (retrieved 2026-09-19)
For a Node app with no Dockerfile, `fly launch` auto-detects and scaffolds. **But** Fly's own docs say of buildpacks: *"don't use buildpacks if you don't have to; they're brittle, bloated, and prone to change"*, and recommend an explicit Dockerfile for reliable builds. Everything on Fly is a Firecracker VM running an OCI image regardless. **In practice Fly is a container workflow.** Given the owner's stated dislike of a fully containerised workflow, this is a real mark against it, even though the literal answer is "a Dockerfile is not mandatory".

---

## 4. Hetzner Cloud CX22 — resolved, and the answer is not what was reported

This took several passes because **hetzner.com's pricing tables are client-side rendered and return no numbers to a fetcher** — the same wall the previous research pass hit. `hetzner.com/cloud/`, `/cloud/pricing/`, `/cloud/regular-performance/` and `/cloud/cost-optimized/` all render "from … /month" with the figure absent. Hetzner's www host also rate-limits (HTTP 429) after a handful of requests.

The numbers below come from **docs.hetzner.com** and Hetzner's **pressroom**, which are server-rendered and are primary Hetzner sources.

**The CX22 launch price: €3.79/month.**
> "The CX22 with 2 vCPUs, 4 GB of RAM, and 40 GB of disk space for € 3.79 per month"
Source: https://www.hetzner.com/pressroom/new-cx-plans/ (retrieved 2026-09-19; announcement dated 2024-06-06). Same line: all these plans include **20 TB of traffic and 1 IPv4 address**. Siblings: CX32 €6.80, CX42 €16.40, CX52 €32.40.

**There has since been a price adjustment, effective 15 June 2026 — not 1 April 2026, and not to €7.99.**
Source: https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/ (retrieved 2026-09-19)
- Effective **15 June 2026, 08:00 CEST**, for new orders and cloud instance rescales.
- The page states plainly: **"All prices are excluding VAT."**
- Cloud servers, Germany (FSN/NBG) / Finland (HEL):

| Model | Old €/month | **New €/month** | Old $/month | New $/month |
|---|---|---|---|---|
| CX23 | 3.99 | **5.49** | 4.99 | 6.49 |
| CX33 | 6.49 | 8.49 | 7.99 | 9.99 |
| CX43 | 11.99 | 15.99 | 13.99 | 18.49 |
| CX53 | 22.49 | 29.49 | 26.49 | 34.99 |

**Reading this carefully:** the current German/Finnish CX line in Hetzner's own price-adjustment table is **CX23/CX33/CX43/CX53**, not CX22/CX32/CX42/CX52. **CX22 appears in that document only in the Singapore table.** The strong inference is that **CX22 has been superseded by CX23 in the EU locations**, and that the current equivalent EU box is **CX23 at €5.49/month ex VAT** (2 vCPU / 4 GB, per the CX23 spec reported by Hetzner's own listing: 2 vCPU, 4 GB RAM, 40 GB disk, 20 TB traffic).

> ⚠️ **Partially unresolved.** I could not load a Hetzner page that simultaneously names CX23, its specs and its price in one server-rendered place, because the product pages are JS-only and the host started returning 429. What is *definitively* established: (a) the "€7.99 from 2026-04-01" report is **wrong on both the figure and the date** — the real adjustment is **€5.49 from 15 June 2026** for the current EU 2vCPU/4GB CX plan; (b) prices are **ex VAT**; (c) **Hetzner publishes no inc-VAT figure** on these pages. Dutch VAT at 21% puts CX23 at **€6.64/month inc VAT**, and CX22 (if still orderable) at €4.59 inc VAT — those are my arithmetic, not Hetzner's published numbers.
>
> The cheap way to settle CX22-vs-CX23 for good: open the Hetzner Cloud console's "Add Server" dialog, which lists exactly what is orderable today at today's price.

**IPv4.** A Cloud Primary IPv4 is **€0.50 ($0.60) per month**, ex VAT.
Source: https://docs.hetzner.com/general/infrastructure-and-availability/ipv4-pricing/ (retrieved 2026-09-19)
The 2024 press release says an IPv4 is included in the CX plan price; the separate IPv4 price list suggests it may now be billed. Budget the €0.50 to be safe.

**What Hetzner does not include.** There is no deploy pipeline, no TLS termination, no process supervision, no OS patching. That labour is the real price, and there is no ops person.

---

## 5. Vercel Pro

Source: https://vercel.com/docs/plans/pro-plan (page's own `last_updated: 2026-09-15`; retrieved 2026-09-19)

- **Platform fee $20/month**, which includes **1 deploying seat** and **$20/month of usage credit**. Additional Owner/Member seats $20/month each; Viewer seats free.
- Credit **expires monthly**, unused.
- Pro includes the lowest **Flat Rate CDN** tier at no extra cost: **1 million CDN requests and 1 TB data transfer per month**.
- Prices exclude VAT.

**Commercial use.** Confirmed, and confirmed in the direction we assumed. Vercel's Hobby page states: *"As stated in the fair use guidelines, the **Hobby plan restricts users to non-commercial, personal use only**."*
Source: https://vercel.com/docs/plans/hobby (retrieved 2026-09-19), citing https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage

The Pro plan page describes Pro as "designed for professional developers, freelancers, and businesses". Pro is therefore the commercial-use plan. **Commercial use on Pro is permitted.** A paid bakery site is commercial, so Vercel means **$20/month minimum**, and Payload still runs as serverless functions with the cold-start friction we already rejected. Vercel remains a poor fit on both counts.

Relevant included usage for a very low traffic site (Pro's $20 credit covers all of it easily): the Hobby table gives a sense of scale — 1M edge requests, 1M function invocations, 4 CPU-hours active CPU, 5,000 image transformations. Pro's equivalents are credit-metered rather than fixed.

---

## 6. Netlify Personal

Source: https://www.netlify.com/pricing/ (retrieved 2026-09-19)

| Plan | Price | Included credits |
|---|---|---|
| Free | $0 | 300 credits |
| **Personal** | **$9/month** | **1,000 credits** |
| Pro | $20/month | 3,000 credits |
| Enterprise | custom | unlimited |

Auto-recharge credit packs: Personal 500 credits for $5; Pro 1,500 credits for $10.

**The earlier ~$19/month figure is wrong.** Netlify Personal is **$9/month** with 1,000 credits. The $19 figure most likely came from the old per-member Pro pricing, which no longer matches this page.

Netlify does not change the fundamental objection though: Payload on Netlify runs in Netlify Functions, which is the serverless cold-start problem, already documented in `docs/research/2026-09-19-payload-on-netlify-free-tier.md` and `004-payload-media-storage.md`.

---

## 7. Coolify / Dokploy on a VPS — do they dissolve the "no containers" objection?

**No. They mandate Docker; they only hide it.**

**Coolify.** Source: https://coolify.io/docs/get-started/introduction (retrieved 2026-09-19)
> "Coolify connects to each server over SSH, **prepares the server to run Docker workloads**, and coordinates builds, deployments, domains, HTTPS, health checks, and day-to-day operations."
> "**Docker runs the resulting resources on the servers you connect.**"
> "Docker runs the containers and keeps persistent data in volumes or mounted storage."

Coolify is a control plane over Docker. Applications are deployed as standard Docker containers.

**Dokploy.** Source: https://docs.dokploy.com/docs/core (retrieved 2026-09-19)
Dokploy describes itself as "leveraging the robustness of Docker". The introduction page does not spell out Swarm or Nixpacks, so I **could not verify** those specifics from the page I read — but the Docker dependency is explicit.

**The honest framing for the decision:** Coolify/Dokploy change *who writes the Dockerfile* (their Nixpacks-style buildpack can autodetect a Node app), not *whether containers are the runtime*. The owner still gets a Docker daemon on a VPS they must patch, plus a self-hosted PaaS that itself needs upgrading. For a solo maintainer with no ops person, this **adds** a moving part rather than removing one. It is strictly more operational surface than Railway or Render.

---

## 8. If the site is not on Netlify, what resizes the images?

This is the hidden cost line in the whole comparison. Media lives in R2; something must produce responsive variants.

### (a) `next/image` on the host itself

Source: https://nextjs.org/docs/app/guides/self-hosting and https://nextjs.org/docs/app/api-reference/components/image (Next.js docs v16.3.5, `lastUpdated: 2026-08-25`; retrieved 2026-09-19)

- **It just works.** "Image Optimization through `next/image` works self-hosted with **zero configuration** when deploying using `next start`."
- **Images are optimized at runtime, not at build.** So the cost is per-image-variant CPU on the app server.
- **`sharp` memory warning, and it matters at 512 MB:** "On glibc-based Linux systems, Image Optimization **may require additional configuration to prevent excessive memory usage**", linking to sharp's Linux memory-allocator note. On a 512 MB instance this is a real OOM risk; the mitigation is setting the jemalloc/`MALLOC_ARENA_MAX` workaround sharp documents.
- **There is a disk cache, and it is bounded.** The default loader "will write optimized images to disk so subsequent requests can be served faster from the disk cache", configurable via `maximumDiskCacheSize` (added in v16.1.7), evicting least-recently-used entries; cache lives at `<distDir>/cache/images`. TTL is `minimumCacheTTL` or the upstream `Cache-Control`, whichever is larger. **"There is no mechanism to invalidate the cache at this time."**
- **Ephemeral-disk caveat:** the cache is per-instance local disk. On Railway/Render/Fly a redeploy wipes it and every variant is regenerated once.
- **If a CDN/proxy sits in front, it must forward the `Accept` header**, otherwise AVIF/WebP negotiation breaks.
- AVIF "generally takes 50% longer to encode" than WebP; each format is cached separately.

**What it costs in compute.** Next.js publishes no per-image figure, and I will not invent one. The structural facts are: a bakery site has maybe tens of source images × ~4 widths × 2 formats = a few hundred one-off encodes, then near-zero steady state while the disk cache holds. On an always-on box with persistent-ish disk the marginal cost is essentially **€0** — the box is already paid for. The genuine risks are (1) the sharp memory blowup on a 512 MB instance, and (2) cache loss on every deploy causing a burst of encodes. Both argue for **1 GB rather than 512 MB** if `next/image` does the work.

### (b) Cloudflare Images / Image Resizing on R2

Source: https://developers.cloudflare.com/images/pricing/ (retrieved 2026-09-19)

**Free plan:**
- **Up to 5,000 unique transformations per month, free.**
- Transformations only — no Images storage included.
- **Explicitly: it can optimize images stored elsewhere, like R2.**
- Exceeding the limit returns error `9422` and **incurs no charge** (it fails rather than bills).

**Paid plan:**

| Metric | Cost |
|---|---|
| Images Transformed | first 5,000 included, then **$0.50 per 1,000** additional unique transformations/month |
| Images Stored | $5 per 100,000 images/month |
| Images Delivered | $1 per 100,000 images/month |

- **Storage and delivery charges apply only to images in a Cloudflare Images bucket.** Optimizing a *remote* image (i.e. ours, in R2) is billed **only** under "Images Transformed". So with R2 as the origin, the storage and delivery lines are **not** charged.
- A "unique transformation" is one distinct parameter combination per image — the same source at 100×100 and 200×200 is two. `format=auto` counts as **one** transformation regardless of how many output formats are served.

**Does it work on R2 behind a custom domain?**
Source: https://developers.cloudflare.com/images/transform-images/transform-via-url/ (retrieved 2026-09-19)
- "Transformations can be requested on **every Cloudflare zone that has transformations enabled**" — so it is a **per-zone toggle in the dashboard**, a one-time setup step.
- The source may be "an absolute path on your origin server" **or** "an absolute URL starting with `https://` or `http://`". Remote origins are supported.
- The only same-zone restriction found applies to `onerror=redirect`, not to transformations generally.

**Verdict:** yes — R2 bucket on a custom domain in a Cloudflare zone, transformations enabled on that zone, and `/cdn-cgi/image/...` URLs work. For a bakery site, 5,000 unique transformations/month is far more than enough, so this is **€0/month** in practice, and it moves the resize CPU off the app server entirely. Wire it up as a Next.js **custom `loaderFile`** (https://nextjs.org/docs/app/api-reference/components/image#loaderfile) so `next/image` emits `/cdn-cgi/image/` URLs instead of `/_next/image`.

### (c) Free alternatives

1. **`next/image` on the host** — already covered. Genuinely free in cash terms on an always-on box, paid for in RAM and deploy-time cache churn. This is the default and requires no extra vendor.
2. **Cloudflare's 5,000 free transformations/month** — free, and the best of both: zero app-server CPU, zero extra vendor relationship beyond R2 which we already have. This is the recommendation.
3. **Payload's own `imageSizes` on upload.** Payload generates fixed-size variants with sharp at upload time and stores them in R2 alongside the original. Cost: R2 storage only (**$0.015/GB-month**, first 10 GB free — https://developers.cloudflare.com/r2/pricing/, retrieved 2026-09-19), and the sharp CPU is spent once, in the admin panel, not per page view. Downside: fixed sizes chosen up front, no `format=auto`, and the encode happens on the app server anyway — so it has the same sharp-memory consideration as (a), just concentrated at upload. *(This is an inference from how Payload uploads work rather than a quoted docs line; the R2 pricing is verified.)*

**Recommendation on images: Cloudflare transformations on the free plan, with `next/image` as the zero-config fallback.** Either way this line is €0/month.

---

## 9. Costs of the already-decided pieces (re-verified today)

**Neon** — https://neon.com/pricing (retrieved 2026-09-19)
- **Free**: $0/month, 100 CU-hours/project compute, **0.5 GB storage/project**.
- **Launch**: **pay-as-you-go with no monthly minimum** — $0.106/CU-hour compute, $0.35/GB-month storage, unlimited storage.
- Scale: $0.222/CU-hour, $0.35/GB-month.

> Worth flagging to the decision: **Launch no longer has a flat monthly fee.** Any earlier assumption of a fixed ~$19/month Launch charge is out of date. For a bakery site the Free plan's 0.5 GB is the binding constraint, not compute; Launch on pay-as-you-go would likely land at a **few dollars a month**.

**Cloudflare R2** — https://developers.cloudflare.com/r2/pricing/ (retrieved 2026-09-19)
- Free tier: **10 GB-month storage, 1M Class A ops, 10M Class B ops, egress free**.
- Beyond: $0.015/GB-month, $4.50/M Class A, $0.36/M Class B, **egress always free**.
- A bakery's media will sit inside the free tier. **€0/month.**

---

## 10. All-in monthly cost comparison

Assumptions: one always-on Node service; Neon Free (0.5 GB) or Neon Launch at a nominal ~$3 pay-as-you-go; R2 within free tier (€0); images via Cloudflare free transformations (€0). USD and EUR treated 1:1 for comparison only. Hetzner figures are **ex VAT**; everything else excludes VAT too.

| Option | App host | Neon | R2 | Images | **All-in / month** | Cold starts? | Region vs Frankfurt DB | Container workflow? |
|---|---|---|---|---|---|---|---|---|
| **Fly.io** `shared-cpu-1x` 1 GB, `fra` | ≈ $6 (512 MB `ams` = $3.32 verified; 1 GB = $5.70–7.45 range) | $0 free / ~$3 Launch | $0 | $0 | **≈ $6 / ≈ $9** | No | **Same city (fra)** | Yes, in practice |
| **Hetzner CX23** (2 vCPU/4 GB) + IPv4 | €5.49 + €0.50 = **€5.99 ex VAT** (€7.25 inc 21% VAT) | $0 / ~$3 | $0 | $0 | **≈ €6 / ≈ €9** ex VAT | No | Same country (FSN/NBG) | Only if you choose Coolify/Dokploy; plain `next start` + systemd is container-free |
| **Railway Hobby**, 512 MB | $5 plan floor, ≈ $5–8 realistic | $0 / ~$3 | $0 | $0 | **≈ $6–8 / ≈ $9–11** | No (sleep is opt-in and won't trigger) | Amsterdam only, ~10 ms | No |
| **Railway Hobby**, 1 GB | ≈ $10–14 | $0 / ~$3 | $0 | $0 | **≈ $10–14 / ≈ $13–17** | No | Amsterdam only | No |
| **Render** smallest paid (`0.5c-512mb`) | ⚠️ **price not verified** | $0 / ~$3 | $0 | $0 | **unknown** | No on paid | **Frankfurt** | No |
| Render **Free** | $0 | $0 | $0 | $0 | $0 | **Yes — 15 min spin-down, ~60 s wake** | Frankfurt | No |
| **Netlify Personal** | $9 (1,000 credits) | $0 / ~$3 | $0 | built in | **≈ $9 / ≈ $12** | **Yes — serverless functions** | n/a | No |
| **Vercel Pro** | $20 (incl. $20 credit, 1 seat) | $0 / ~$3 | $0 | $0–included | **≈ $20 / ≈ $23** | **Yes — serverless functions** | n/a | No |

### Reading of the table

- **Everything viable lands inside the €5–20 budget.** Cost is not the discriminator; cold starts, region and operational burden are.
- **Vercel Pro is the worst fit at the highest price** — 3× the cheapest option, commercial use requires the paid plan, and Payload still runs serverless.
- **Netlify Personal at $9 is cheaper than the $19 we had recorded**, but it does not solve the cold-start problem that started this whole question.
- **Render free is out**: a 60-second wake is far worse than the ~7 s serverless figure we were trying to escape.
- **Fly.io and Hetzner are the cheapest always-on options and both reach Frankfurt/Germany**, but Fly is a container workflow in practice, and Hetzner is raw ops with no deploy pipeline.
- **Railway Hobby at 512 MB is the least-effort always-on option** — git-push deploys, no Docker, no server to patch, ~$6–8 all-in. Its costs are Amsterdam-not-Frankfurt (negligible latency) and per-GB pricing that punishes you if the process needs 1 GB.
- **If `next/image` does the resizing, size the box at 1 GB**, because of the documented sharp memory behaviour on glibc Linux. **If Cloudflare transformations do the resizing (free, 5,000/month), 512 MB is defensible** — and that is what makes the cheap Railway/Fly tiers work.
- **Render's Starter price is the one missing number** in this comparison and should be filled in from a browser before deciding, since Render is the only no-container, no-ops candidate that is actually in Frankfurt.

## Explicitly not verified

1. **Render's smallest paid instance price** — pricing page is client-rendered; every docs route that might carry it 404s or defers.
2. **Render's published build-minute and bandwidth caps** — Render points to the dashboard instead of publishing them.
3. **Railway deploy-count / build-minute limits** — `docs.railway.com/reference/limits` is a 404; no published cap found.
4. **Fly's exact `ams`/`fra` 1 GB `shared-cpu-1x` price** — only the $5.70–$7.45 cross-region range and the `ams` 512 MB figure ($3.32) were isolated.
5. **Whether Hetzner CX22 is still orderable in the EU, and CX23's specs from a single server-rendered Hetzner page** — hetzner.com product pages are JS-only and the host rate-limited. The price adjustment itself (€5.49, 15 June 2026, ex VAT) *is* verified from docs.hetzner.com.
6. **Hetzner inc-VAT prices** — Hetzner publishes ex-VAT only; the 21% figures above are my arithmetic.
7. **Dokploy's Swarm / Nixpacks specifics** — the Docker dependency is verified; the build mechanism is not.
8. **Payload `imageSizes` behaviour** in §8(c) — inferred from the upload model, not quoted from Payload docs.

No figure in this document was supplied from memory. Where a source could not be read, the gap is left open above rather than filled.
