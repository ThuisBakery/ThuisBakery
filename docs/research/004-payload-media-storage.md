# Where do Payload's uploaded images live?

Research for [issue #4](https://github.com/ThuisBakeryTech/ThuisBakery/issues/4). Researched 2026-09-19. All sources dated; primary sources only (official docs, npm registry).

## 1. Why local disk is not an option

The S3 adapter "automatically sets `disableLocalStorage` to `true`" for each configured collection, and Payload's own docs frame storage adapters as the mechanism for "storing files in different locations" than the server filesystem.
Source: https://payloadcms.com/docs/upload/storage-adapters (retrieved 2026-09-19)

On Netlify, the Next.js app runs in Netlify Functions ("provisioning Netlify Functions to handle server-side functionality such as SSR, ISR and PPR pages, API endpoints, Server Actions"). Function filesystems are ephemeral and per-invocation, so an upload written to disk by the admin panel is not readable by the next request.
Source: https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/ (retrieved 2026-09-19)

## 2. The adapter landscape, and which are maintained

Payload's official adapter list:

| Service | Package |
|---|---|
| Vercel Blob | `@payloadcms/storage-vercel-blob` |
| AWS S3 | `@payloadcms/storage-s3` |
| Azure | `@payloadcms/storage-azure` |
| Google Cloud Storage | `@payloadcms/storage-gcs` |
| Uploadthing | `@payloadcms/storage-uploadthing` |
| Cloudflare R2 | `@payloadcms/storage-r2` |

Source: https://payloadcms.com/docs/upload/storage-adapters (retrieved 2026-09-19)

**Maintenance.** All of these live in the Payload monorepo and are released in lockstep with Payload core. npm registry metadata, queried 2026-09-19:

```
@payloadcms/storage-s3            3.90.1  published 2026-09-18
@payloadcms/storage-r2            3.90.1  published 2026-09-18
@payloadcms/storage-vercel-blob   3.90.1  published 2026-09-18
@payloadcms/storage-uploadthing   3.90.1  published 2026-09-18
@payloadcms/plugin-cloud-storage  3.90.1  published 2026-09-18
```

Source: https://registry.npmjs.org/@payloadcms/storage-s3 etc. (queried 2026-09-19)

All were published *yesterday*. "Maintained" is not a discriminator here — every official adapter is equally maintained, because they ship on the same release train. The discriminators are the runtime caveats below.

**Two important caveats:**

1. **`@payloadcms/storage-r2` is not the adapter to use on Netlify.** Payload's docs say it "is in beta as some aspects of it may change on any minor releases", and — more decisively — that it is "for Cloudflare Workers only, where R2 is available as a native bucket binding". For Node.js hosts, Payload explicitly recommends reaching R2 through `@payloadcms/storage-s3` against R2's S3-compatible API: "The S3 adapter can connect to Cloudflare R2 via its S3-compatible API, which is recommended for Node.js environments like Vercel or Netlify."
   Source: https://payloadcms.com/docs/upload/storage-adapters (retrieved 2026-09-19)

2. **There is no Netlify Blobs adapter.** Netlify Blobs does not appear in Payload's official list, and I found no first-party adapter for it. Netlify's own "Deploy Payload CMS 3 to Netlify" guide (by Matt Kane) covers deployment and database setup and says nothing at all about file storage — it does not recommend Netlify Blobs, or anything else.
   Sources: https://payloadcms.com/docs/upload/storage-adapters, https://developers.netlify.com/guides/deploy-payload-cms-3-to-netlify/ (both retrieved 2026-09-19)
   *Unverified:* whether Netlify Blobs exposes an S3-compatible API that the S3 adapter could target. I could not find first-party documentation either way, so I am treating Netlify Blobs as unavailable rather than as a maybe.

**Vercel Blob** is technically usable from Netlify (it is a plain HTTP API) but means paying Vercel to host assets for a Netlify-hosted site, on a platform the map already rejected. **UploadThing** adds a third vendor and a per-GB bill for what R2 gives free at this scale.

## 3. Cost at 100–300 images

**Stated assumptions.** These are my estimates, not measured figures:

- 200 images (midpoint of the ticket's 100–300).
- Originals ~3 MB each after the owner's editing pass (typical edited JPEG from a modern camera/phone at full resolution).
- Payload generates ~4 `imageSizes` variants per original, adding roughly 40% on top of the originals.
- Total stored: 200 × 3 MB × 1.4 ≈ **0.85 GB**, call it 1 GB.
- Traffic: ~1,000 visits/month, ~20 image requests each = 20,000 image requests; at ~80 KB per optimised WebP that is ~1.6 GB/month egress.

**Cloudflare R2.** Free tier is 10 GB-month storage, 1 million Class A (write) operations, 10 million Class B (read) operations, and **egress is free for all storage classes**. Beyond that: $0.015/GB-month storage, $4.50/M Class A, $0.36/M Class B.
Source: https://developers.cloudflare.com/r2/pricing/ (retrieved 2026-09-19)

At 1 GB stored, ~1,000 writes for the whole initial upload, and reads only when Netlify's Image CDN misses its cache, this sits **an order of magnitude inside the free tier. Expected R2 bill: €0.00/month**, and it would take roughly 10x the image count to leave the free tier at all.

**Netlify.** Netlify is on credit-based pricing as of 2026: Free = 300 credits/month with a hard limit and no auto-recharge; Personal = $9/month for 1,000 credits; Pro from $20/month for 3,000.
Source: https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/ (retrieved 2026-09-19)

Credit costs relevant here, from the same page: Web Bandwidth 20 credits/GB; Web Requests 2 credits/10,000; Functions compute 10 credits/GB-hour; **Production Deployments 15 credits each**.

Image CDN transformations are **not separately metered** — they are billed inside the bandwidth meter, so there is no per-transformation line item.
Source (secondary, flagged): Netlify's own materials via search summary; I could not locate a first-party page stating this explicitly, so treat "no separate image-transformation charge" as *likely but unverified*. The credit cost table above, which is first-party, does contain no image-transformation row, which is consistent with it.

At my assumed traffic, image bandwidth ≈ 1.6 GB ≈ 32 credits/month, plus a few credits of requests and function compute. **The dominant cost on the Free plan is deployments at 15 credits each**: 300 credits ÷ 15 = 20 production deploys per month before credits are exhausted, before any traffic is served. That is the real free-tier constraint for this project, not media.

*Unverified:* whether Netlify's Free plan permits commercial use. This matters because rejecting Vercel's Hobby tier over exactly that clause is a locked constraint in the map. I could not retrieve Netlify's terms of service to confirm. **This needs checking before anyone relies on Free.**

**Bottom line on cost:** media storage is effectively free (R2, €0). The €5–10/month budget is consumed by Netlify Personal at $9/month, which is the plan that makes deploy cadence and commercial use comfortable. Total ≈ **$9/month**, at the top of budget, with media contributing nothing.

## 4. Image optimisation: Payload vs Next.js vs Netlify

Three layers, and they must not be made to do each other's jobs.

**Payload (build-time, on upload).** Payload uses the Sharp library to crop and resize uploads according to `imageSizes` in the collection's upload config. `formatOptions` passes Sharp format settings to control compression and file type; `resizeOptions` passes Sharp resize settings; `withMetadata` controls whether EXIF etc. is retained. Focal point and crop selectors are enabled by default in the admin panel, and **cropping happens before resizing**, so resized variants derive from the cropped image. Sharp must be present in the Payload config for any of this to work (it is by default in `create-payload-app` projects).
Source: https://payloadcms.com/docs/upload/overview (retrieved 2026-09-19)

**Next.js + Netlify (request-time).** On Netlify, `next/image` is wired to Netlify Image CDN automatically with no configuration: "the `next/image` component uses Netlify Image CDN by default to ensure your images are optimized and served in the most efficient format." The Netlify adapter handles this as part of its automatic setup alongside cache control and on-demand revalidation.
Sources: https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/, https://opennext.js.org/netlify (retrieved 2026-09-19)

Netlify Image CDN serves transforms from `/.netlify/images` with `w`, `h`, `fit`, `position`, `fm` (avif/jpg/png/webp/gif/blurhash) and `q` (1–100, default 75). If no format is given it content-negotiates on the `Accept` header, preferring WebP then AVIF then the original. Transformations are edge-cached and re-run on deploy only if the source image changed.
Source: https://docs.netlify.com/build/image-cdn/overview/ (retrieved 2026-09-19)

**The interaction, and the one piece of required configuration.** Images stored in R2 are *remote* to the Netlify site. Netlify Image CDN will only transform remote sources that are explicitly allowlisted in `netlify.toml`:

```toml
[images]
  remote_images = ["https://media\\.thuisbakery\\.com/.*"]
```

Remote images must be publicly accessible; Netlify does not forward auth headers, so the R2 bucket needs a public custom domain (R2 supports this) rather than signed URLs. Payload's `signedDownloads` option would therefore break the image pipeline and should stay off for the media collection.
Sources: https://docs.netlify.com/build/image-cdn/overview/, https://payloadcms.com/docs/upload/storage-adapters (retrieved 2026-09-19)

*Unverified:* whether the Netlify Next.js adapter auto-populates `remote_images` from `next.config.js` `images.remotePatterns`, or whether both must be set by hand. The Netlify Next.js overview page says nothing about remote domains. **Assume both are needed and verify on first deploy** — the failure mode is images 404ing or silently bypassing optimisation in production only.

**Implication for the SEO/Core Web Vitals priority.** Because Netlify Image CDN does the responsive work at request time, driven by `next/image`'s `sizes`, Payload's `imageSizes` should be kept **deliberately small** — one or two variants at most (a thumbnail for the admin list view, and optionally a capped "large" so a 12 MP original is never the transform source). Generating a full responsive ladder in Payload duplicates what the CDN does, multiplies R2 storage and upload time, and does not improve delivered bytes, because `next/image` will request its own widths regardless. Getting Core Web Vitals right is about `next/image` usage — correct `sizes`, `priority` on the LCP hero image, explicit width/height to avoid CLS — not about how many sizes Payload was told to cut.

## 5. Local development parity

Two halves, and they behave differently.

**Storage: parity is opt-in, and the default pattern breaks it.** Payload's documented idiom is `enabled: Boolean(process.env.S3_BUCKET)` — "allowing local storage fallback during development when AWS credentials aren't configured." That is the *opposite* of what this ticket asks for: it gives the developer local-disk storage and the editor R2, so the two paths are never exercised together.
Source: https://payloadcms.com/docs/upload/storage-adapters (retrieved 2026-09-19)

The fix is straightforward: point local development at a **separate R2 bucket** (a `thuisbakery-media-dev` bucket) with the adapter always enabled. R2 credentials work identically from a laptop and from a Netlify Function — it is a plain S3-compatible HTTPS API with no host-specific binding, which is exactly why Payload recommends the S3 adapter over the Workers-only R2 adapter for Node hosts. Same code path, same adapter, same failure modes, in both places. Cost is unchanged (still inside the free tier).

**Image transformation: `netlify dev` replicates it, `next dev` does not.** Running `netlify dev` provides handlers for `/.netlify/` URLs "including automatically replicating the image transformation behaviour so that you can review appropriately as you build", alongside redirects, functions, edge functions and blob storage.
Source: https://answers.netlify.com/t/how-can-i-use-netlify-image-cdn-while-developing-locally/107154 and Netlify guides (retrieved 2026-09-19) — note this is Netlify's support forum plus developer guides rather than a single canonical docs page; the capability is consistently stated across both.

So the local command should be `netlify dev`, not `next dev`. Under bare `next dev`, `next/image` falls back to Next's own Sharp-based optimiser, which produces *similar but not identical* output to Netlify Image CDN and, importantly, does not exercise the `remote_images` allowlist — the single most likely thing to break on first deploy.

*Unverified:* whether `netlify dev` honours `[images] remote_images` locally with the same strictness as production. Netlify's support forum has a thread titled "Configure remote_images for dev vs. prod", which suggests the two are at least distinguishable in practice. I could not confirm the exact behaviour.

**On Jana's side**, the editor experience is identical either way: she uses the Payload admin panel against the deployed site. The parity question is really about whether *a developer testing an upload* is testing the real thing. With a dev R2 bucket and `netlify dev`, they are.

## Recommendation

**Use `@payloadcms/storage-s3` pointed at a Cloudflare R2 bucket with a public custom domain, keep Payload's `imageSizes` to one or two variants, and let Netlify Image CDN via `next/image` do the responsive work.** Run local development against a second R2 bucket with the adapter always enabled, and use `netlify dev` rather than `next dev`.

This is the recommendation because R2 is free at this scale and stays free with free egress, the S3 adapter is the route Payload's own docs name for Node.js hosts on Netlify, the adapter is released in lockstep with Payload core, and nothing in the path is Netlify-specific — if hosting moves later, the media layer does not.

Specifically reject: `@payloadcms/storage-r2` (Workers-only, beta), Netlify Blobs (no adapter exists), Vercel Blob (paying the rejected platform), and UploadThing (third vendor, per-GB billing for something R2 gives away).

**The main risk is the remote-image allowlist.** Images live on a domain Netlify does not own, so Netlify Image CDN will only transform them if `remote_images` in `netlify.toml` matches the R2 custom domain — and I could not verify whether the Next.js adapter populates that from `next.config.js` or whether it must be written by hand. If it is wrong, images break or silently skip optimisation **in production only**, which lands directly on the project's top priority. Mitigate by setting both `next.config.js` `images.remotePatterns` and `netlify.toml` `[images] remote_images` explicitly, and checking on the very first deploy that image URLs are being served through `/.netlify/images` rather than hitting R2 directly.

Two secondary risks worth naming: whether Netlify's Free plan permits commercial use is **unverified**, and it is the exact clause that ruled out Vercel Hobby — check the terms before assuming Free is available, and budget for Personal at $9/month, which also relieves the 20-production-deploys-per-month ceiling that 300 free credits imposes. And "Netlify does not separately meter image transformations" is consistent with the first-party credit table but not something I could confirm on a first-party page.
