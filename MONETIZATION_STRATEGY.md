# Musawo — Monetization Strategy

Ideas discussed for turning the site's traffic and data into revenue. Ordered
roughly by priority. Each section is self-contained so items can be implemented
one by one.

---

## 1. Profile claiming — UGX 5,000 (core product)

Practitioners pay a one-time fee to claim their auto-generated profile page and
unlock paid features.

### What paying unlocks (free tier stays exactly as it is today)

- Verified licence badge on the profile
- Phone & WhatsApp button — patients contact them directly
- Workplace, specialties, bio, social links
- Featured placement in search results (later)

### Claim flow (low-friction, Zocdoc-style — verify against registries, not documents)

Zocdoc's lesson: verification is automated against authoritative sources
(primary source verification), documents are only a fallback, and abuse is
handled reactively by Trust & Safety. We hold the primary source itself (the
scraped registry), so:

1. **Instant auto-match** (`/claim` page): practitioner searches their name,
   selects their profile, enters full name + MoMo number. An API route checks
   the name against the registry record (token overlap) — no email round-trip.
2. **Payment as the identity filter** (`POST /api/claims` → MarzPay
   `collect-money`, UGX 5,000 STK push). Impostors are unlikely to pay; the
   payer's registered MoMo name is a soft identity signal for later review.
3. **Trust-on-publish, verify-on-dispute**: matched + paid claims go live
   immediately (edits still can never touch registry fields). Certificate/ID
   photo verification is only requested when: the name doesn't match cleanly,
   the profile was already claimed, or someone reports it.
4. **Automatic re-vetting**: every registry re-scrape flags claimed profiles
   whose licence has expired — `npm run import` *is* the annual re-vetting.

### Implementation (built)

- `supabase/schema.sql`: `practitioners.claimed`, `claim_requests`
  (status matched→processing→paid|failed), `profile_details`. A partial unique
  index enforces **one paid claim per practitioner, ever** at the DB level.
- `POST /api/claims` — auto-match + initiate MarzPay collection (UUID reference)
- `GET /api/claims/[id]` — status polling for the payment screen
- `POST /api/webhooks/marzpay` — idempotent final-status handler (direct and
  dashboard-wrapped payloads, optional HMAC via `MARZPAY_WEBHOOK_SECRET`);
  marks paid + flips `practitioners.claimed`
- `/claim` page (`components/ClaimFlow.tsx`) — search → details → STK push →
  live polling → success. "Pay once. Yours forever." messaging throughout;
  price shown as ~~UGX 9,900~~ → **UGX 5,000**
- Banner CTA now links to `/claim`; `/contact?topic=claim` remains as fallback

### Rules that stay non-negotiable

- Approve identity **before** requesting payment was replaced by
  trust-on-publish (see flow above); disputes trigger document verification
- Edits never touch registry fields (name, licence, council, status stay
  scraper-owned) — `npm run import` cannot clobber them
- Ratings/reviews are untouchable; payment must never affect rating visibility
- Audit trail of who changed what; one active claim per practitioner
- Visible "report this profile" link; disputed claims freeze pending
  re-verification with certificate evidence
- Never trust client-side "I paid" — flip status only from a verified MarzPay
  webhook transaction uuid or an admin action

### Schema sketch (when building)

```
claim_requests:   id, practitioner_id, requester_name, phone, email,
                  licence_no_submitted, message,
                  status (pending|contacted|paid|approved|rejected),
                  marzpay_reference, marzpay_txn_uuid, created_at, reviewed_at
practitioners:    + claimed boolean default false, claim_approved_at timestamptz
profile_details:  practitioner_id (pk/fk), phone, whatsapp, workplace,
                  bio, specialties text[], website, facebook, x, updated_at
```

Edit access: scoped passcode per practitioner using the same signed-cookie
pattern as admin auth (`lib/admin-auth.ts`), at `/practitioners/[id]/edit`.
No Supabase Auth needed.

---

## 2. Featured facility listings (highest value per client)

Hospitals, clinics and pharmacies have marketing budgets; individuals don't.

- Basic listing stays free; **featured placement = top of search results in
  their area**
- Realistic pricing: UGX 50–300k/month depending on city/competition
- The contact form already plants this: facility topic has an "I'm interested
  in" dropdown with "Featured listing (top of search)"
- Reassurance copy in place: *"Basic listings are free. Featured placements put
  you at the top of search results in your area."*
- Build next: a "Featured listing" pitch section on facility pages + pricing

---

## 3. Jobs board — paid postings from recruiters

The `/posts` board + newsletter audience form a two-sided market where both
sides are already in hand (~1,000 subscribers targeted to grow; plus a large
recruiter email list).

### The critical rule: sell access, never the list

Subscribers opted in for job alerts. Selling their emails breaches consent
(Uganda Data Protection and Privacy Act) and kills trust. Be the middleman:
recruiter pays → job goes to the audience through *our* channels → candidates
apply on *our* site → recruiter sees results but never touches the list.

### Offer tiers

| Tier | Price idea | What they get |
| --- | --- | --- |
| Standard post | UGX 50k | Listing on /posts + included in next digest |
| Featured post | UGX 150k | Pinned top, highlighted card, first in digest |
| Segmented blast | Premium | Sent only to e.g. nurses in Central Region (we collect profession/region preferences) |
| Newsletter sponsorship | Monthly | One sponsored slot at top of each digest |

Why 1,000 subscribers is enough: hyper-targeted licensed health workers in one
country beat a generic big list. Segmentation is the value.

### Steps

1. Email the recruiter list now: "Post your healthcare job to 1,000+ verified
   Ugandan health workers — launch price UGX 50k"
2. Add a payment step (same MarzPay flow as below)
3. Track views/clicks per posting and report numbers back to recruiters —
   retention comes from proof

---

## 4. Ambulance directory placements

Small niche, near-zero resistance: providers live on emergency calls, so a
verified directory entry with a direct call button has obvious ROI.

- Registration flow exists (`/ambulances`, moderated approvals)
- Add a modest listing/placement fee or featured tier once approved providers
  see traffic

---

## 5. Payments — MarzPay (mobile money)

Pattern proven in `touchedhearts`; ports 1:1 because this app's API routes
already run as serverless functions on Cloudflare Workers (OpenNext):

- `api/donate.js` equivalent → POST route calling MarzPay `collect-money`
  with fixed amount and `reference = <claim/post id>`
- `marzpay-webhook.js` equivalent → webhook route flipping status only after
  verifying the transaction uuid server-side
- Cards optional later; MTN MoMo / Airtel Money are the realistic rails

---

## 6. Contact-form funnel (done, keep feeding)

All topics are monetization-aware (`components/ContactForm.tsx`):

| Topic | Capture | Monetization angle |
| --- | --- | --- |
| claim | licence details request | Core product (section 1) |
| facility | type/location/plan-interest dropdowns | Featured-listing upsell (section 2) |
| partner | partnership type + indicative budget | Pre-qualifies advertisers/data deals |
| listing_issue | issue type incl. "someone claimed my profile wrongly" + URL | Protects claim-product trust; dispute intake |
| job_seeker | profession + needs | Feeds newsletter audience (section 3) |
| press | outlet + urgency | Triage |

---

## 7. Growth levers that make everything above work

- Traffic scales revenue: every SEO landing page (practitioners, professions,
  locations, facilities) is a potential claim/facility/recruiter lead
- Warmest claim leads: practitioners whose profiles **already have ratings** —
  email/WhatsApp them ("your patients are talking about you")
- Keep trust sacred: payment never influences ratings or hides reviews; one
  screenshot of pay-to-hide ends the whole business
- Show proof everywhere: view counts, click counts, subscriber numbers —
  retention comes from measurable results

---

## 8. Community support donations ("we don't run ads")

A lightweight, optional donation modal targeting readers — job-seekers,
patients, and general visitors — who get real value from the platform for
free and may want to contribute.

### Rationale

- The jobs board, practitioner registry, and facility directory are all free
  for end-users; a transparent "no ads, help us keep going" ask is honest and
  tends to land well with users who have already seen value
- MarzPay plumbing is already live — the payment implementation is trivial
- 1,000 UGX is the floor (removes psychological barrier while covering MTN
  processing costs); allow the user to choose any amount above that
- Wikipedia and Signal have proven this model works at a fraction of their
  traffic, especially when the ask is tied to specific user benefit ("free
  jobs board, no ads, yours to use forever")

### UX rules (critical)

- **Never show alongside the claim banner** — if the claim banner has been
  shown in the current session, suppress the support modal entirely. Two
  financial asks in one session is too much.
- **Audience: readers, not practitioners.** Show only on post/job/facility
  pages; suppress on `/practitioners/[id]` pages (claim funnel targets those).
- **Trigger late** — after the user has scrolled a post to the bottom, or
  has visited 2+ pages in the session. Not on arrival.
- **One-time only, no recurring.** Avoid subscription complexity until there
  is clear demand for it.
- **Dismiss cooldown: 30 days** (longer than the claim banner's 7 days,
  because the ask is softer and should feel rarer).

### Implementation sketch (when building)

- `POST /api/donate` — same MarzPay `collect-money` pattern as claims,
  fixed or user-chosen amount, reference = `support-{uuid}`
- `POST /api/webhooks/marzpay` — already handles unknown references
  gracefully; extend it to log support donations to a `donations` table
- Modal: slide-up sheet on mobile (same pattern as `ClaimBanner`), phone
  input + amount selector (1k / 2k / 5k / other), MarzPay STK push,
  single success screen. No polling needed — close on push sent, thank user.
- Copy: "Rate Musawo is free and has no ads. If it helped you find a job,
  verify a doctor, or reach a hospital, a small contribution keeps it going."

### Implementation order

Add this only after the recruiter paid-posting tier (section 3) and the
facility featured-listing pitch (section 4) are live. Donations are
supplementary revenue; commercial streams should come first.

---

## Suggested implementation order

1. [x] Claim banner + contact funnel (done)
2. [x] Claim flow with MarzPay payment + webhook (done — needs schema applied + wrangler secrets)
3. [ ] Recruiter outreach emails + paid posting tier on /posts
4. [ ] Facility "featured listing" pitch + pricing page
5. [ ] Practitioner edit UI (passcode-gated) writing to profile_details + audit log
6. [ ] Newsletter sponsorship slot template
7. [ ] Featured search placement for claimed profiles
8. [ ] Community support donation modal (section 8 — after 3 and 4 are live)
