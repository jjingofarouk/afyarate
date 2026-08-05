-- ============================================================================
-- Musawo · Supabase schema (project: afyarate)
-- Run this in the Supabase SQL Editor, or automatically with:
--     node scripts/setup_supabase.mjs
-- Idempotent: safe to run multiple times.
-- ============================================================================

-- Trigram index support for fast name search (ILIKE '%...%')
create extension if not exists pg_trgm;

-- ----------------------------------------------------------------------------
-- 1. Practitioners — one row per person (collapsed from licence records)
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
-- 2. Licenses — full licence history per practitioner (portal stores one row
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
-- 3. Ratings — community ratings, one per submission
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
-- Indexes
-- ----------------------------------------------------------------------------
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
  order by random()
  limit p_limit offset p_offset
$$;

-- ----------------------------------------------------------------------------
-- 5. Row Level Security
--    The public registry is readable by everyone; anyone may add a rating;
--    only the service role (or direct SQL) can write to the registry tables.
-- ----------------------------------------------------------------------------
alter table public.practitioners enable row level security;
alter table public.licenses enable row level security;
alter table public.ratings enable row level security;

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

-- ----------------------------------------------------------------------------
-- 6. Grants for the anon/authenticated roles used by the publishable key
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.practitioners, public.licenses, public.ratings,
              public.practitioners_overview, public.councils, public.professions to anon, authenticated;
grant insert on public.ratings to anon, authenticated;
grant usage on all sequences in schema public to anon, authenticated;
grant execute on function public.search_random(integer, integer, text, text, text, text) to anon, authenticated;
