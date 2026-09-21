# Launch checklist

What must be true before thuisbakery.com goes live, and what follows it.

Written in English throughout. The owner-side items are phrased so they can be copied to Jana
as-is; the build-side items she never needs to see.

Settled in issue #17. The decisions behind the shape of this list are recorded there; this file is
the working document, not the argument.

---

## The state of the domain, as of 2026-09-21

Verified against live DNS and whois, not assumed. Four facts change how the cutover is done:

| | Who |
|---|---|
| Registrant (owner) | You / Jana — unchanged by any of this |
| Registrar | **Squarespace Domains II LLC** (IANA 895) |
| DNS operator | **Squarespace** — `nsd1–4.squarespacedns.com` |
| Mail | **Google Workspace** — `MX 1 smtp.google.com` |

1. The domain is registered at **Squarespace**, not Google. It was almost certainly bought inside
   the Google Workspace signup flow, which registers through Squarespace — which is why it feels
   like Google owns it and why the Workspace admin console links out to "manage domain". Google's
   only role is the mailbox.
2. The apex and `www` currently serve a Squarespace **"Coming Soon" parking page**. Nothing is
   deployed, there is no sitemap and no content — so **there are no legacy URLs to redirect**.
   Nothing needs cancelling; only the registration renewal needs to stay alive.
3. **The domain is DNSSEC-signed** (`signedDelegation`, DS record published at the registry).
   Changing nameservers while that DS record stands breaks the domain outright — validating
   resolvers stop answering, and that takes **Jana's live mail down with the website**. This is the
   one operation on this list that can cause a real outage.
4. `clientTransferProhibited` is set (registrar lock). Created 2026-07-02, so the 60-day
   post-registration transfer lock has expired: a transfer is legal, just not wanted.

**Therefore: nameservers do not move at launch.** Every record below is *added* at Squarespace.
Google's root `MX` and root SPF are never edited — which is the same commitment ADR-0006 made when
it put Resend's SPF and MX on a `send.` subdomain. Moving off Squarespace is a legitimate thing to
want, and it is a dated follow-on item below, sequenced around DNSSEC, for a week when nothing else
is moving.

---

## Blocks launch

Nothing here is optional. The site does not go live with any of it outstanding.

### DNS and serving

- [ ] Drop the TTL on the apex `A` and `www` records at Squarespace **a day ahead** of the flip.
- [ ] Add the domain in Vercel and let it **issue the certificate against the existing DNS first**,
      before any record changes. This is what removes the window where the domain resolves to
      nothing.
- [ ] Flip the apex `A` and the `www` `CNAME` to Vercel.
- [ ] `www` → apex **308 redirect**, configured in Vercel. The **apex is canonical** — it is what
      people type and what inbound links land on (ADR-0002).
- [ ] Do **not** touch nameservers or DNSSEC. Do **not** edit the root `MX` or root SPF.
- [ ] Confirm mail still flows: send a message to and from Jana's Workspace address after the flip.

### Email (ADR-0006)

- [ ] Resend domain verified: DKIM at `resend._domainkey.thuisbakery.com`, and Resend's SPF and MX
      on the `send.` subdomain. All additive; the root SPF stays as Google wrote it.
- [ ] **Set the Resend region to `eu-west-1` at setup.** Region is chosen per domain and is awkward
      to change afterwards — getting this wrong is expensive to undo.
- [ ] Publish DMARC at **`p=none`** with `rua=mailto:<Jana's Workspace address>`.
      There is no DMARC record on the domain today, so this is new, not an edit.
      Note for Jana: **the reports are unreadable XML and you should ignore them.** Their purpose
      is that someone can ask for them when something breaks.

### The Enquiry path works end to end

- [ ] Submit one **real** Enquiry through the live site and verify, in order:
      the Submission is stored in Payload; Jana's email arrives; the customer acknowledgement
      arrives; `Reply-To` is the customer on Jana's copy and Jana on the customer's copy; the
      delivery-status webhook writes back to the Submission.
- [ ] BotID (`checkBotId()`) live on the Enquiry route, honeypot field present.
- [ ] Vercel WAF rate-limit rule live on the Enquiry route, in **Log** action — not Block.
      Real traffic is observed for a week first (ADR-0006).

### Content and legal

- [ ] **Privacy policy live in both locales**, carrying ADR-0006's four required disclosures:
      Resend as processor **including the transfer of personal data to the United States** under
      SCCs and the EU–U.S. Data Privacy Framework, with 30-day log retention; the retention periods
      (Inspiration photo 12 months, Submission anonymised at 24); Vercel as host and Blob storage
      processor and Neon as database processor; Vercel Web Analytics, cookieless, no consent banner.
      **A human reads the finished page.** Jana is a data controller processing strangers' names,
      email addresses, phone numbers and photographs of their homes — this is an obligation, not a
      footer decoration.
- [ ] Every Published Item is **complete in both Dutch and English**. Published is a whole-document
      state, never per locale (issue #10, `CONTEXT.md`). Nothing half-translated goes live.
- [ ] **Dutch route segments confirmed by Jana.** `taarten`, `lekkernijen`, `maatwerk`, `over-jana`
      in ADR-0003 are this repo's guesses. They are URLs, and URLs are expensive to change after
      launch. The page name need not match the Category name.
- [ ] **Nibbles' display name and price from Jana.** It is in ADR-0003's Category ladder but absent
      from her printed menu card — which also calls Bento "Cheeky Bento Cakes". Travels with the
      Dutch wording above.

### SEO machinery

- [ ] `robots.txt` live, referencing the Payload-driven sitemap; admin blocked, both locale trees
      permitted (ADR-0002).
- [ ] hreflang alternates **reciprocal and self-referencing**; every locale URL self-canonicalises.
      An untranslated Item has no URL in the other locale and the translated page omits its
      alternate — an alternate pointing at a 404 breaks reciprocity.
- [ ] **Search Console: one Domain property**, verified by DNS TXT at Squarespace. It covers the
      apex, `www` and both locale trees in a single property. Submit the sitemap.
      (A Domain property, not URL-prefix: URL-prefix covers one exact address only, so you would end
      up with several and the data split between them.)

### The design holds up

- [ ] **Rough photography in place.** ADR-0004 makes photography load-bearing — every cell of the
      illustrated menu is a photograph doing real work — so the build cannot be judged on
      placeholders. Rough unedited shots from Jana are enough. This is the gate on trusting the
      direction; the finished photography is out of scope.
- [ ] **Phone-width check** of ADR-0004's collapse rules. They were declared per section and never
      visually verified, and the whole design read rests on a customer deciding one-handed on a
      phone.

### Handover

- [ ] **Jana adds one Item herself, unaided**, on the deployed admin, and is walked through Live
      Preview. She must be told the publish rule explicitly: **an Item is live only when it is
      complete in both languages.** That is a handover rule, not something the software enforces
      for her.

---

## Follows launch

Each of these has a trigger. "Eventually" is not one.

- [ ] **Google Business Profile: create it, choose the category, expect video verification.**
      Deliberately scoped out of the spec (issue #17) and reduced to this line. Read the note under
      *Known trade* below before deciding it does not matter.
- [ ] **Ask every customer for a review, every time.** A standing habit, not a task to tick off.
      This is the prominence half of Google's local ranking, it compounds, and it costs nothing.
- [ ] **WAF rule: Log → Block** after one week of observed traffic (ADR-0006).
- [ ] **DMARC → `p=quarantine` at 30 days**, once Resend and Google are both confirmed passing.
      **→ `p=reject` after another 30 clean days.** Publishing `p=reject` against a live Workspace
      mailbox with no prior monitoring is how real mail disappears silently.
- [ ] **The first real editing session measures the admin cold start.** The number is published
      nowhere and only a real deploy yields it (issue #15). ADR-0001's Render/Fly escalation
      triggers hang off it, so it stays a guess until someone times it.
- [ ] **NL directory listings**, with NAP consistent everywhere.
- [ ] *(Optional, deliberate, and not during a cutover)* **Move off Squarespace DNS.** Disable
      DNSSEC at Squarespace; **verify** the DS record has expired from resolver caches rather than
      assuming it; re-create the Google `MX` and root SPF by hand at the new provider; only then
      flip nameservers. Do it in a week when nothing else is moving.

---

## NAP

One exact string, matching on the site, the Business Profile, the JSON-LD and every directory
listing. With the address withheld (ADR-0002), the "A" is a service area, not a street:

- **Name:** `ThuisBakery` — exactly, with no location suffix. Google penalises keyword-stuffed
  Profile names and "ThuisBakery Uithoorn" is the classic form of it.
- **Address:** none. **Uithoorn as the service area.**
- **Phone:** Jana's mobile.

The trade accepted on the phone number: a second business line is a monthly cost and a second thing
to answer, and ADR-0006 already assumes she lives in her inbox and replies from her phone. The
consequence is that the number becomes **public and permanent** — changing it later means editing
every listing.

---

## Known trade, recorded so nobody rediscovers it as a surprise

The local-SEO research (issue #7) found that the decisive ranking lever for this business is
**off-site**: Google ranks the local pack on relevance, distance and prominence, prominence is
driven by reviews and links, and all three are read from the Business Profile rather than from the
website. Structured data does not affect ranking at all — only rich-result eligibility.

Scoping Business Profile setup down to a single checklist line is therefore the project choosing to
leave its single largest lever unpulled at launch. That was the owner's call and it is taken. It is
written here because the alternative is someone concluding in six months that the site
underperforms and looking for the answer in the code.

The address decision compounds it, and is recorded in ADR-0002 rather than here.
