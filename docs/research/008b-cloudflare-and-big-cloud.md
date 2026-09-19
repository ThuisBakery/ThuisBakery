# The three candidates 008 omitted: Cloudflare Workers, Google Cloud Run, AWS App Runner

Supplement to `docs/research/008-application-hosting.md`. Researched **2026-09-19**. Every figure below was fetched from the vendor's own site on that date, or is explicitly flagged as unverified. Nothing here is recalled pricing.

Baseline being challenged: **Render Hobby, `0.5c-512mb` (0.5 CPU / 512 MB), Frankfurt, $7/month**, with Neon Postgres Free (Frankfurt, `aws-eu-central-1`), Cloudflare R2 for media, Cloudflare Images for transforms.

Headline answers, up front:

1. **Cloudflare Workers** — real, first-party, and cheaper ($5/mo), and it does **not** force you off Neon (Hyperdrive is included free on Workers Paid). But the Next.js-on-Workers story **changed under the blog post's feet**: Cloudflare now recommends `vinext` (beta) over the OpenNext adapter, and Payload's own shipped Cloudflare path uses **D1 with a beta adapter**. It is a rebuild, not a deploy target. **Does not beat Render.**
2. **Google Cloud Run** — viable, EU regions fine, deploys from source without a Dockerfile via buildpacks. But an always-warm `min-instances=1` service lands at roughly **$8–9/month at the published default rate**, i.e. more than Render, with far more ops surface. **Does not beat Render.**
3. **AWS App Runner** — **closed to new customers.** Not an option at all. AWS's named successor, ECS Express Mode, is container-image-only. **Disqualified.**

---

## 1. Cloudflare Workers / Pages

### 1.1 The blog post is real, first-party — and a year old

Source: https://blog.cloudflare.com/payload-cms-workers/ (retrieved 2026-09-19; **post dated 2025-09-30**)

Cloudflare and the Payload team shipped a one-click template. It describes starting with **PostgreSQL via Hyperdrive**, then building a **custom SQLite/D1 adapter using Drizzle**, and states plainly: *"Payload doesn't support D1 out of the box, but has support for SQLite via the `@payloadcms/db-sqlite` adapter."* It cites Cloudflare TV as a live production user and mentions D1 read replicas cutting P50 latency 60%.

Payload's own announcement is one of the two primary sources here.
Source: https://payloadcms.com/posts/blog/deploy-payload-onto-cloudflare-in-a-single-click (retrieved 2026-09-19; **post dated 2025-10-03**)
- Database: **Cloudflare D1**.
- Plan: *"This can only be deployed on Workers Paid right now due to size limits."*
- No mention of sharp or image processing.

So: **documented path, yes. Blog-post demo, no.** But both posts are from autumn 2025 and the platform has moved since — see the next section, which is the actual finding.

### 1.2 The adapter story changed: Cloudflare now recommends `vinext`, not OpenNext

This is the thing that matters and it is not in either blog post.

Source: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/ (page's own **"Last updated Aug 25, 2026"**; retrieved 2026-09-19)

> "Cloudflare recommends vinext as the default way to run Next.js applications on Cloudflare Workers."
> "vinext is a Vite plugin that **reimplements the Next.js API surface**."
> "**vinext is in beta.** Before adopting it for an existing production application, run the compatibility check from your project directory and review the vinext compatibility dashboard."

The same page demotes OpenNext to a fallback, in a table headed "Use another Next.js deployment path":

| Path | Use when |
|---|---|
| OpenNext adapter | "You maintain an existing OpenNext application that **cannot yet migrate to vinext because of a compatibility gap**." |
| Static Next.js on Pages | Static export only. |

vinext's own supported-features table from that page: App Router, Pages Router, RSC, Server Actions, SSR, static generation, ISR, middleware all "Supported"; `next/*` imports "**Mostly supported**"; **Image optimization "Partially supported" — "Cloudflare image optimization is available at request time."**

**Next.js 16 on the OpenNext side is genuinely supported.** Source: https://opennext.js.org/cloudflare (retrieved 2026-09-19): *"All minor and patch versions of Next.js 16 and the latest minors of Next.js 14 and 15 are supported."* (Next.js 14 support "will be dropped Q1 2026".) The adapter docs do not label themselves beta.

**Read this honestly.** Both routes work on paper. But the *recommended* route is a beta Vite plugin that reimplements Next.js, and the *documented Payload* route is built on the adapter Cloudflare has just stopped recommending. For a solo maintainer on a bakery site, that is two moving platforms under one app. This is the single strongest argument against Workers here, and it is stronger than any cost argument.

### 1.3 What breaks: Node APIs, sharp, the admin bundle

**Node compatibility.** Source: https://developers.cloudflare.com/workers/runtime-apis/nodejs/ (retrieved 2026-09-19)
- Workers provides *"a subset of Node.js APIs"* — 23 fully supported (Buffer, Crypto, Events, fs, HTTP/HTTPS, Net, Path, Process, Stream, Timers, URL, Web Crypto and others), 9 partial (Console, DNS, Module, OS, perf_hooks, TLS/SSL…), and **16 non-functional stub modules** (`node:http2`, `node:vm`, `node:cluster`…) that import fine but throw when called.
- Compatibility date **2026-08-04 or later enables Node compat by default**; between 2024-09-23 and 2026-08-03 you must set the `nodejs_compat` flag.
- OpenNext additionally requires the `global_fetch_strictly_public` flag and `compatibility_date` ≥ `2024-09-23`. Source: https://opennext.js.org/cloudflare/get-started (retrieved 2026-09-19)

**sharp: does not run on Workers.** I want to be precise about the evidence, because this is the claim people most often assert without a source.
- Payload uses sharp for uploads: *"for image resizing to work, `sharp` must be specified in your Payload Config. This is configured by default if you created your Payload project with `create-payload-app`."* It is required only if you define `imageSizes`/`resizeOptions` or use focal point / crop. Source: https://payloadcms.com/docs/upload/overview (retrieved 2026-09-19)
- ⚠️ **NOT DIRECTLY VERIFIED FROM A PRIMARY SOURCE:** I could not find a Cloudflare or Payload page that states in so many words "sharp does not work on Workers". The Node.js compatibility page **says nothing about native addons or N-API modules**. The inference — sharp is a native libvips binding, Workers runs V8 isolates with no native module loading — is sound but is my inference, not a quoted vendor statement. Treat as high-confidence-but-unquoted.
- What *is* documented is the replacement: OpenNext's image guide offers no sharp path at all, only (a) the **Cloudflare Images binding**, which "provides a Next.js-compatible image optimization API" via an `IMAGES` binding in `wrangler.jsonc`, or (b) a custom loader hitting `/cdn-cgi/image/`. Formats limited to PNG, JPEG, WEBP, AVIF, GIF, SVG; `minimumCacheTTL` and `dangerouslyAllowLocalIP` unsupported. Source: https://opennext.js.org/cloudflare/howtos/image (retrieved 2026-09-19)

  Note the consequence: on Workers you would use Cloudflare Images for transforms — **which is already the plan in the Render baseline anyway**. So this is not a differentiator on the delivery side. It *is* a differentiator on the **admin upload side**: Payload's crop/focal-point tooling and `imageSizes` generation run server-side through sharp. Without sharp those admin features are unavailable. ⚠️ **Unverified**: whether the Cloudflare Payload template disables `imageSizes`/sharp, or substitutes something. Neither blog post says.

**Bundle size — and a live documentation contradiction.**
- Cloudflare's limits page today: **"Worker size (uncompressed) | 64 MiB | 64 MiB"** for Free and Paid alike, with "Only the uncompressed bundle size counts". Startup time: the Worker must "parse and execute its global scope … within **1 second**", both plans. Memory: **128 MB per isolate**. Source: https://developers.cloudflare.com/workers/platform/limits/ (retrieved 2026-09-19)
- OpenNext's own troubleshooting page still says **3 MiB on Free, 10 MiB on Paid**. Source: https://opennext.js.org/cloudflare/troubleshooting (retrieved 2026-09-19)
- Payload's Oct-2025 post says the template is Paid-only "due to size limits".

⚠️ **Contradiction, unresolved.** Cloudflare's limits page is the authoritative one and is the more recent; the OpenNext page appears stale. If 64 MiB is correct on Free, the Payload template's "Paid only" rationale may no longer hold. **I could not verify which is current for a Next.js Worker specifically.** Do not plan around the Free plan on the strength of this.

The **1-second startup CPU budget** is the constraint that actually bites a Payload admin bundle, more than the byte size. I found no published measurement of Payload's Worker startup time. ⚠️ **Unverified.**

### 1.4 The database question: does Workers force you off Neon? **No.**

This was the critical question and the answer is reassuring.

- Workers *can* open raw TCP via `connect()` from `cloudflare:sockets`, and Cloudflare notes "most database wire protocols including MySQL, PostgreSQL … require an underlying TCP socket API". But it explicitly steers you away: *"Connecting to a PostgreSQL database? **You should use Hyperdrive**, which provides the `connect()` API with built-in connection pooling and query caching."* Caveats: "TCP sockets cannot be created in global scope and shared across requests"; outbound TCP to Cloudflare IP ranges is blocked. Source: https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/ (retrieved 2026-09-19)
- **Hyperdrive costs nothing.** *"Hyperdrive's connection pooling and query caching are included in Workers Paid plan, so do not incur any additional charges."* No data-transfer/egress charge. Free plan: 100,000 queries/day; Paid: unlimited. Source: https://developers.cloudflare.com/hyperdrive/platform/pricing/ (retrieved 2026-09-19)
- Drivers supported through Hyperdrive: **node-postgres (pg), Postgres.js, Drizzle ORM, Prisma ORM**. Source: https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/ (retrieved 2026-09-19). Neon is not named on that page either way — but Neon is ordinary Postgres over TCP, so nothing here excludes it.

**So Neon Frankfurt survives, in principle.** Payload's Postgres adapter is Drizzle-based and Drizzle is a supported Hyperdrive driver.

⚠️ **But I could not verify that `@payloadcms/db-postgres` actually runs unmodified on `workerd` via Hyperdrive.** Cloudflare's post describes going *the other way* — starting on Postgres+Hyperdrive and then writing a custom D1 adapter — which is weak evidence that the Postgres route was less than satisfactory. And the one-click template ships D1.

**The D1 alternative reopens the settled decision, and it is beta.** Payload publishes a dedicated `@payloadcms/db-d1-sqlite` package, and its own docs say: *"This adapter is currently in beta as it is new and could be subject to changes which may be considered breaking."* Source: https://payloadcms.com/docs/database/sqlite (retrieved 2026-09-19)

Taking D1 would mean: abandoning Neon, abandoning Postgres, and running the CMS's data layer on a beta adapter. For a bakery's product catalogue with no ops person, that is not a trade worth making to save $2/month.

### 1.5 Cold starts

Workers are the clear winner here and it is not close.

Cloudflare states cold starts are eliminated by eagerly loading the isolate on the TLS `ClientHello`: a Worker loads in ~5 ms, less than the client↔Cloudflare RTT, so the observable cold start is **zero**; isolates generally start in single-digit milliseconds versus "as long as 5 seconds" for Lambda-style platforms. Sources: https://blog.cloudflare.com/eliminating-cold-starts-with-cloudflare-workers/ and https://developers.cloudflare.com/workers/reference/how-workers-works/ (both retrieved 2026-09-19).

Against the ~7 s Payload-on-serverless figure that pushed us off Netlify functions, and Render Free's ~60 s spin-up, Workers is categorically better. ⚠️ Caveat: those Cloudflare figures are about *isolate* startup. A Payload app must still parse and execute its whole global scope inside the **1-second startup budget** on each cold isolate. The marketing number and the Payload-shaped reality are not the same number, and I found no published Payload-on-Workers cold-start measurement.

Note this advantage is largely moot against the Render baseline: **a paid Render instance does not spin down at all**, so there is no cold start to beat.

### 1.6 Pricing

Source: https://developers.cloudflare.com/workers/platform/pricing/ (retrieved 2026-09-19)

| | Workers Free | Workers Paid |
|---|---|---|
| Fee | $0 | **$5/month minimum** |
| Requests | 100,000/day | 10 million/month included, then $0.30/million |
| CPU time | 10 ms per invocation | 30 million CPU-ms/month included, then $0.02/million |
| Duration | — | "No charge or limit for duration" |
| Egress | — | "No additional charges for data transfer (egress) or throughput" |
| Static assets | — | "Requests to static assets are free and unlimited" |

Plus Hyperdrive at no extra charge (§1.4), and Cloudflare Images: **5,000 unique transformations/month free**, then $0.50/1,000. Source: https://developers.cloudflare.com/images/pricing/ (retrieved 2026-09-19) — unchanged from the baseline assumption.

**All-in for this site: $5/month**, plus Neon Free and R2. That genuinely undercuts Render's $7 — by $2.

### 1.7 Verdict on Cloudflare Workers

Cheaper by $2/month. Better cold starts (irrelevant, since paid Render never sleeps). Global rather than EU-pinned, with the database still in Frankfurt. No containers at all — the best answer on that axis of any candidate.

And still: **no.** The reasons are all about churn and beta surface, not cost:

- The recommended Next.js path (`vinext`) is **beta** and reimplements Next.js; the documented Payload path (OpenNext) has just been **demoted to a fallback** by Cloudflare itself, one month ago on that page's own timestamp.
- Payload's shipped Cloudflare template uses **D1 with a beta adapter**, which would discard the already-settled Neon Postgres decision.
- Keeping Neon via Hyperdrive is *plausible and free* but **unverified end-to-end with Payload's Postgres adapter** — nobody's documentation claims it works.
- sharp is gone, so Payload's admin crop/focal-point/`imageSizes` tooling is in question, with **no vendor statement either way**.

$2/month does not buy a solo maintainer that much unresolved risk. Revisit if vinext leaves beta *and* Payload documents a Hyperdrive/Postgres path.

---

## 2. Google Cloud Run

### 2.1 No Dockerfile required

Source: https://docs.cloud.google.com/run/docs/deploying-source-code (retrieved 2026-09-19)

> "If no Dockerfile is present in the source code directory, Google Cloud's **buildpacks** automatically detects the language you are using and fetches the dependencies of the code to make a production-ready container image."
> "Source deployments use **Artifact Registry and Cloud Build** to automatically build container images from your source code without having to install Docker on your machine."

Node.js is a supported buildpack runtime. An Artifact Registry repo named `cloud-run-source-deploy` is auto-created in the deploy region.

So the literal answer is **a Dockerfile is not mandatory** — same shape as Fly's answer in 008. But the runtime is still a container image in a registry you now own, with a build system (Cloud Build) and a registry (Artifact Registry) as two extra billable, patchable, IAM-governed services. The owner's preference to avoid a containerised workflow is **partially** honoured: you don't author the container, but you do operate around it.

### 2.2 Min-instances billing

Source: https://docs.cloud.google.com/run/docs/configuring/min-instances (retrieved 2026-09-19)

> Request-based billing: "you are billed at a **lower rate when instances are idle** and waiting to process requests. If min instances is set to `0`, you are not billed when instances are idle."
> Instance-based billing: "you are billed the default rate for the entire instance lifecycle … even if min instances is set to `0`, you are still billed the default rate."
> "Instances kept running using the minimum instances feature **do incur billing costs**."

So for an always-warm low-traffic service you want **request-based billing with `min-instances=1`**, which bills the cheap idle rate around the clock. Instance-based billing would be catastrophic here (see the arithmetic below).

### 2.3 Rates and free tier

Source: https://cloud.google.com/run/pricing (retrieved 2026-09-19 — the page is JS-rendered and defeated the fetcher; figures below were extracted from the served HTML directly).

**Services, request-based billing — default column:**

| Resource | Rate |
|---|---|
| CPU, active time | **$0.000024 / vCPU-second** |
| CPU, idle time (min instance) | **$0.0000025 / vCPU-second** |
| Memory, active time | **$0.0000025 / GiB-second** |
| Memory, idle time (min instance) | **$0.0000025 / GiB-second** |
| Requests | **$0.40 per million** |

**Free tier (request-based), stated as "based on us-central1 active pricing":**
- CPU: **first 180,000 vCPU-seconds free per month**
- RAM: **first 360,000 GiB-seconds free per month**
- Requests: **2 million free per month**

**Free tier (instance-based), "based on us-central1 pricing":** 240,000 vCPU-s and 450,000 GiB-s per month.

The page states the free tier "is aggregated across projects by billing account and **resets every month**" — i.e. **it is perpetual, not a 12-month trial**, and **`min-instances=1` does not disqualify it**; it simply gets consumed in the first few days and you pay for the rest.

> ⚠️ **NOT VERIFIED: the europe-west3 / europe-west4 rates specifically.** The pricing page renders its per-region tables client-side; the region selector is present in the HTML but the per-region numbers are fetched by JavaScript and are absent from the served document. The rates quoted above are the page's **default column**, which the page labels against **us-central1**. Frankfurt (`europe-west3`) is a higher-cost region than `us-central1` and **the EU figure will be higher than my arithmetic below** — how much higher I could not establish. `europe-west4` (Netherlands) is typically cheaper than `europe-west3`, but I could not confirm the tier assignment from a fetchable page either. **Someone should open cloud.google.com/run/pricing in a browser and switch the region selector to Netherlands and Frankfurt.**

### 2.4 CPU/memory shapes

Source: https://docs.cloud.google.com/run/docs/configuring/services/cpu (retrieved 2026-09-19)
- "The minimum vCPU setting is **0.08 vCPU**", any value 0.08–1 in 0.001 increments.
- 0.08 vCPU → up to 512 MiB; 0.5 vCPU → up to 1 GiB; 1 vCPU → up to 4 GiB.
- **Sub-1-vCPU services must set max concurrency to `1`**, must use request-based billing, and must use the first-generation execution environment.

That concurrency-1 constraint matters: below 1 vCPU, a second simultaneous visitor triggers a *new instance*, i.e. a cold start, on a page whose whole point was to be always warm. For a real site, **1 vCPU is the honest configuration**, even at very low traffic.

### 2.5 Realistic monthly cost

A month is 2,592,000 seconds. Assume a near-idle always-warm service.

**1 vCPU / 512 MiB, request-based, `min-instances=1`, default rates:**
- CPU idle: 2,592,000 × $0.0000025 = **$6.48**
- Memory: 0.5 GiB × 2,592,000 × $0.0000025 = **$3.24**
- Less free tier: 180,000 vCPU-s (−$0.45) and 360,000 GiB-s (−$0.90)
- **≈ $8.37/month**, plus negligible active-CPU and request charges (2 M requests free).

**0.5 vCPU / 512 MiB** (concurrency forced to 1 — not really acceptable): CPU $3.24 + memory $3.24 − ~$1.35 free ≈ **$5.13/month**.

**Instance-based billing, 1 vCPU / 512 MiB**, for contrast: CPU at $0.000018/vCPU-s × 2,592,000 = **$46.66/month** before memory. Avoid.

Not included above and not verified: Artifact Registry image storage, Cloud Build minutes beyond any free allowance, and network egress. All small at this scale, all nonzero. ⚠️ **Unverified figures.**

In EUR, and in Frankfurt where rates are higher than the default column, the realistic band for the honest 1 vCPU configuration is **roughly €8–11/month**. That is inside the 5–20 EUR budget but **above Render's $7**, for strictly more operational surface.

### 2.6 Verdict on Cloud Run

- **Cost:** loses. ~$8.37+ at default rates, higher in Frankfurt, vs Render's flat $7.
- **Cold starts:** ties, effectively. `min-instances=1` keeps it warm; so does any paid Render instance. Cloud Run additionally risks a cold start if a second request arrives on a sub-1-vCPU service.
- **EU region:** ties. `europe-west3` is Frankfurt, same city as Neon.
- **Container burden:** loses. Buildpacks mean no Dockerfile, but you acquire Artifact Registry + Cloud Build and a container-image mental model.
- **Ops surface:** loses badly. GCP projects, IAM, service accounts, billing alerts, and a pricing model that will silently bill $46/month if someone toggles the wrong billing mode. Render's failure mode is a $7 invoice.

**Cloud Run does not beat Render.** It is the strongest of the three challengers and still loses on every axis but region parity.

---

## 3. AWS App Runner — disqualified

**App Runner is closed to new customers.** This banner appears on every page of the App Runner developer guide:

> "AWS App Runner is no longer open to new customers. Existing customers can continue to use the service as normal."

Source: https://docs.aws.amazon.com/apprunner/latest/dg/architecture.html (retrieved 2026-09-19)

The dedicated page states it fully:

> "After careful consideration, we decided to **close AWS App Runner to new customers**. Existing AWS App Runner customers can continue to use the service as normal, including creating new resources and services. AWS continues to invest in security and availability for AWS App Runner, but **we do not plan to introduce new features**."
> "We recommend that customers explore **Amazon ECS Express Mode** when migrating from AWS App Runner."

Source: https://docs.aws.amazon.com/apprunner/latest/dg/apprunner-availability-change.html (retrieved 2026-09-19). No end-of-support date is given on that page.

This is decisive on its own — we are a new customer — so the remaining detail is recorded only for completeness.

**Pricing, for the record.** Source: https://aws.amazon.com/apprunner/pricing/ (retrieved 2026-09-19)
- Provisioned (idle) container instances: **$0.007 / GB-hour** (US regions).
- Active container instances: **$0.064 / vCPU-hour** and **$0.007 / GB-hour** (US regions).
- Smallest configuration: **0.25 vCPU / 0.5 GB**. Source: the architecture page above.
- Build fees apply for source-code deploys, plus a monthly per-application fee for automatic deployments.
- ⚠️ **eu-central-1 and eu-west-1 rates are NOT published on that page** — it lists US regions, Europe (Ireland) and Asia Pacific (Tokyo) as headings but the fetched content surfaced numbers only for US and Tokyo. **Not verified for EU.** At US rates, the minimum always-on 0.25 vCPU / 0.5 GB service is about $0.0035/hour provisioned ≈ **$2.55/month** before any active time, build, or deployment fees — cheap, and irrelevant, because we cannot buy it.

**Did it support source deploys without a Dockerfile?** Yes — managed runtimes for several platforms including Node.js, deploying from GitHub or Bitbucket. That was its appeal, and it is precisely what the successor drops: *"Unlike App Runner, **ECS Express Mode requires a container image**. If your App Runner service is deployed from source code, first add a build step that creates a container image."* The migration guide's recommended workflow is: write a Dockerfile → GitHub Actions → push to ECR → deploy to ECS Express Mode, with an ALB, two IAM roles and ACM certificates. That is the opposite of the owner's stated preference, and it is not a solo-maintainer shape.

### 3b. AWS Amplify Hosting — brief

Source: https://aws.amazon.com/amplify/pricing/ (retrieved 2026-09-19)
- Build: Standard instance (8 GB / 4 vCPU) free up to 1,000 build-minutes/month, then $0.01/min.
- Hosting: storage free to 5 GB then $0.023/GB-month; data transfer free to 15 GB/month then $0.15/GB.
- SSR: **500,000 requests/month free** then $0.30/million; **100 GB-hours/month free** then $0.20/GB-hour.
- Free tier: "**12 months** of free hosting after account creation" — i.e. time-limited, not perpetual.

On paper a very low traffic SSR site could sit near **$0–2/month** inside those SSR allowances. But Amplify runs Next.js as **serverless SSR compute**, which is the same architecture we already rejected for Netlify and Vercel: Payload's ~7 s serverless cold start, no persistent Node process. Amplify is a worse Vercel for our purposes, inside a much larger IAM/console surface. **Not a candidate.**

⚠️ I did not verify Amplify's Next.js 16 support status or its EU region pricing; the objection above is architectural and did not require it.

---

## 4. Comparison against the Render baseline

| | **Render Hobby `0.5c-512mb`** (baseline) | **Cloudflare Workers** | **Google Cloud Run** | **AWS App Runner** |
|---|---|---|---|---|
| **Monthly cost, all-in** | **$7** flat | **$5** (Workers Paid; Hyperdrive & egress included) | **≈$8.37** at default rates, higher in Frankfurt ⚠️ EU rate unverified | **N/A** — closed to new customers |
| **Cold starts** | None — paid instances don't spin down | ~0 ms isolate start; ⚠️ 1 s startup-CPU budget vs Payload bundle unmeasured | None with `min-instances=1`; cold start on 2nd concurrent request if <1 vCPU | — |
| **EU region** | **Frankfurt** — same city as Neon | Global edge; DB stays in Frankfurt via Hyperdrive | `europe-west3` Frankfurt / `europe-west4` NL | Ireland / Frankfurt existed |
| **Database** | **Neon Postgres, unchanged** | Neon *possible* via free Hyperdrive ⚠️ unverified with Payload's PG adapter; shipped template uses **D1 (beta adapter)** | Neon, unchanged | Neon, unchanged |
| **Container burden** | None — git push, Render builds | None at all (best on this axis) | No Dockerfile (buildpacks), but Artifact Registry + Cloud Build + image model | Was source-based; successor is image-only |
| **Image handling** | sharp on the instance, or Cloudflare Images | **No sharp.** Cloudflare Images / `/cdn-cgi/image/` only; ⚠️ Payload admin crop & `imageSizes` status unverified | sharp works normally | sharp worked normally |
| **Ops surface for a solo maintainer** | Lowest. One dashboard, one invoice | Low infra, **high framework churn**: vinext beta, OpenNext demoted, D1 adapter beta | Highest: GCP project, IAM, two extra services, a billing mode that can 5× the bill | — |
| **Verdict** | **Still wins** | Loses on risk, not price | Loses on cost *and* ops | Disqualified |

**Conclusion: Render Hobby at $7/month remains the right choice.** Nothing found today displaces it.

Cloudflare Workers is the only candidate that is genuinely cheaper, and the $2/month saving is not worth adopting a beta framework adapter, a beta database adapter, or an unverified Hyperdrive/Payload Postgres path — on a site with no ops person. It is worth a note in the ticket to **revisit Workers once `vinext` leaves beta and Payload documents a Postgres-over-Hyperdrive configuration**; at that point the calculus changes materially.

---

## 5. Things I could not verify

Listed plainly so nobody mistakes an inference for a fact.

1. **Cloud Run's europe-west3 / europe-west4 rates.** The pricing page's per-region tables are JavaScript-rendered and absent from the served HTML. All Cloud Run arithmetic here uses the page's **default (us-central1) column**. Frankfurt is more expensive; the real EU figure is higher than $8.37.
2. **Worker size limit, current value.** Cloudflare's limits page says 64 MiB for both Free and Paid; OpenNext's troubleshooting page says 3 MiB / 10 MiB; Payload's template says "Paid only due to size limits". These cannot all be current. Unresolved.
3. **sharp on Workers.** No vendor page states it does not work. The conclusion is inferred from "V8 isolates, no native addons" plus the total absence of a sharp path in OpenNext's image docs. High confidence, no quote.
4. **Whether `@payloadcms/db-postgres` runs on `workerd` via Hyperdrive.** Neither Cloudflare nor Payload documents this. Cloudflare's post describes migrating *away* from Postgres+Hyperdrive to a custom D1 adapter, which is suggestive but not conclusive.
5. **Payload admin image tooling on Workers** — whether crop, focal point and `imageSizes` function in the Cloudflare template. Neither blog post mentions it.
6. **Payload-on-Workers cold start / startup-CPU measurement.** No published figure. Cloudflare's ~0 ms claim is about isolate startup generally, not about a Payload bundle inside the 1-second global-scope budget.
7. **App Runner eu-central-1 / eu-west-1 rates.** Not published on the pricing page in fetchable form. Moot — the service is closed.
8. **Amplify Hosting's Next.js 16 support and EU rates.** Not checked; the objection to Amplify is architectural (serverless SSR) and did not depend on it.
9. **Cloud Build free minutes and Artifact Registry storage rates.** Not fetched; both are small but nonzero additions to the Cloud Run figure.

### Note on source quality

Every figure in sections 1–3 is from a vendor-owned page, fetched 2026-09-19. Two exceptions, both flagged inline:

- The **Cloudflare cold-start figures** in §1.5 come partly from a Cloudflare *blog post* rather than reference documentation — first-party, but marketing-adjacent, and not a per-workload guarantee.
- The **Cloud Run rates** in §2.3 were extracted from the served HTML of the pricing page rather than read from its rendered tables, because the rendered tables defeated the fetcher. The numbers are Google's own, from Google's own document; the *region* they apply to is the page's default, and that is the limitation.
