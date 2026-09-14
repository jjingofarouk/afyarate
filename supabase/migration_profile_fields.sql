-- Migration: richer claimant profile fields (photo, fee, availability,
-- socials, languages, work address) + public bucket for profile photos.
--
-- Idempotent: safe to run multiple times and against fresh setups (mirrors
-- supabase/schema.sql). Run against production with:
--   psql "$SUPABASE_DB_URL" -f supabase/migration_profile_fields.sql

alter table public.profile_details
  add column if not exists photo_url text,
  add column if not exists consultation_fee text,
  add column if not exists availability text,
  add column if not exists facebook text,
  add column if not exists x_handle text,
  add column if not exists tiktok text,
  add column if not exists instagram text,
  add column if not exists languages text[] default '{}',
  add column if not exists work_address text;

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
