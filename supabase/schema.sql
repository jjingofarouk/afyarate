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
language sql
as $$
  select * from public.practitioners_overview
  where (p_q = ''
         or search_name ilike '%' || p_q || '%'
         or registration_no ilike '%' || p_q || '%'
         or license_number ilike '%' || p_q || '%')
    and (p_council = '' or council = p_council)
    and (p_profession = '' or profession = p_profession)
    and (p_status = 'all'
         or (p_status = 'active' and licence_status = 'Active')
         or (p_status = 'inactive'
             and (licence_status <> 'Active' or licence_status is null)))
  -- Practitioners with a profile photo always come first.
  order by (image_url is not null) desc, random()
  limit p_limit offset p_offset
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
-- 7. Grants for the anon/authenticated roles used by the publishable key
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.practitioners, public.licenses, public.ratings, public.posts,
              public.practitioners_overview, public.councils, public.professions,
              public.profession_counts to anon, authenticated;
grant select on public.facilities, public.facility_ratings,
              public.facilities_overview to anon, authenticated;
grant insert on public.ratings to anon, authenticated;
grant insert on public.posts to anon, authenticated;
grant insert on public.facility_ratings to anon, authenticated;
grant insert on public.newsletter_subscribers to anon, authenticated;
grant usage on all sequences in schema public to anon, authenticated;
grant execute on function public.search_random(integer, integer, text, text, text, text) to anon, authenticated;
