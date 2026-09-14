-- Reset newsletter_subscribers.id sequence so future inserts start at MAX(id)+1.
-- Use case: deletes leave gaps (e.g. 49 rows but ids go up to 58). This re-syncs
-- the underlying sequence so newly-inserted rows get consecutive ids again.
--
-- Safe to re-run: it always reads the current max and sets the sequence past it.
--
-- Run with:  psql "$SUPABASE_DB_URL" -f supabase/reset_newsletter_ids.sql
-- or via Supabase SQL editor.

begin;

-- Capture current max id; if the table is empty, fall back to 0 so the
-- sequence is set to 1 (nextval returns the start value).
do $$
declare
  max_id bigint;
  seq_name text;
begin
  select coalesce(max(id), 0) into max_id from public.newsletter_subscribers;

  -- bigint generated always as identity creates a sequence named
  -- `<table>_<column>_seq`. Verify it before altering.
  select pg_get_serial_sequence('public.newsletter_subscribers', 'id') into seq_name;

  if seq_name is null then
    raise notice 'No identity/serial sequence found on public.newsletter_subscribers.id; nothing to reset.';
    return;
  end if;

  -- setval(seq, t, true) means the NEXT nextval() returns t. We want
  -- MAX(id) as the highest already-issued value, so next id will be max+1.
  perform setval(seq_name, max_id, true);

  raise notice 'Reset % to % (next id will be %)', seq_name, max_id, max_id + 1;
end $$;

commit;