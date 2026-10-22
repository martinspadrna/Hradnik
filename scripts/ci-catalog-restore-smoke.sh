#!/usr/bin/env bash
set -Eeuo pipefail

# Refuse remote/project databases: this test may run only in disposable Actions.
if [[ "$GITHUB_ACTIONS" != "true" || "$PGHOST" != "127.0.0.1" || "$PGPORT" != "5432" || "$PGDATABASE" != "hradnik_ci" || "$PGUSER" != "postgres" ]]; then
  echo "Refusing catalog restore smoke outside isolated GitHub Actions PostgreSQL." >&2
  exit 2
fi
target_db="hradnik_ci_restore"
scratch="$(mktemp -d)"
trap 'rm -rf "$scratch"' EXIT

# Synthetic catalogue with intentionally high explicit identifiers.
psql -X -v ON_ERROR_STOP=1 -d hradnik_ci <<'SQL'
INSERT INTO public.hradnik_places
  (id, source_key, external_id, slug, name, kind, photo_urls)
VALUES
  (910001, 'osm', 'ci-restore-osm', 'ci-restore-one', 'Hrad CI pro obnovu', 'Hrad', '["https://example.invalid/ci/1.jpg"]'::jsonb),
  (910002, 'npu', 'ci-restore-npu', 'ci-restore-two', 'Tvrz CI pro obnovu', 'Tvrz', '[]'::jsonb);
INSERT INTO public.hradnik_place_sources (place_id, source_key, external_id, source_url, raw_data)
VALUES
  (910001, 'osm', 'ci-restore-link-osm', 'https://example.invalid/ci/osm', '{}'::jsonb),
  (910001, 'hradycz', 'ci-restore-link-hrady', 'https://example.invalid/ci/hrady', '{}'::jsonb),
  (910002, 'npu', 'ci-restore-link-npu', 'https://example.invalid/ci/npu', '{}'::jsonb);
UPDATE public.hradnik_places SET source_count=2 WHERE id=910001;
UPDATE public.hradnik_places SET source_count=1 WHERE id=910002;

-- Deliberately excluded from the catalogue-only backup.
WITH fake AS (
  INSERT INTO public.hradnik_users (username,password_hash)
  VALUES ('ci_backup_do_not_copy', 'ci-dummy-never-a-real-password-hash')
  RETURNING id
)
INSERT INTO public.hradnik_user_place_state (user_id,place_id,status,visited_on)
SELECT id,910001,'visited',DATE '2026-10-22' FROM fake;
SQL

pg_dump -Fc --data-only --no-owner --no-privileges \
  -t public.hradnik_places -t public.hradnik_place_sources \
  --file="$scratch/public-catalog.dump" -d hradnik_ci

# Inspect archive manifest before importing; never dump private accounts.
if pg_restore --list "$scratch/public-catalog.dump" | grep -E 'TABLE DATA .*hradnik_(users|sessions|user_place_state|sync_control|enrich_control)' ; then
  echo "Private account/control data detected in catalog archive." >&2
  exit 3
fi

# Independently initialized target, within the same disposable CI service.
createdb --template=template0 "$target_db"
psql -X -v ON_ERROR_STOP=1 -d "$target_db" -c 'CREATE SCHEMA IF NOT EXISTS extensions;'
psql -X -v ON_ERROR_STOP=1 -d "$target_db" --single-transaction \
  -f supabase/migrations/20261003_hradnik_standalone_baseline.sql
psql -X -v ON_ERROR_STOP=1 -d "$target_db" --single-transaction \
  -f supabase/migrations/20261007_hradnik_photo_urls_https.sql

pg_restore --exit-on-error --data-only --no-owner --no-privileges \
  --dbname="$target_db" "$scratch/public-catalog.dump"

# A data-only archive can carry the SOURCE sequence state even when explicit
# imported IDs are much higher; advance IDs after any ID-preserving import.
psql -X -v ON_ERROR_STOP=1 -d "$target_db" <<'SQL'
SELECT setval(pg_get_serial_sequence('public.hradnik_places','id'),
  (SELECT max(id) FROM public.hradnik_places), true);
SELECT setval(pg_get_serial_sequence('public.hradnik_place_sources','id'),
  (SELECT max(id) FROM public.hradnik_place_sources), true);
SQL

psql -X -v ON_ERROR_STOP=1 -d "$target_db" \
  -f scripts/ci-catalog-restore-check.sql

echo "PASS: isolated catalogue transfer, stable IDs/source links, no private accounts, identity sequences and role grants."
