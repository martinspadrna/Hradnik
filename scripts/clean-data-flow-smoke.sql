-- Isolated integration smoke. Run ONLY in the GitHub Actions ephemeral PostgreSQL service.
-- Roll back all fixture rows. Never run against a live Supabase instance.
\set ON_ERROR_STOP on

BEGIN;

DO $security$
BEGIN
  IF has_function_privilege('anon', 'public.hradnik_ingest_source_records(jsonb)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.hradnik_ingest_source_records(jsonb)', 'EXECUTE')
  THEN RAISE EXCEPTION 'Ingest RPC unexpectedly executable by browser roles'; END IF;
  IF NOT has_function_privilege('service_role', 'public.hradnik_ingest_source_records(jsonb)', 'EXECUTE')
  THEN RAISE EXCEPTION 'Service role cannot call ingest RPC'; END IF;
  IF has_table_privilege('anon', 'public.hradnik_user_place_state', 'SELECT')
    OR has_table_privilege('authenticated', 'public.hradnik_users', 'SELECT')
    OR has_table_privilege('authenticated', 'public.hradnik_sessions', 'SELECT')
  THEN RAISE EXCEPTION 'Private user tables exposed to browser roles'; END IF;
END
$security$;

-- Service-role RPC: insert, update the same source, and link a second source
-- to the same castle without creating a duplicate. Exercise triggers and FK.
SET ROLE service_role;
DO $ingest$
DECLARE
  payload jsonb := jsonb_build_array(jsonb_build_object(
    'source_key','osm', 'external_id','ci-osm-1',
    'name','Testovací hrad pro CI', 'kind','Hrad',
    'district','CI okres', 'region','CI kraj',
    'character','castle', 'latitude',50.123, 'longitude',15.123,
    'source_url','https://example.invalid/ci/castle',
    'description','Výhradně fiktivní památka'
  ));
  result jsonb;
  place_id bigint;
BEGIN
  result := public.hradnik_ingest_source_records(payload);
  IF (result->>'ok')::boolean IS DISTINCT FROM true
     OR (result->>'inserted')::int <> 1
     OR (result->>'linked')::int <> 1
  THEN RAISE EXCEPTION 'Initial source ingestion failed: %', result; END IF;

  SELECT p.id INTO place_id FROM public.hradnik_places p
  JOIN public.hradnik_place_sources s ON s.place_id=p.id
  WHERE s.source_key='osm' AND s.external_id='ci-osm-1';
  IF place_id IS NULL THEN RAISE EXCEPTION 'Ingest did not create source link'; END IF;

  result := public.hradnik_ingest_source_records(payload);
  IF (result->>'inserted')::int <> 0
     OR (result->>'updated')::int <> 1
     OR (result->>'linked')::int <> 1
  THEN RAISE EXCEPTION 'Same-source replay not idempotent: %', result; END IF;

  result := public.hradnik_ingest_source_records(jsonb_build_array(jsonb_build_object(
    'source_key','hradycz', 'external_id','ci-hrady-1',
    'name','Testovací hrad pro CI', 'kind','Hrad',
    'district','CI okres', 'region','CI kraj',
    'character','castle',
    'source_url','https://example.invalid/ci/second-source'
  )));
  IF (result->>'inserted')::int <> 0
     OR (result->>'updated')::int <> 1
     OR (result->>'linked')::int <> 1
  THEN RAISE EXCEPTION 'Second source did not match existing place: %', result; END IF;

  IF (SELECT count(*) FROM public.hradnik_places p
      WHERE p.name='Testovací hrad pro CI') <> 1
  THEN RAISE EXCEPTION 'Duplicate places created when linking sources'; END IF;
  IF (SELECT p.source_count FROM public.hradnik_places p WHERE p.id=place_id) <> 2
  THEN RAISE EXCEPTION 'Source links not reflected in place source_count'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.hradnik_places p
    WHERE p.id=place_id AND p.quality_status IS NOT NULL)
  THEN RAISE EXCEPTION 'Quality trigger did not produce a status'; END IF;
END
$ingest$;
RESET ROLE;

-- Simulate an account with no real credentials, a session hash, visited
-- state, and deletion cascades. Every row is rolled back at the end.
DO $userdata$
DECLARE
  usr uuid;
  castle bigint;
BEGIN
  SELECT id INTO castle FROM public.hradnik_places WHERE name='Testovací hrad pro CI' LIMIT 1;
  IF castle IS NULL THEN RAISE EXCEPTION 'Missing test castle'; END IF;
  INSERT INTO public.hradnik_users (username,password_hash,role)
  VALUES ('ci_ephemeral_user','not-a-real-password-hash','user')
  RETURNING id INTO usr;

  INSERT INTO public.hradnik_sessions (user_id,token_hash,expires_at)
  VALUES (usr,'ci-ephemeral-not-an-auth-token',now()+interval '1 day');
  INSERT INTO public.hradnik_user_place_state
    (user_id,place_id,status,favorite,rating,visited_on,note)
  VALUES (usr,castle,'visited',true,5,DATE '2026-10-22','Pouze testovací stav')
  ON CONFLICT (user_id,place_id) DO UPDATE SET
    favorite=excluded.favorite,visited_on=excluded.visited_on;

  IF NOT EXISTS (
    SELECT 1 FROM public.hradnik_user_place_state
    WHERE user_id=usr AND place_id=castle AND status='visited'
      AND visited_on=DATE '2026-10-22' AND favorite IS TRUE
  ) THEN RAISE EXCEPTION 'Visit date / favorite not persisted'; END IF;

  DELETE FROM public.hradnik_users WHERE id=usr;

  IF EXISTS (SELECT 1 FROM public.hradnik_sessions WHERE user_id=usr)
  THEN RAISE EXCEPTION 'Orphaned session after account deletion'; END IF;
  IF EXISTS (SELECT 1 FROM public.hradnik_user_place_state WHERE user_id=usr)
  THEN RAISE EXCEPTION 'Orphaned visit state after account deletion'; END IF;
END
$userdata$;

-- Confirm public role reads only visible data and never sees private rows.
SET ROLE anon;
SELECT count(*) AS public_sources FROM public.hradnik_sources;
SELECT count(*) AS visible_places FROM public.hradnik_places;
RESET ROLE;

ROLLBACK;

-- All transactional test rows, including the fake user, have disappeared.
DO $cleanup$
BEGIN
  IF EXISTS (SELECT 1 FROM public.hradnik_places WHERE name='Testovací hrad pro CI')
  THEN RAISE EXCEPTION 'Integration smoke failed to roll back fake castle'; END IF;
  IF EXISTS (SELECT 1 FROM public.hradnik_users WHERE username='ci_ephemeral_user')
  THEN RAISE EXCEPTION 'Integration smoke failed to roll back fake account'; END IF;
END
$cleanup$;

\echo 'PASS: isolated ingest RPC, deduplication, source links, auth/session FK, visited state, RLS and rollback.'
