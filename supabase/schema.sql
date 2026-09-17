-- ============================================================================
-- Musawo · Supabase schema (project: afyarate)
-- Run this in the Supabase SQL Editor, or automatically with:
--     node scripts/setup_supabase.mjs
-- Idempotent: safe to run multiple times.
-- ============================================================================

-- Trigram index support for fast name search (ILIKE '%...%')
create extension if not exists pg_trgm;

-- ----------------------------------------------------------------------------
-- 1. Practitioners, one row per person (collapsed from licence records)
-- ----------------------------------------------------------------------------
create table if not exists public.practitioners (
  id bigint primary key,               -- source record id (data-key), stable
  name text not null,
  council text,
  registration_status text,
  registration_no text,
  registration_date text,
  license_number text,
  license_expiry_date text,
  licence_status text,
  qualifications text,
  image_url text,
  record_count integer not null default 1,
  search_name text not null default '', -- lowercased name, for ILIKE search
  profession text,                       -- derived cadre, set at import time
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Keep existing tables up to date on re-runs (create table if not exists won't alter).
alter table public.practitioners add column if not exists profession text;

-- ----------------------------------------------------------------------------
-- 2. Licenses, full licence history per practitioner (portal stores one row
--    per annual licence, so a person usually has several)
-- ----------------------------------------------------------------------------
create table if not exists public.licenses (
  id bigint primary key,
  practitioner_id bigint not null references public.practitioners (id) on delete cascade,
  name text,
  council text,
  registration_no text,
  registration_date text,
  license_number text,
  license_expiry_date text,
  licence_status text,
  qualifications text,
  image_url text
);

-- ----------------------------------------------------------------------------
-- 3. Ratings, community ratings, one per submission
-- ----------------------------------------------------------------------------
create table if not exists public.ratings (
  id bigint generated always as identity primary key,
  practitioner_id bigint not null references public.practitioners (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  reviewer_name text,
  created_at timestamptz not null default now(),
  verified boolean not null default false
);

-- ----------------------------------------------------------------------------
-- 3b. Posts, curated listings board (jobs, opportunities, grants,
--     scholarships, fellowships…). One table for all listing kinds; a new
--     listing kind is just a new `type` value, no schema change.
-- ----------------------------------------------------------------------------
create table if not exists public.posts (
  id bigint generated always as identity primary key,
  slug text not null unique,           -- SEO-friendly URL, set at upload time
  type text not null default 'job'
    check (type in ('job','internship','scholarship','grant','fellowship',
                    'conference','opportunity','other')),
  title text not null,
  organization text not null,
  submitter_name text,                 -- who submitted (ordinary-user posts)
  submitter_email text,                -- contact email for moderation follow-up
  rejection_reason text,               -- why a pending post was rejected
  category text,                        -- broad field, e.g. 'Health', 'Education'
  profession text,                      -- target cadre; matches practitioners.profession
  location text,                        -- 'Kampala, Uganda' or 'Remote'
  country text not null default 'Uganda',
  employment_type text,                 -- Full-time / Part-time / Contract / Volunteer / Remote
  experience_level text,                -- Entry / Graduate / Mid / Senior
  qualification text,                   -- required education & credentials
  eligibility text,                     -- who may apply (esp. grants/scholarships)
  salary text,                          -- free-text range (UGX or USD)
  description text not null,            -- main body, markdown
  summary text,                         -- one-line blurb for cards
  how_to_apply text,
  application_url text,
  application_email text,
  deadline date,                        -- null = rolling / none
  source_name text,                     -- e.g. 'Ministry of Health', 'WHO Uganda'
  source_url text,
  tags text[] not null default '{}',
  benefits text,                        -- what's on offer (pay, stipend, funding, perks)
  required_documents text,              -- what applicants must submit
  key_dates text,                       -- application timeline / key dates
  featured boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft','published','expired','archived','rejected')),
  published_at timestamptz,
  views integer not null default 0,
  search_text text not null default '', -- lowercased title+org+summary+description
  image_url text,                       -- photo of the role/organisation (Supabase Storage)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Keep existing tables up to date on re-runs (create table if not exists won't alter).
alter table public.posts add column if not exists image_url text;
alter table public.posts add column if not exists submitter_name text;
alter table public.posts add column if not exists submitter_email text;
alter table public.posts add column if not exists rejection_reason text;
alter table public.posts add column if not exists benefits text;
alter table public.posts add column if not exists required_documents text;
alter table public.posts add column if not exists key_dates text;
-- Widen the status check constraint to include the moderation 'rejected' state
-- (drop-then-add is idempotent and safe to re-run).
alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts add constraint posts_status_check
  check (status in ('draft','published','expired','archived','rejected'));

-- ----------------------------------------------------------------------------
-- 3c. Facilities, hospitals & pharmacies across Uganda (source: Uganda
--     Healthcare Directory). Ratable like practitioners; a new facility kind
--     is just a new `kind` value, no schema change.
-- ----------------------------------------------------------------------------
create table if not exists public.facilities (
  id bigint generated always as identity primary key,
  slug text not null unique,           -- SEO-friendly URL, stable across imports
  kind text not null
    check (kind in ('hospital','pharmacy')),
  name text not null,
  address text,
  city text,                            -- first part of address, for filters
  region text,                          -- e.g. 'Central Region'
  description text,
  phone text,
  specialties text,                     -- pharmacy/clinical specialties
  image_url text,
  source_url text,                      -- original directory listing
  search_text text not null default '', -- lowercased name+city+region+specialties
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.facility_ratings (
  id bigint generated always as identity primary key,
  facility_id bigint not null references public.facilities (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  reviewer_name text,
  created_at timestamptz not null default now(),
  verified boolean not null default false
);

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------
create index if not exists facilities_search_trgm on public.facilities using gin (search_text gin_trgm_ops);
create index if not exists facilities_kind on public.facilities (kind);
create index if not exists facilities_city on public.facilities (city);
create index if not exists facilities_slug on public.facilities (slug);
create index if not exists facility_ratings_facility on public.facility_ratings (facility_id);
create index if not exists facility_ratings_created on public.facility_ratings (created_at desc);

create index if not exists posts_search_trgm on public.posts using gin (search_text gin_trgm_ops);
create index if not exists posts_type_status on public.posts (type, status);
create index if not exists posts_profession on public.posts (profession);
create index if not exists posts_deadline on public.posts (deadline);
create index if not exists posts_published on public.posts (published_at desc);
create index if not exists posts_tags on public.posts using gin (tags);

create index if not exists practitioners_search_trgm on public.practitioners using gin (search_name gin_trgm_ops);
create index if not exists practitioners_council on public.practitioners (council);
create index if not exists practitioners_profession on public.practitioners (profession);
create index if not exists practitioners_status on public.practitioners (licence_status);
create index if not exists practitioners_regno on public.practitioners (registration_no);
create index if not exists practitioners_licno on public.practitioners (license_number);
-- searchPractitioners() OR's ilike across search_name/registration_no/license_number;
-- without trigram indexes on the latter two, that OR forced a sequential scan
-- across the full practitioners table (114k+ rows) on every keystroke.
create index if not exists practitioners_regno_trgm on public.practitioners using gin (registration_no gin_trgm_ops);
create index if not exists practitioners_licno_trgm on public.practitioners using gin (license_number gin_trgm_ops);
create index if not exists licenses_practitioner on public.licenses (practitioner_id);
create index if not exists ratings_practitioner on public.ratings (practitioner_id);
create index if not exists ratings_created on public.ratings (created_at desc);

-- ----------------------------------------------------------------------------
-- 4. Views used by the app
-- ----------------------------------------------------------------------------

-- Practitioners with aggregated rating stats (used by search + profiles).
-- (cascade so re-runs can replace the search_random function that depends on it)
drop view if exists public.practitioners_overview cascade;
create view public.practitioners_overview as
select
  p.*,
  (select round(avg(r.rating)::numeric, 2) from public.ratings r
    where r.practitioner_id = p.id) as avg_rating,
  (select count(*) from public.ratings r
    where r.practitioner_id = p.id) as rating_count
from public.practitioners p;

-- Distinct councils, for the filter dropdown.
drop view if exists public.councils;
create view public.councils as
select distinct council
from public.practitioners
where council is not null and council <> ''
order by council;

-- Distinct professions (derived cadres), for the filter dropdown.
drop view if exists public.professions;
create view public.professions as
select distinct profession
from public.practitioners
where profession is not null and profession <> ''
order by profession;

-- Registered-practitioner counts per profession, for the SEO landing pages
-- ("Doctors in Uganda", "Nurses in Uganda", …). Cheap, ordered by size.
drop view if exists public.profession_counts;
create view public.profession_counts as
select profession, count(*) as practitioner_count
from public.practitioners
where profession is not null and profession <> ''
group by profession
order by practitioner_count desc;

-- Facilities with aggregated rating stats (used by search + detail pages).
drop view if exists public.facilities_overview;
create view public.facilities_overview as
select
  f.*,
  (select round(avg(r.rating)::numeric, 2) from public.facility_ratings r
    where r.facility_id = f.id) as avg_rating,
  (select count(*) from public.facility_ratings r
    where r.facility_id = f.id) as rating_count
from public.facilities f;

-- Randomised browsing (used by the "Random" sort in the search UI).
-- Returns a random slice of the registry so browsing shows a mix of
-- specialties instead of one council at a time. Applies the same filters
-- (search text, council, licence status) as the regular search.
drop function if exists public.search_random(integer, integer) cascade;
drop function if exists public.search_random(integer, integer, text, text, text) cascade;
drop function if exists public.search_random(integer, integer, text, text, text, text) cascade;

create or replace function public.search_random(
  p_limit integer,
  p_offset integer,
  p_q text default '',
  p_council text default '',
  p_status text default 'all',
  p_profession text default ''
)
returns setof public.practitioners_overview
language plpgsql
as $$
declare
  tok text;
  token_cond text := '';
  sql text;
begin
  -- One AND-group per word: every word must match the name or the
  -- registration/licence number, in any order (mirrors the PostgREST filter
  -- in lib/practitioners.ts). Patterns are inlined as literals so the
  -- planner sees constants and uses the trigram indexes; a parameterised
  -- '%'||w||'%' pattern forces a 114k-row sequential scan.
  for tok in
    select replace(regexp_replace(w, '[%_(),]', '', 'g'), chr(92), '')
    from unnest(regexp_split_to_array(p_q, '\s+')) as w
    where w <> ''
  loop
    if tok = '' then continue; end if;
    if token_cond <> '' then token_cond := token_cond || ' and '; end if;
    token_cond := token_cond || format(
      '(p.search_name ilike %L or p.registration_no ilike %L or p.license_number ilike %L)',
      '%' || tok || '%', '%' || tok || '%', '%' || tok || '%');
  end loop;
  if token_cond = '' then token_cond := 'true'; end if;

  -- Rating aggregates are joined once here, not once per row like the
  -- practitioners_overview view's correlated subqueries, so broad browsing
  -- doesn't pay a per-row lookup across the table before LIMIT applies.
  sql := 'select p.*, r.avg_rating, r.rating_count '
    || 'from public.practitioners p '
    || 'left join (select practitioner_id, round(avg(rating)::numeric, 2) as avg_rating, '
    || 'count(*) as rating_count from public.ratings group by practitioner_id) r '
    || 'on r.practitioner_id = p.id '
    || 'where (' || token_cond || ') '
    || 'and (' || quote_literal(p_council) || ' = '''' or p.council = ' || quote_literal(p_council) || ') '
    || 'and (' || quote_literal(p_profession) || ' = '''' or p.profession = ' || quote_literal(p_profession) || ') '
    || 'and (' || quote_literal(p_status) || ' = ''all'' '
    || 'or (' || quote_literal(p_status) || ' = ''active'' and p.licence_status = ''Active'') '
    || 'or (' || quote_literal(p_status) || ' = ''inactive'' and (p.licence_status <> ''Active'' or p.licence_status is null))) '
    || 'order by (p.image_url is not null) desc, random() '
    || 'limit ' || greatest(coalesce(p_limit, 12), 1)
    || ' offset ' || greatest(coalesce(p_offset, 0), 0);
  return query execute sql;
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. Row Level Security
--    The public registry is readable by everyone; anyone may add a rating;
--    only the service role (or direct SQL) can write to the registry tables.
--    Only published posts are visible to visitors; drafts/archived listings are
--    visible only to the service role (dashboard/admin).
-- ----------------------------------------------------------------------------
alter table public.practitioners enable row level security;
alter table public.licenses enable row level security;
alter table public.ratings enable row level security;
alter table public.posts enable row level security;
alter table public.facilities enable row level security;
alter table public.facility_ratings enable row level security;

drop policy if exists "practitioners are publicly readable" on public.practitioners;
create policy "practitioners are publicly readable"
  on public.practitioners for select using (true);

drop policy if exists "licenses are publicly readable" on public.licenses;
create policy "licenses are publicly readable"
  on public.licenses for select using (true);

drop policy if exists "ratings are publicly readable" on public.ratings;
create policy "ratings are publicly readable"
  on public.ratings for select using (true);

drop policy if exists "anyone can add a rating" on public.ratings;
create policy "anyone can add a rating"
  on public.ratings for insert with check (true);

drop policy if exists "published posts are publicly readable" on public.posts;
create policy "published posts are publicly readable"
  on public.posts for select
  using (status = 'published');

-- Anyone may submit a listing, but only as a draft (featured/views locked at
-- defaults), nothing goes live until an admin reviews and publishes it.
drop policy if exists "anyone can submit a listing as draft" on public.posts;
create policy "anyone can submit a listing as draft"
  on public.posts for insert
  with check (status = 'draft' and featured = false and views = 0);

-- Facilities: the directory is public, and anyone may add a facility rating
-- (mirrors the practitioner rating policy).
drop policy if exists "facilities are publicly readable" on public.facilities;
create policy "facilities are publicly readable"
  on public.facilities for select using (true);

drop policy if exists "facility ratings are publicly readable" on public.facility_ratings;
create policy "facility ratings are publicly readable"
  on public.facility_ratings for select using (true);

drop policy if exists "anyone can add a facility rating" on public.facility_ratings;
create policy "anyone can add a facility rating"
  on public.facility_ratings for insert with check (true);

-- ----------------------------------------------------------------------------
-- 5b. Storage, public bucket for listing photos. Public read (photos render
--     once a listing is published); anyone may upload (the moderation queue
--     keeps unmoderated images off the live board).
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

drop policy if exists "post images are publicly readable" on storage.objects;
create policy "post images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'post-images');

drop policy if exists "anyone can upload post images" on storage.objects;
create policy "anyone can upload post images"
  on storage.objects for insert
  with check (bucket_id = 'post-images');

-- 5b2. Storage, public bucket for claimant profile photos. Public read (the
--      photo renders on the verified profile); anyone may upload — the URL is
--      only ever attached to a profile through the token-gated
--      /api/profile-details upsert, so random uploads can't appear anywhere.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

drop policy if exists "profile photos are publicly readable" on storage.objects;
create policy "profile photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

drop policy if exists "anyone can upload profile photos" on storage.objects;
create policy "anyone can upload profile photos"
  on storage.objects for insert
  with check (bucket_id = 'profile-photos');

-- ----------------------------------------------------------------------------
-- 5c. Facility services + community contributions (photos, detail edits), all
--     moderated: public may insert, only approved rows are publicly readable,
--     admin (service role) reviews and merges into the live facility record.
-- ----------------------------------------------------------------------------
alter table public.facilities add column if not exists services text[] default '{}';

create table if not exists public.facility_photos (
  id bigint generated always as identity primary key,
  facility_id bigint not null references public.facilities(id) on delete cascade,
  image_url text not null,
  storage_path text not null,
  submitted_by_name text,
  submitted_by_email text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists facility_photos_facility_id_idx on public.facility_photos(facility_id);
create index if not exists facility_photos_status_idx on public.facility_photos(status);

create table if not exists public.facility_edit_suggestions (
  id bigint generated always as identity primary key,
  facility_id bigint not null references public.facilities(id) on delete cascade,
  suggested_description text,
  suggested_services text[],
  suggested_phone text,
  submitted_by_name text,
  submitted_by_email text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists facility_edits_facility_id_idx on public.facility_edit_suggestions(facility_id);
create index if not exists facility_edits_status_idx on public.facility_edit_suggestions(status);

alter table public.facility_photos enable row level security;
alter table public.facility_edit_suggestions enable row level security;

drop policy if exists "anyone can submit facility photos" on public.facility_photos;
create policy "anyone can submit facility photos"
  on public.facility_photos for insert with check (true);
drop policy if exists "approved facility photos are publicly readable" on public.facility_photos;
create policy "approved facility photos are publicly readable"
  on public.facility_photos for select using (status = 'approved');

drop policy if exists "anyone can submit facility edits" on public.facility_edit_suggestions;
create policy "anyone can submit facility edits"
  on public.facility_edit_suggestions for insert with check (true);

-- ----------------------------------------------------------------------------
-- 5d. Ambulance providers, self-registered and moderated the same way, only
--     rows with status = 'approved' are ever shown on the public /ambulances
--     page. Reuses the post-images storage bucket for any submitted photo.
-- ----------------------------------------------------------------------------
create table if not exists public.ambulance_providers (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  phone text not null,
  alt_phone text,
  email text,
  city text,
  region text,
  coverage_area text,
  vehicle_types text[] default '{}',
  services text[] default '{}',
  description text,
  image_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists ambulance_status_idx on public.ambulance_providers(status);
create index if not exists ambulance_city_idx on public.ambulance_providers(city);

alter table public.ambulance_providers enable row level security;

drop policy if exists "anyone can register an ambulance provider" on public.ambulance_providers;
create policy "anyone can register an ambulance provider"
  on public.ambulance_providers for insert with check (true);
drop policy if exists "approved ambulance providers are publicly readable" on public.ambulance_providers;
create policy "approved ambulance providers are publicly readable"
  on public.ambulance_providers for select using (status = 'approved');

-- ----------------------------------------------------------------------------
-- 6. Newsletter subscribers, emails + preferences for job alerts
-- ----------------------------------------------------------------------------
create table if not exists public.newsletter_subscribers (
  id bigint generated always as identity primary key,
  email text not null unique,
  first_name text,
  last_name text,
  opportunity_types text[] not null default '{}',
  roles text[] not null default '{}',
  regions text[] not null default '{}',
  status text not null default 'subscribed',
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "anyone can subscribe to the newsletter" on public.newsletter_subscribers;
create policy "anyone can subscribe to the newsletter"
  on public.newsletter_subscribers for insert with check (true);

-- ----------------------------------------------------------------------------
-- 8. Profile claims (paid, one-time forever) + editable profile details.
--    Flow: practitioner auto-matches against the registry -> pays UGX 5,000
--    once via MarzPay -> webhook flips status to 'paid' and marks the
--    practitioner claimed. Registry fields stay scraper-owned forever;
--    claimants may only edit rows in profile_details.
-- ----------------------------------------------------------------------------
alter table public.practitioners add column if not exists claimed boolean not null default false;

-- Postgres expands `p.*` in a view at CREATE time, so a view created before
-- the `claimed` column existed will silently omit it (and the app then reads
-- claimed as false forever). Re-create the view + dependent function here so
-- fresh setups and re-runs always expose `claimed`, no matter the ordering.
drop view if exists public.practitioners_overview cascade;
create view public.practitioners_overview as
select
  p.*,
  (select round(avg(r.rating)::numeric, 2) from public.ratings r
    where r.practitioner_id = p.id) as avg_rating,
  (select count(*) from public.ratings r
    where r.practitioner_id = p.id) as rating_count
from public.practitioners p;

create or replace function public.search_random(
  p_limit integer,
  p_offset integer,
  p_q text default '',
  p_council text default '',
  p_status text default 'all',
  p_profession text default ''
)
returns setof public.practitioners_overview
language plpgsql
as $$
declare
  tok text;
  token_cond text := '';
  sql text;
begin
  -- One AND-group per word: every word must match the name or the
  -- registration/licence number, in any order (mirrors the PostgREST filter
  -- in lib/practitioners.ts). Patterns are inlined as literals so the
  -- planner sees constants and uses the trigram indexes; a parameterised
  -- '%'||w||'%' pattern forces a 114k-row sequential scan.
  for tok in
    select replace(regexp_replace(w, '[%_(),]', '', 'g'), chr(92), '')
    from unnest(regexp_split_to_array(p_q, '\s+')) as w
    where w <> ''
  loop
    if tok = '' then continue; end if;
    if token_cond <> '' then token_cond := token_cond || ' and '; end if;
    token_cond := token_cond || format(
      '(p.search_name ilike %L or p.registration_no ilike %L or p.license_number ilike %L)',
      '%' || tok || '%', '%' || tok || '%', '%' || tok || '%');
  end loop;
  if token_cond = '' then token_cond := 'true'; end if;

  -- Rating aggregates are joined once here, not once per row like the
  -- practitioners_overview view's correlated subqueries, so broad browsing
  -- doesn't pay a per-row lookup across the table before LIMIT applies.
  sql := 'select p.*, r.avg_rating, r.rating_count '
    || 'from public.practitioners p '
    || 'left join (select practitioner_id, round(avg(rating)::numeric, 2) as avg_rating, '
    || 'count(*) as rating_count from public.ratings group by practitioner_id) r '
    || 'on r.practitioner_id = p.id '
    || 'where (' || token_cond || ') '
    || 'and (' || quote_literal(p_council) || ' = '''' or p.council = ' || quote_literal(p_council) || ') '
    || 'and (' || quote_literal(p_profession) || ' = '''' or p.profession = ' || quote_literal(p_profession) || ') '
    || 'and (' || quote_literal(p_status) || ' = ''all'' '
    || 'or (' || quote_literal(p_status) || ' = ''active'' and p.licence_status = ''Active'') '
    || 'or (' || quote_literal(p_status) || ' = ''inactive'' and (p.licence_status <> ''Active'' or p.licence_status is null))) '
    || 'order by (p.image_url is not null) desc, random() '
    || 'limit ' || greatest(coalesce(p_limit, 12), 1)
    || ' offset ' || greatest(coalesce(p_offset, 0), 0);
  return query execute sql;
end;
$$;

create table if not exists public.claim_requests (
  id bigint generated always as identity primary key,
  practitioner_id bigint not null references public.practitioners (id) on delete cascade,
  requester_name text not null,
  phone text not null,
  email text,
  status text not null default 'processing'
    check (status in ('matched','processing','paid','failed')),
  marzpay_reference text unique,
  marzpay_txn_uuid text,
  provider_txn_id text,
  amount integer not null default 5000,
  paid_at timestamptz,
  -- Secret that unlocks /practitioners/[id]/edit for the payer.
  edit_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists claims_practitioner on public.claim_requests (practitioner_id);
create index if not exists claims_status on public.claim_requests (status);
-- One paid claim per practitioner, ever (partial unique index enforces this
-- at the database level even under concurrent webhooks).
create unique index if not exists claims_one_paid_per_practitioner
  on public.claim_requests (practitioner_id) where status = 'paid';

create table if not exists public.profile_details (
  practitioner_id bigint primary key references public.practitioners (id) on delete cascade,
  phone text,
  whatsapp text,
  workplace text,
  work_address text,
  bio text,
  specialties text[] default '{}',
  languages text[] default '{}',
  consultation_fee text,
  availability text,
  photo_url text,
  website text,
  facebook text,
  x_handle text,
  tiktok text,
  instagram text,
  updated_at timestamptz not null default now()
);

alter table public.claim_requests enable row level security;
alter table public.profile_details enable row level security;

-- Claims have NO public policies: they are written/read only by the service
-- role (API routes + admin). Profile details are publicly readable so the
-- practitioner page can render them.
drop policy if exists "profile details are publicly readable" on public.profile_details;
create policy "profile details are publicly readable"
  on public.profile_details for select using (true);

-- ----------------------------------------------------------------------------
-- 8b. Facility claims (paid, one-time forever) + claimant-managed details.
--     Mirrors section 8 for practitioners: a facility auto-matches by name,
--     pays UGX 5,000 once via MarzPay, webhook flips to 'paid' and marks
--     facilities.claimed. Import-owned columns stay scraper-owned; claimant
--     edits live in facility_profile_details and win at read time.
-- ----------------------------------------------------------------------------
alter table public.facilities add column if not exists claimed boolean not null default false;

-- Views expand `f.*` at CREATE time like practitioners_overview did, so
-- re-create facilities_overview to always expose `claimed`.
drop view if exists public.facilities_overview;
create view public.facilities_overview as
select
  f.*,
  (select round(avg(r.rating)::numeric, 2) from public.facility_ratings r
    where r.facility_id = f.id) as avg_rating,
  (select count(*) from public.facility_ratings r
    where r.facility_id = f.id) as rating_count
from public.facilities f;

create table if not exists public.facility_claim_requests (
  id bigint generated always as identity primary key,
  facility_id bigint not null references public.facilities (id) on delete cascade,
  requester_name text not null,
  phone text not null,
  email text,
  status text not null default 'processing'
    check (status in ('matched','processing','paid','failed')),
  marzpay_reference text unique,
  marzpay_txn_uuid text,
  provider_txn_id text,
  amount integer not null default 5000,
  paid_at timestamptz,
  edit_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists facility_claims_facility on public.facility_claim_requests (facility_id);
create index if not exists facility_claims_status on public.facility_claim_requests (status);
-- One paid claim per facility, ever.
create unique index if not exists facility_claims_one_paid_per_facility
  on public.facility_claim_requests (facility_id) where status = 'paid';

create table if not exists public.facility_profile_details (
  facility_id bigint primary key references public.facilities (id) on delete cascade,
  phone text,
  whatsapp text,
  description text,
  services text[] default '{}',
  photo_url text,
  website text,
  facebook text,
  x_handle text,
  instagram text,
  updated_at timestamptz not null default now()
);

alter table public.facility_claim_requests enable row level security;
alter table public.facility_profile_details enable row level security;

-- No public policies on facility_claim_requests (service role only).
drop policy if exists "facility profile details are publicly readable" on public.facility_profile_details;
create policy "facility profile details are publicly readable"
  on public.facility_profile_details for select using (true);

-- ----------------------------------------------------------------------------
-- 7. Grants for the anon/authenticated roles used by the publishable key
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.practitioners, public.licenses, public.ratings, public.posts,
              public.practitioners_overview, public.councils, public.professions,
              public.profession_counts to anon, authenticated;
grant select on public.facilities, public.facility_ratings,
              public.facilities_overview to anon, authenticated;
grant select on public.profile_details to anon, authenticated;
grant select on public.facility_profile_details to anon, authenticated;
grant insert on public.ratings to anon, authenticated;
grant insert on public.posts to anon, authenticated;
grant insert on public.facility_ratings to anon, authenticated;
grant insert on public.newsletter_subscribers to anon, authenticated;
grant usage on all sequences in schema public to anon, authenticated;
grant execute on function public.search_random(integer, integer, text, text, text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 9. MOHU merge: accounts, jobs pipeline, community, messaging, updates.
--    Ported from the legacy PHP/MySQL build (public_html/schema.sql + the
--    mohu_* runtime tables). No-password identity model: a profile handle
--    (uuid) is created in one click and stored in the browser, matching this
--    app's existing anon + rate-limit + moderation idiom (ratings, posts).
--    Password auth (Supabase Auth) is the planned follow-up; until then anon
--    insert is open and edits are admin-only except where noted.
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- 9a. Profiles: lightweight member/employer identity (replaces `users`).
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique,
  display_name text not null,
  email text,
  phone text,
  role text not null default 'member'
    check (role in ('member','jobseeker','employer','admin')),
  organization text,
  cadre text,
  location text,
  bio text,
  skills text,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9b. Organizations (employer pages, verification).
create table if not exists public.organizations (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  website text,
  description text,
  logo_url text,
  owner_profile_id uuid references public.profiles (id) on delete set null,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- 9c. Jobseeker "open to work" profiles (replaces jobseeker_seeking_profiles).
create table if not exists public.seeker_profiles (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  seeking_title text,
  availability text,
  desired_roles text,
  desired_locations text,
  employment_preference text,
  skills text,
  expected_salary text,
  public_summary text,
  show_email boolean not null default false,
  show_phone boolean not null default false,
  cv_visibility text not null default 'private'
    check (cv_visibility in ('private','employers','public')),
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- 9d. Job alerts (email digests for new listings).
create table if not exists public.job_alerts (
  id bigint generated always as identity primary key,
  email text not null,
  keyword text,
  category text,
  cadre text,
  location text,
  frequency text not null default 'daily' check (frequency in ('daily','weekly')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 9e. Applications to a listing (replaces `applications`; targets posts).
create table if not exists public.applications (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.posts (id) on delete cascade,
  applicant_name text not null,
  applicant_email text not null,
  applicant_phone text,
  cover_note text,
  cv_url text,
  status text not null default 'submitted'
    check (status in ('submitted','reviewing','shortlisted','rejected','hired')),
  created_at timestamptz not null default now(),
  unique (post_id, applicant_email)
);
create index if not exists applications_post on public.applications (post_id);
create index if not exists applications_status on public.applications (status);

-- 9f. Saved listings (replaces saved_opportunities).
create table if not exists public.saved_listings (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  post_id bigint not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, post_id)
);

-- 9g. Community feed (replaces mohu_community_posts + comments + likes).
create table if not exists public.community_posts (
  id bigint generated always as identity primary key,
  profile_id uuid references public.profiles (id) on delete set null,
  author_name text not null,
  body text not null,
  visibility text not null default 'public'
    check (visibility in ('public','followers','following','network')),
  status text not null default 'published'
    check (status in ('published','hidden','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_posts_feed on public.community_posts (status, created_at desc);
create index if not exists community_posts_author on public.community_posts (profile_id, created_at desc);

create table if not exists public.community_comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.community_posts (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  author_name text not null,
  body text not null,
  status text not null default 'published'
    check (status in ('published','hidden','deleted')),
  created_at timestamptz not null default now()
);
create index if not exists community_comments_post on public.community_comments (post_id, created_at);

create table if not exists public.community_likes (
  post_id bigint not null references public.community_posts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

-- 9h. Follows (replaces mohu_user_follows).
create table if not exists public.follows (
  follower_profile_id uuid not null references public.profiles (id) on delete cascade,
  followed_profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_profile_id, followed_profile_id),
  check (follower_profile_id <> followed_profile_id)
);

-- 9i. Connection requests to people / practitioners / facilities / orgs
--     (replaces mohu_connection_requests + mohu_request_messages).
create table if not exists public.connection_requests (
  id bigint generated always as identity primary key,
  sender_profile_id uuid references public.profiles (id) on delete set null,
  sender_name text not null,
  recipient_profile_id uuid references public.profiles (id) on delete set null,
  target_type text not null default 'member'
    check (target_type in ('member','practitioner','facility','organization')),
  target_id bigint,
  request_type text not null default 'other'
    check (request_type in ('message','appointment_service','consultation_enquiry','referral','other')),
  subject text not null,
  details text not null,
  status text not null default 'pending'
    check (status in ('pending','accepted','in_progress','completed','declined','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists connection_requests_sender on public.connection_requests (sender_profile_id, created_at desc);
create index if not exists connection_requests_recipient on public.connection_requests (recipient_profile_id, status, created_at desc);

create table if not exists public.request_messages (
  id bigint generated always as identity primary key,
  request_id bigint not null references public.connection_requests (id) on delete cascade,
  sender_profile_id uuid references public.profiles (id) on delete set null,
  sender_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists request_messages_request on public.request_messages (request_id, created_at);

-- 9j. Direct messages (replaces mohu_direct_threads + mohu_direct_messages).
create table if not exists public.dm_threads (
  id bigint generated always as identity primary key,
  participant_a uuid not null references public.profiles (id) on delete cascade,
  participant_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_a, participant_b),
  check (participant_a <> participant_b)
);

create table if not exists public.dm_messages (
  id bigint generated always as identity primary key,
  thread_id bigint not null references public.dm_threads (id) on delete cascade,
  sender_profile_id uuid references public.profiles (id) on delete set null,
  sender_name text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists dm_messages_thread on public.dm_messages (thread_id, id);

-- 9k. Health information updates (replaces mohu_health_updates + likes +
--     comments). Admin/verified posts surface first.
create table if not exists public.health_updates (
  id bigint generated always as identity primary key,
  profile_id uuid references public.profiles (id) on delete set null,
  author_name text not null,
  title text not null,
  body text not null,
  source_url text,
  status text not null default 'published' check (status in ('published','hidden')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists health_updates_feed on public.health_updates (status, created_at desc);

create table if not exists public.health_update_likes (
  update_id bigint not null references public.health_updates (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (update_id, profile_id)
);

create table if not exists public.health_update_comments (
  id bigint generated always as identity primary key,
  update_id bigint not null references public.health_updates (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  author_name text not null,
  body text not null,
  status text not null default 'published' check (status in ('published','hidden')),
  created_at timestamptz not null default now()
);
create index if not exists health_update_comments_update on public.health_update_comments (update_id, created_at);

-- 9l. Broadcasts / announcements (replaces mohu_broadcasts + reads).
create table if not exists public.broadcasts (
  id bigint generated always as identity primary key,
  title text not null,
  message text not null,
  audience text not null default 'all'
    check (audience in ('all','member','jobseeker','employer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.broadcast_reads (
  broadcast_id bigint not null references public.broadcasts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (broadcast_id, profile_id)
);

-- 9m. Platform feedback + helpfulness votes (replaces mohu_feedback).
create table if not exists public.platform_feedback (
  id bigint generated always as identity primary key,
  profile_id uuid references public.profiles (id) on delete set null,
  author_name text not null,
  rating smallint not null check (rating between 1 and 5),
  feedback_text text not null,
  status text not null default 'approved' check (status in ('approved','hidden')),
  created_at timestamptz not null default now()
);
create index if not exists platform_feedback_feed on public.platform_feedback (status, created_at desc);

create table if not exists public.feedback_votes (
  feedback_id bigint not null references public.platform_feedback (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  vote smallint not null check (vote in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (feedback_id, profile_id)
);

-- 9n. Support inbox (replaces mohu_contact_messages + mohu_problem_reports).
create table if not exists public.contact_messages (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.problem_reports (
  id bigint generated always as identity primary key,
  profile_id uuid references public.profiles (id) on delete set null,
  reporter_name text not null,
  reporter_email text,
  subject text not null,
  details text not null,
  page_url text,
  status text not null default 'open'
    check (status in ('open','in_progress','resolved')),
  created_at timestamptz not null default now()
);
create index if not exists problem_reports_status on public.problem_reports (status, created_at desc);

-- 9o. Notifications (per-profile inbox for application + request updates).
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_profile on public.notifications (profile_id, is_read, created_at desc);

-- ----------------------------------------------------------------------------
-- 9p. RLS: public reads of published/approved/active rows; anyone may insert
--     (rate-limited in the API routes, moderated by admin); deletes only for
--     toggle tables (likes/follows/saved/reads) so unlike/unfollow/unsave work.
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.seeker_profiles enable row level security;
alter table public.job_alerts enable row level security;
alter table public.applications enable row level security;
alter table public.saved_listings enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_likes enable row level security;
alter table public.follows enable row level security;
alter table public.connection_requests enable row level security;
alter table public.request_messages enable row level security;
alter table public.dm_threads enable row level security;
alter table public.dm_messages enable row level security;
alter table public.health_updates enable row level security;
alter table public.health_update_likes enable row level security;
alter table public.health_update_comments enable row level security;
alter table public.broadcasts enable row level security;
alter table public.broadcast_reads enable row level security;
alter table public.platform_feedback enable row level security;
alter table public.feedback_votes enable row level security;
alter table public.contact_messages enable row level security;
alter table public.problem_reports enable row level security;
alter table public.notifications enable row level security;

-- Public read policies.
drop policy if exists "profiles are publicly readable" on public.profiles;
create policy "profiles are publicly readable" on public.profiles for select using (true);

drop policy if exists "organizations are publicly readable" on public.organizations;
create policy "organizations are publicly readable" on public.organizations for select using (true);

drop policy if exists "active seeker profiles are publicly readable" on public.seeker_profiles;
create policy "active seeker profiles are publicly readable" on public.seeker_profiles for select using (active = true);

drop policy if exists "published community posts are publicly readable" on public.community_posts;
create policy "published community posts are publicly readable" on public.community_posts for select using (status = 'published');

drop policy if exists "published community comments are publicly readable" on public.community_comments;
create policy "published community comments are publicly readable" on public.community_comments for select using (status = 'published');

drop policy if exists "community likes are publicly readable" on public.community_likes;
create policy "community likes are publicly readable" on public.community_likes for select using (true);

drop policy if exists "follows are publicly readable" on public.follows;
create policy "follows are publicly readable" on public.follows for select using (true);

drop policy if exists "published health updates are publicly readable" on public.health_updates;
create policy "published health updates are publicly readable" on public.health_updates for select using (status = 'published');

drop policy if exists "health update likes are publicly readable" on public.health_update_likes;
create policy "health update likes are publicly readable" on public.health_update_likes for select using (true);

drop policy if exists "published health update comments are publicly readable" on public.health_update_comments;
create policy "published health update comments are publicly readable" on public.health_update_comments for select using (status = 'published');

drop policy if exists "active broadcasts are publicly readable" on public.broadcasts;
create policy "active broadcasts are publicly readable" on public.broadcasts for select using (is_active = true);

drop policy if exists "approved feedback is publicly readable" on public.platform_feedback;
create policy "approved feedback is publicly readable" on public.platform_feedback for select using (status = 'approved');

drop policy if exists "feedback votes are publicly readable" on public.feedback_votes;
create policy "feedback votes are publicly readable" on public.feedback_votes for select using (true);

-- Anyone may insert (API routes validate + rate-limit; admin moderates).
drop policy if exists "anyone can create a profile" on public.profiles;
create policy "anyone can create a profile" on public.profiles for insert with check (true);
drop policy if exists "anyone can register an organization" on public.organizations;
create policy "anyone can register an organization" on public.organizations for insert with check (true);
drop policy if exists "anyone can create a seeker profile" on public.seeker_profiles;
create policy "anyone can create a seeker profile" on public.seeker_profiles for insert with check (true);
drop policy if exists "anyone can create a job alert" on public.job_alerts;
create policy "anyone can create a job alert" on public.job_alerts for insert with check (true);
drop policy if exists "anyone can apply to a listing" on public.applications;
create policy "anyone can apply to a listing" on public.applications for insert with check (true);
drop policy if exists "anyone can save a listing" on public.saved_listings;
create policy "anyone can save a listing" on public.saved_listings for insert with check (true);
drop policy if exists "anyone can post to the community" on public.community_posts;
create policy "anyone can post to the community" on public.community_posts for insert with check (status = 'published');
drop policy if exists "anyone can comment" on public.community_comments;
create policy "anyone can comment" on public.community_comments for insert with check (status = 'published');
drop policy if exists "anyone can like" on public.community_likes;
create policy "anyone can like" on public.community_likes for insert with check (true);
drop policy if exists "anyone can follow" on public.follows;
create policy "anyone can follow" on public.follows for insert with check (true);
drop policy if exists "anyone can send a connection request" on public.connection_requests;
create policy "anyone can send a connection request" on public.connection_requests for insert with check (status = 'pending');
drop policy if exists "anyone can message a request" on public.request_messages;
create policy "anyone can message a request" on public.request_messages for insert with check (true);
drop policy if exists "anyone can open a dm thread" on public.dm_threads;
create policy "anyone can open a dm thread" on public.dm_threads for insert with check (true);
drop policy if exists "anyone can send a dm" on public.dm_messages;
create policy "anyone can send a dm" on public.dm_messages for insert with check (true);
drop policy if exists "anyone can post a health update" on public.health_updates;
create policy "anyone can post a health update" on public.health_updates for insert with check (status = 'published' and is_admin = false);
drop policy if exists "anyone can like a health update" on public.health_update_likes;
create policy "anyone can like a health update" on public.health_update_likes for insert with check (true);
drop policy if exists "anyone can comment on a health update" on public.health_update_comments;
create policy "anyone can comment on a health update" on public.health_update_comments for insert with check (status = 'published');
drop policy if exists "anyone can mark a broadcast read" on public.broadcast_reads;
create policy "anyone can mark a broadcast read" on public.broadcast_reads for insert with check (true);
drop policy if exists "anyone can leave feedback" on public.platform_feedback;
create policy "anyone can leave feedback" on public.platform_feedback for insert with check (status = 'approved');
drop policy if exists "anyone can vote on feedback" on public.feedback_votes;
create policy "anyone can vote on feedback" on public.feedback_votes for insert with check (true);
drop policy if exists "anyone can contact support" on public.contact_messages;
create policy "anyone can contact support" on public.contact_messages for insert with check (true);
drop policy if exists "anyone can report a problem" on public.problem_reports;
create policy "anyone can report a problem" on public.problem_reports for insert with check (status = 'open');

-- Toggle deletes (unlike / unfollow / unsave / unlike-update).
drop policy if exists "anyone can unlike" on public.community_likes;
create policy "anyone can unlike" on public.community_likes for delete using (true);
drop policy if exists "anyone can unfollow" on public.follows;
create policy "anyone can unfollow" on public.follows for delete using (true);
drop policy if exists "anyone can unsave" on public.saved_listings;
create policy "anyone can unsave" on public.saved_listings for delete using (true);
drop policy if exists "anyone can remove a health update like" on public.health_update_likes;
create policy "anyone can remove a health update like" on public.health_update_likes for delete using (true);
drop policy if exists "anyone can remove a job alert" on public.job_alerts;
create policy "anyone can remove a job alert" on public.job_alerts for delete using (true);

-- Seeker profiles are updatable by anyone pre-auth (revisit with Supabase Auth).
drop policy if exists "anyone can update a seeker profile" on public.seeker_profiles;
create policy "anyone can update a seeker profile" on public.seeker_profiles for update using (true) with check (true);

-- Grants for the anon/authenticated roles used by the publishable key.
grant select on public.profiles, public.organizations, public.seeker_profiles,  public.community_posts, public.community_comments, public.community_likes,
  public.follows, public.health_updates, public.health_update_likes,
  public.health_update_comments, public.broadcasts, public.platform_feedback,
  public.feedback_votes to anon, authenticated;
grant insert on public.profiles, public.organizations, public.seeker_profiles,
  public.job_alerts, public.applications, public.saved_listings,
  public.community_posts, public.community_comments, public.community_likes,
  public.follows, public.connection_requests, public.request_messages,
  public.dm_threads, public.dm_messages, public.health_updates,
  public.health_update_likes, public.health_update_comments,
  public.broadcast_reads, public.platform_feedback, public.feedback_votes,
  public.contact_messages, public.problem_reports to anon, authenticated;
grant delete on public.community_likes, public.follows, public.saved_listings,
  public.health_update_likes, public.job_alerts to anon, authenticated;
grant update on public.seeker_profiles to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 10. Hiring workspace: applicant dashboard, document vault, employer pipeline.
-- ----------------------------------------------------------------------------

-- Who submitted the listing (handle uuid). Lets employers self-serve their
-- own applicants at /employers without passwords; older listings without an
-- owner stay admin-managed.
alter table public.posts add column if not exists owner_profile_id uuid
  references public.profiles (id) on delete set null;

-- Which handle applied (nullable so guest applications keep working).
alter table public.applications add column if not exists profile_id uuid
  references public.profiles (id) on delete set null;
create index if not exists applications_profile on public.applications (profile_id);

-- Which vault document was attached to the application.
alter table public.applications add column if not exists document_id bigint;

-- Document vault: CVs, certificates, licences. Files live in the private
-- `applicant-docs` storage bucket; this table is the index. Reads/writes go
-- through /api/documents (service role verifies profile_id), so no public
-- RLS data policies beyond authenticated reads of one's own rows via the API.
create table if not exists public.documents (
  id bigint generated always as identity primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  kind text not null default 'cv'
    check (kind in ('cv','certificate','licence','transcript','other')),
  storage_path text not null,
  mime_type text,
  size_bytes integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists documents_profile on public.documents (profile_id, created_at desc);

alter table public.applications enable row level security;
alter table public.documents enable row level security;
alter table public.notifications enable row level security;

-- Applications and vault rows are NOT publicly readable (they contain emails
-- and private files). Reads happen server-side in /api/applications and
-- /api/documents via the service role, filtered by profile_id — so no anon
-- select policy here; RLS denies by default. Writes stay anon-insert
-- (rate-limited in the API, moderated by admin/employer).

-- Private bucket for vault files. No public storage policies: all access is
-- mediated by /api/documents with short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('applicant-docs', 'applicant-docs', false)
on conflict (id) do nothing;

grant select on public.documents to anon, authenticated;
grant select on public.applications to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 11. Supabase Auth (email + password): verified-user RLS on private tables.
--     profiles.id doubles as the auth user id for logged-in members; legacy
--     one-click handles keep working until migrated via /api/profiles/migrate.
-- ----------------------------------------------------------------------------

-- Applicants can read their own applications when logged in.
drop policy if exists "users can read their own applications" on public.applications;
create policy "users can read their own applications"
  on public.applications for select
  to authenticated
  using (profile_id = auth.uid());

-- Vault owners have full access to their rows when logged in (the API still
-- mediates storage bytes via the private bucket + signed URLs).
drop policy if exists "users can read their own documents" on public.documents;
create policy "users can read their own documents"
  on public.documents for select
  to authenticated
  using (profile_id = auth.uid());

drop policy if exists "users can add their own documents" on public.documents;
create policy "users can add their own documents"
  on public.documents for insert
  to authenticated
  with check (profile_id = auth.uid());

drop policy if exists "users can delete their own documents" on public.documents;
create policy "users can delete their own documents"
  on public.documents for delete
  to authenticated
  using (profile_id = auth.uid());

-- Private vault bucket: owners read/write only their own folder
-- (<user-id>/...), enforced by storage RLS for logged-in users.
drop policy if exists "owners can read their vault files" on storage.objects;
create policy "owners can read their vault files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'applicant-docs' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "owners can upload vault files" on storage.objects;
create policy "owners can upload vault files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'applicant-docs' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "owners can delete their vault files" on storage.objects;
create policy "owners can delete their vault files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'applicant-docs' and auth.uid()::text = (storage.foldername(name))[1]);

grant insert, delete on public.documents to authenticated;
