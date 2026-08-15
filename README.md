# Musawo — Rate Uganda's Health Workers

A web app where anyone can look up a licensed Ugandan health professional (doctor,
nurse, pharmacist, allied health professional), see patient ratings, and leave
their own rating.

## How it works

1. **`scripts/scrape.py`** — scrapes the **public** Uganda Health Professionals
   Portal (`ehealthlicense.go.ug`) and saves every licence record to
   `data/health_workers.jsonl`. It captures name, council, registration
   no/date, licence number/expiry/status, qualifications and (when published)
   the practitioner's **photo**. It is polite (small concurrent worker pool,
   retries, checkpointed & resumable) and only uses the unauthenticated search
   endpoint.
2. **`supabase/schema.sql`** — the Postgres schema (tables, indexes, Row Level
   Security, views). Applied with `npm run db:setup` or in the Supabase SQL
   Editor.
3. **`scripts/import_supabase.mjs`** — collapses the per-licence rows into one
   **practitioner per (name + council)** (the portal stores one row per annual
   licence, so the same person appears several times), upserts them into
   Supabase, and keeps the full licence history in `licenses`. It never touches
   `ratings`, so community ratings survive registry refreshes.
4. **Next.js app** — search/browse, detail pages and the rating form, all backed
   by Supabase (PostgREST + RLS).

> Photo note: the portal only renders a photo on cards where the practitioner
> uploaded one (doctors & allied health often have photos; many nurse records
> don't). Where there is no photo we show a name-initials avatar.

## Prerequisites

- Node.js **22.5+** (tested on 24)
- Python 3 (for the scraper; stdlib only)
- A Supabase project

## Setup

```bash
# 1. install JS deps
npm install

# 2. add Supabase credentials to .env.local
#    NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (Dashboard →
#    Connect → Next.js) and SUPABASE_DB_URL (Connect → Session pooler — used only
#    by the scripts below)
cp .env.example .env.local   # then fill in values

# 3. create the tables (or paste supabase/schema.sql into the SQL Editor)
npm run db:setup

# 4. scrape the registry (all ~121k licence records). Resume-safe:
npm run scrape             # ~1–1.5 h at a polite pace

# 5. load the registry into Supabase
npm run import

# 6. run the app
npm run dev                # http://localhost:3000
```

`npm run import` is safe to re-run any time: it rebuilds the registry tables but
**preserves user ratings**.

## Listings board & admin panel

The site has a jobs/opportunities board (`/posts` — jobs, internships,
scholarships, grants, fellowships, conferences…). Anyone can post a listing from
`/posts/new`; submissions are **held for moderation** and only go live once an
admin approves them.

### Criteria for user-submitted listings
- A genuine job, internship, scholarship, grant, fellowship, conference or other
  healthcare opportunity (Uganda or remote).
- Title, organisation, a full description and a **valid contact email** are
  required (the email is used only for moderation follow-up — never shown
  publicly).
- No asking applicants to pay money or registration fees — such posts are
  rejected.
- Photos are allowed (JPG/PNG/WebP, ≤ 4 MB) and must be relevant + rights-cleared.
- Duplicate listings (same title + deadline) are rejected automatically.

### Admin panel (`/admin`)
Sign in at `/admin` with the admin passcode.

Set-up (once):
1. Add `ADMIN_PASSCODE` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` (local
   dev) — see `.env.example`. On Cloudflare deploy, set them as secrets:
   `wrangler secret put ADMIN_PASSCODE` and
   `wrangler secret put SUPABASE_SERVICE_ROLE_KEY`.
2. Make sure `supabase/schema.sql` is up to date: `npm run db:setup`.

What the admin can do:
- **Moderation queue** on the dashboard — approve (publish), reject (with a
  reason), or delete pending submissions.
- **Edit any listing** — content, photo, tags, featured, publish/unpublish,
  expire, archive.
- **Create listings directly** (`/admin/posts/new`), published immediately or as
  a draft.

Moderation states: `draft` (pending) → `published` | `rejected` | `expired` |
`archived`. Only `published` listings are visible on the public board.

## Project layout

```
app/                      # Next.js (App Router)
  page.tsx                # landing + search
  practitioners/[id]/     # practitioner profile + ratings
  api/practitioners/      # search API
  api/ratings/            # POST rating (validated + rate-limited)
  api/posts/              # POST listing (moderated, draft-first)
  api/admin/              # admin login/logout + posts CRUD/moderation
  admin/                  # admin panel (login, dashboard, listings manager)
  posts/new/              # public "post a listing" form
components/               # search UI, cards, star widgets, rating form, admin
lib/
  supabase/server.ts      # Supabase client (publishable key + RLS)
  supabase/admin.ts       # Supabase client (service-role, admin only)
  admin-auth.ts           # passcode session signing / cookie helpers
  admin-posts.ts          # admin CRUD + moderation data layer
  posts.ts                # public listings query layer
  practitioners.ts        # query layer
  types.ts
supabase/schema.sql       # tables, RLS, views, indexes
scripts/
  scrape.py               # registry scraper (checkpointed, concurrent)
  setup_supabase.mjs      # applies schema.sql
  import_supabase.mjs     # JSONL -> Supabase (upsert, preserves ratings)
data/                     # generated (gitignored): health_workers.jsonl
reference/                # static assets you downloaded from the portal
```

## Notes

- **RLS**: the public registry is readable by everyone; anyone may **insert** a
  rating; only the service role / direct SQL can write to `practitioners` and
  `licenses`. See `supabase/schema.sql`.
- **Ratings**: anyone can rate 1–5 stars with an optional comment. A simple
  in-memory rate limiter (5/hr/IP) guards against spam; in production you'd add
  a persistent store + a moderation queue (ratings have a `verified` flag).
- **Licence status** is exactly as published by the portal — verify with the
  regulator for anything critical.
- The default search filter shows practitioners with an **Active** licence;
  switch to "All" to include expired ones.

## Name ideas

The brand is currently **Musawo** (Luganda for *health worker*) — swap it via the
few occurrences of the string in `app/layout.tsx` and `app/about/page.tsx`.

Candidates, best first:

| Name | Why it works |
| --- | --- |
| **Musawo** | Luganda for “health worker” — warm, familiar, local |
| **Daktari** | Swahili for doctor — easy, recognizable across E.Africa |
| **CheckUp UG** | Clear + modern; implies verify-then-before-you-go |
| **RateYadaktari** | Playful, memorable, says exactly what it is |
| **Omusavo** | Luganda for “doctor/healer” |
| **Vouch** | Short, trust-focused, brandable |
| **SecondOpinion.ug** | Signals patient-to-patient advice |
| **The Big Stethoscope** | Friendly, distinctive |
