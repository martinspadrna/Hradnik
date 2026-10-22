-- No production access: executed only on an ephemeral PostgreSQL CI service.
\set ON_ERROR_STOP on

DO $checks$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'hradnik_%';
  IF n <> 9 THEN RAISE EXCEPTION 'Expected 9 Hradnik tables; got %', n; END IF;
  SELECT count(*) INTO n FROM information_schema.columns WHERE table_schema='public' AND table_name LIKE 'hradnik_%';
  IF n <> 106 THEN RAISE EXCEPTION 'Expected 106 columns; got %', n; END IF;
  SELECT count(*) INTO n
  FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace
  WHERE ns.nspname='public' AND c.relname LIKE 'hradnik_%' AND c.relkind='r' AND c.relrowsecurity;
  IF n <> 9 THEN RAISE EXCEPTION 'Expected RLS enabled on 9 tables; got %', n; END IF;
  SELECT count(*) INTO n FROM pg_indexes WHERE schemaname='public' AND tablename LIKE 'hradnik_%';
  IF n <> 39 THEN RAISE EXCEPTION 'Expected 39 indexes including PK/UNIQUE; got %', n; END IF;
  SELECT count(*) INTO n FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace
  WHERE ns.nspname='public' AND p.proname LIKE 'hradnik_%';
  IF n <> 14 THEN RAISE EXCEPTION 'Expected 14 SQL functions; got %', n; END IF;
  SELECT count(*) INTO n FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
  JOIN pg_namespace ns ON ns.oid=c.relnamespace
  WHERE ns.nspname='public' AND c.relname LIKE 'hradnik_%' AND NOT t.tgisinternal;
  IF n <> 5 THEN RAISE EXCEPTION 'Expected 5 triggers; got %', n; END IF;
  SELECT count(*) INTO n FROM pg_policies WHERE schemaname='public' AND tablename LIKE 'hradnik_%';
  IF n <> 3 THEN RAISE EXCEPTION 'Expected 3 public read policies; got %', n; END IF;
  SELECT count(*) INTO n FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid
  JOIN pg_namespace ns ON ns.oid=c.relnamespace
  WHERE ns.nspname='public' AND c.relname LIKE 'hradnik_%' AND con.contype='f';
  IF n <> 5 THEN RAISE EXCEPTION 'Expected 5 foreign keys; got %', n; END IF;
  SELECT count(*) INTO n FROM public.hradnik_sources;
  IF n <> 9 THEN RAISE EXCEPTION 'Expected 9 seeded source records; got %', n; END IF;
  SELECT count(*) INTO n FROM public.hradnik_users;
  IF n <> 0 THEN RAISE EXCEPTION 'Private users must never be seeded'; END IF;
  SELECT count(*) INTO n FROM public.hradnik_sessions;
  IF n <> 0 THEN RAISE EXCEPTION 'Private sessions must never be seeded'; END IF;
  SELECT count(*) INTO n FROM public.hradnik_user_place_state;
  IF n <> 0 THEN RAISE EXCEPTION 'Private user states must never be seeded'; END IF;
  SELECT count(*) INTO n FROM public.hradnik_places;
  IF n <> 1 THEN RAISE EXCEPTION 'Expected only disposable CI fixture; got %', n; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.hradnik_sync_control WHERE id IS TRUE AND length(sync_key)=64) THEN
    RAISE EXCEPTION 'Fresh installation missing randomly generated sync_key';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.hradnik_enrich_control WHERE id IS TRUE AND length(enrich_key)>0) THEN
    RAISE EXCEPTION 'Fresh installation missing enrichment control';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.hradnik_places
    WHERE slug='ci-only-castle'
      AND photo_urls::text LIKE '%https://commons.wikimedia.org/%'
      AND photo_urls::text NOT LIKE '%http://commons.wikimedia.org/%'
  ) THEN RAISE EXCEPTION 'Photo HTTPS migration did not normalize test URL'; END IF;
  IF has_table_privilege('anon','public.hradnik_users','SELECT')
    OR has_table_privilege('authenticated','public.hradnik_sessions','SELECT')
    OR has_table_privilege('anon','public.hradnik_user_place_state','SELECT')
  THEN RAISE EXCEPTION 'Private tables exposed to browser roles'; END IF;
  IF NOT has_table_privilege('anon','public.hradnik_places','SELECT') THEN
    RAISE EXCEPTION 'Public catalog not readable by anon role';
  END IF;
  IF public.hradnik_normalize_name('Český hrad') <> 'cesky hrad' THEN
    RAISE EXCEPTION 'Normalize name SQL function behavior unexpected';
  END IF;
END
$checks$;

-- Real SELECT as restricted PostgreSQL browser role, not as superuser.
SET ROLE anon;
SELECT count(*) AS enabled_sources FROM public.hradnik_sources;
SELECT count(*) AS visible_castles FROM public.hradnik_places;
RESET ROLE;

\echo 'PASS: clean PostgreSQL baseline, HTTPS follow-up, RLS and role smoke.'
