-- Runs only on the independent ephemeral PostgreSQL restore target.
\set ON_ERROR_STOP on

DO $check$
DECLARE
  before_max bigint;
  new_id bigint;
  source_max bigint;
  next_link_id bigint;
BEGIN
  IF (SELECT count(*) FROM public.hradnik_places) <> 3
  THEN RAISE EXCEPTION 'Expected 3 synthetic catalogue places'; END IF;
  IF (SELECT count(*) FROM public.hradnik_place_sources) <> 3
  THEN RAISE EXCEPTION 'Expected 3 restored source links'; END IF;
  IF (SELECT count(*) FROM public.hradnik_sources) <> 9
  THEN RAISE EXCEPTION 'Expected nine baseline source seeds'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.hradnik_places WHERE id=910001 AND slug='ci-restore-one')
    OR NOT EXISTS (SELECT 1 FROM public.hradnik_places WHERE id=910002 AND slug='ci-restore-two')
  THEN RAISE EXCEPTION 'Stable catalogue identifiers not preserved'; END IF;
  IF (SELECT count(*) FROM public.hradnik_place_sources WHERE place_id=910001) <> 2
    OR (SELECT count(*) FROM public.hradnik_place_sources WHERE place_id=910002) <> 1
  THEN RAISE EXCEPTION 'Source foreign key links not preserved'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.hradnik_places p
    WHERE p.id=910001 AND p.source_count=2
      AND p.photo_urls @> '["https://example.invalid/ci/1.jpg"]'::jsonb)
  THEN RAISE EXCEPTION 'Catalog attributes lost during restore'; END IF;

  IF EXISTS (SELECT 1 FROM public.hradnik_users)
    OR EXISTS (SELECT 1 FROM public.hradnik_sessions)
    OR EXISTS (SELECT 1 FROM public.hradnik_user_place_state)
  THEN RAISE EXCEPTION 'Private account data leaked into catalog-only archive'; END IF;
  IF has_table_privilege('anon','public.hradnik_users','SELECT')
    OR has_table_privilege('anon','public.hradnik_user_place_state','SELECT')
  THEN RAISE EXCEPTION 'Restored private tables exposed'; END IF;
  IF NOT has_table_privilege('anon','public.hradnik_places','SELECT')
  THEN RAISE EXCEPTION 'Restored public catalogue unreadable'; END IF;

  SELECT max(id) INTO before_max FROM public.hradnik_places;
  INSERT INTO public.hradnik_places (slug,name,kind)
  VALUES ('ci-post-restore-new','Hrad po importu','Hrad') RETURNING id INTO new_id;
  IF new_id <= before_max THEN
    RAISE EXCEPTION 'Restored place identity sequence stale (% <= %)',new_id,before_max;
  END IF;

  SELECT max(id) INTO source_max FROM public.hradnik_place_sources;
  INSERT INTO public.hradnik_place_sources (place_id,source_key,external_id,source_url)
  VALUES (new_id,'osm','ci-link-after-restore','https://example.invalid/ci/after')
  RETURNING id INTO next_link_id;
  IF next_link_id <= source_max THEN
    RAISE EXCEPTION 'Restored source identity sequence stale'; END IF;
END
$check$;

SET ROLE anon;
SELECT count(*) AS restored_visible_places FROM public.hradnik_places;
RESET ROLE;

\echo 'PASS: two-database catalogue transfer, IDs, source links, private exclusion and identity sequences.'
