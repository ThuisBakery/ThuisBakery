# Enquiry delivery pipeline

Status: accepted (2026-09-21)

An Enquiry is **stored first and emailed second**, by a Next route handler, protected by managed
services rather than hand-rolled ones, with the customer's Inspiration photo downscaled in the
browser so that no public upload endpoint exists.

## The pipeline

A single `POST` route handler owns the whole sequence:

1. `checkBotId()` (BotID Basic) and a honeypot field.
2. Create the Submission through Payload's local API.
3. Send two emails via Resend: the Enquiry to Jana, the acknowledgement to the customer.
4. Return the confirmation page **whether or not step 3 succeeded**.

The email bodies and the Estimate snapshot are pure functions in `src/domain`, per ADR-0005; the
route is the thin I/O shell around them.

**Store-then-send, and never fail the customer on our own delivery problem.** The Submission is the
durable artifact; the emails are notifications about it. A customer who filled the form in correctly
is never told it failed.

A Payload `afterChange` hook was rejected for the sending. It fires when *Jana edits a submission in
the admin*, which would silently re-email a customer, and a collection hook that does I/O is exactly
what ADR-0005's testable-seam rule exists to avoid.

## Email

**Resend**, via `@payloadcms/email-resend` — Payload's own documentation recommends it over
Nodemailer on serverless for being lightweight. Free tier: 3,000/month, **100/day**, 30-day log
retention.

**DNS is the delicate part, because Google Workspace already owns the root SPF record** and
`thuisbakery.com` has real mail on it (`MX 1 smtp.google.com`, `v=spf1 include:_spf.google.com
~all`). The chosen shape sends from an unqualified `@thuisbakery.com` address **without editing the
record Jana's mailbox depends on**:

- Resend DKIM at `resend._domainkey.thuisbakery.com`
- Resend's SPF and MX on a `send.` subdomain (the return path only; invisible to customers)
- Google's root SPF untouched
- **A DMARC record added at `p=none`**, because there is currently none at all

DMARC starts at `p=none` deliberately. Publishing `p=reject` against a live Google Workspace mailbox
with no prior monitoring is how real mail disappears silently. Tightening it is a launch-checklist
item, not a launch blocker.

`Reply-To` is the customer on Jana's copy and Jana on the customer's copy, so answering is one tap
from her phone. **The conversation then leaves the site entirely** — no threading, no status
tracking. That is correct for v1 and consistent with "no accounts, no payments".

**Both emails are written in fixed language, and no message is ever machine-translated.** The
acknowledgement follows the customer's locale. Jana's copy is **always English** — her home language
— which also squares with the admin being English by explicit setting (issue #10). The customer's
free text is passed through verbatim in both.

**The 100/day cap is accepted as a monitored risk, not designed around.** The failure it creates is
the one this whole ticket exists to prevent: a spam burst burns the quota and real Enquiries then
fail silently. BotID and the WAF rule are what actually protect it; the delivery status field is what
detects it; the escalation is Resend at $20/month, which the budget can absorb in an emergency
despite the standing 5–10 EUR line.

## The Inspiration photo

**Downscaled in the browser** — long edge ~2000px, re-encoded JPEG, roughly 1 MB — and posted
through the site's own route. Every file then sits comfortably under the 4.5 MB function body limit,
**which means there is no public upload endpoint at all.**

This was not the first design. Vercel Blob client uploads were the obvious route for phone-sized
photos, and they were rejected on a specific point: `onBeforeGenerateToken` is documented as the
place to "authenticate and authorize users", and a public Enquiry form has no session to check.
Substituting BotID for authorization there would have been bending the tool, and would have left a
token-minting endpoint open to the internet and billable to the project. Downscaling removes the
surface rather than guarding it.

Quality loss is irrelevant: Jana glances at a reference photo, she does not print it.

The remaining guards, in order:

1. One photo per Submission, hard reject over 5 MB post-downscale.
2. **Server-side magic-byte sniffing** — the declared MIME type is never trusted.
3. **Re-encoded server-side**, so the stored file is not the attacker's bytes, and EXIF is stripped
   (a phone photo carries GPS coordinates of the customer's home).
4. Random filename, `access: 'private'`.

**The photo lands in a Blob store separate from the CMS media store.** Different access, different
lifetime, different trust level — and it guarantees a stranger's upload can never be one focal-point
misclick away from appearing in the illustrated menu of ADR-0004.

## Spam protection: managed, not hand-rolled

- **Vercel BotID Basic** — free on all plans, invisible, `checkBotId()` on the submit route. This is
  its documented purpose: high-value routes such as checkouts, signups and forms.
- **Vercel WAF rate limiting** — a dashboard rule keyed on IP, roughly 5 requests per 10 minutes on
  the Enquiry route, starting in **Log** action for the first week so real traffic is observed before
  anything is blocked.
- A honeypot field.

**Cloudflare Turnstile was available and was declined.** The vendor objection that removed Cloudflare
from the stack (issue #15) does not apply to Turnstile, so it was judged on merit and lost on one
point: Turnstile can show an interactive challenge, and the single conversion event the entire
business depends on is the one place that cannot afford friction. Turnstile is the named fallback if
BotID Basic proves too soft; the paid escalation is BotID Deep Analysis at $1/1000 checks.

Rate limiting lives in the WAF rather than in application code **because this stack has no KV store
to put a counter in**, and adding one to hold a spam counter would be a poor trade. Known sharp edge:
WAF counters are tracked **per region**, so the true ceiling is a multiple of the configured number.

## Storage, retention and failure

**One Submission collection** with an `enquiryType` discriminator (`item` / `custom-order` /
`contact`), per ADR-0003. Public `create`; admin-only `read`, `update` and `delete`.

Two fields earn their place:

- **The Estimate is stored as a snapshot** — the figure and its line items, never recomputed. Prices
  change, and an Enquiry must always show what the customer was actually quoted.
- **The submitted locale is stored**, so Jana knows which language to reply in without inferring it
  from the text.

**Delivery status** is a field on the Submission, updated by a Resend webhook, filterable in the
admin. Retry logic was rejected as over-engineering at this volume. Its honest limit is that it only
helps if Jana opens the admin, and the whole design assumes she lives in her inbox — so the real
guard against silent loss is the **confirmation page acting as the customer's receipt**, telling them
to get in touch directly if they hear nothing within the stated Lead time. That turns a lost Enquiry
into a customer who follows up.

**Retention runs on one daily Vercel cron at 03:00**, hitting a secured route:

- Inspiration photo **hard-deleted at 12 months**.
- Submission **anonymised at 24 months** — name, email, phone and photo stripped; Item, Size, date
  and Estimate kept.

Anonymising rather than deleting holds the same GDPR position, since what remains is no longer
personal data, while preserving the only genuinely valuable thing in that table: what sold, at what
size, in which month. Cron is effectively free — Pro allows 100 jobs at per-minute precision, and the
only charge is the function invocation.

This is the project's **first scheduled infrastructure**, and it is a deliberate exception: issue #10
turned `schedulePublish` off precisely because there is no job queue. Accepted here because the
alternative is a retention policy that exists only on paper and that Jana would have to execute by
hand.

## GDPR

Resend is a compliant processor: a DPA with Standard Contractual Clauses, EU–U.S. Data Privacy
Framework certification, AES-256 at rest, SOC 2 Type II.

**The detail that is easy to miss, and is accepted knowingly:** choosing the `eu-west-1` region
controls only where mail is *dispatched from* (Ireland). **Account data, email metadata and logs
live in the United States regardless of region.** That is a US transfer of customer contact details.
It is lawful under the SCCs and the DPF — GDPR requires a lawful transfer basis, not EU soil — but it
is a **disclosure obligation**, not a non-event.

Full EU residency was considered and declined: Mailgun EU or Scaleway TEM over SMTP would keep every
byte in Europe, at the cost of giving up the first-party Payload adapter that exists because it is
lightweight on serverless. The gain was judged to be compliance theatre for a bar GDPR does not set.

Region is chosen **per domain at setup** and is awkward to change afterwards. Set it to `eu-west-1`
first time.

### Required privacy policy disclosures

Four disclosures follow from this ADR and must appear in the privacy policy ADR-0003 commits to.
Writing and reviewing the text belongs to the launch checklist (issue #17); knowing what processing
actually happens belongs here, next to the decision.

1. **Resend** as processor for transactional email, **including the transfer of personal data to the
   United States** under SCCs and the EU–U.S. Data Privacy Framework, with 30-day log retention.
2. **Retention periods**: Inspiration photo 12 months, Submission anonymised at 24 months.
3. **Vercel** as host and as storage processor (Blob), and Neon as database processor.
4. **Vercel Web Analytics**, cookieless, per ADR-0003 — no consent banner, since there are no
   non-essential cookies.

Worth stating plainly on the launch checklist: a home bakery in the Netherlands is a **data
controller** with real obligations, and the finished page deserves a human reading it.
