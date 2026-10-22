import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

// Offline schema preflight. This NEVER connects to or changes Supabase.
const baseline = await readFile('supabase/migrations/20261003_hradnik_standalone_baseline.sql', 'utf8')
const followup = await readFile('supabase/migrations/20261007_hradnik_photo_urls_https.sql', 'utf8')
const requireMatch = (re, what) => assert(re.test(baseline), 'Missing from standalone baseline: ' + what)
const matchNames = re => [...baseline.matchAll(re)].map(m => m[1])

const tables = [
  'hradnik_sources', 'hradnik_places', 'hradnik_place_sources',
  'hradnik_sync_runs', 'hradnik_sync_control', 'hradnik_users',
  'hradnik_sessions', 'hradnik_user_place_state', 'hradnik_enrich_control'
]
for (const name of tables) {
  requireMatch(new RegExp('create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.' + name + '\\s*\\(', 'i'), name + ' table')
  requireMatch(new RegExp('alter\\s+table\\s+public\\.' + name + '\\s+enable\\s+row\\s+level\\s+security\\s*;', 'i'), name + ' RLS')
}
const actualTables = matchNames(/create\s+table\s+if\s+not\s+exists\s+public\.(hradnik_\w+)/gi)
assert.deepEqual([...actualTables].sort(), [...tables].sort(), 'Unexpected standalone tables')

const requiredPolicies = ['hradnik_sources_public_read', 'hradnik_places_public_read', 'hradnik_place_sources_public_read']
for (const name of requiredPolicies) requireMatch(new RegExp('create\\s+policy\\s+' + name + '\\s+', 'i'), name + ' policy')
assert.equal(matchNames(/create\s+policy\s+(\w+)/gi).length, 3)

const requiredFunctions = [
  'hradnik_normalize_name', 'hradnik_dedupe_key', 'hradnik_extract_kind_tags',
  'hradnik_quality_ok', 'hradnik_force_ruin_kind', 'hradnik_quality_guard',
  'hradnik_admin_deleted_source_guard', 'hradnik_compute_quality',
  'hradnik_refresh_place_quality_from_source', 'hradnik_ingest_source_records',
  'hradnik_auto_dedupe', 'hradnik_auto_dedupe_v3',
  'hradnik_merge_obvious_duplicates', 'hradnik_requeue_fallbacks'
]
assert.deepEqual(
  matchNames(/create\s+or\s+replace\s+function\s+public\.(\w+)\s*\(/gi).sort(),
  [...requiredFunctions].sort(),
  'RPC/functions have drifted from audited baseline'
)
for (const name of requiredFunctions) {
  requireMatch(new RegExp('revoke\\s+all\\s+on\\s+function\\s+public\\.' + name + '\\s*\\(', 'i'), 'revoke PUBLIC EXECUTE: ' + name)
  requireMatch(new RegExp('grant\\s+execute\\s+on\\s+function\\s+public\\.' + name + '\\s*\\([\\s\\S]*?\\)\\s+to\\s+service_role', 'i'), 'service_role EXECUTE: ' + name)
}
assert.equal(matchNames(/create\s+trigger\s+(\w+)/gi).length, 5, 'Expected five Hradnik triggers')
assert.equal(matchNames(/create\s+(?:unique\s+)?index\s+if\s+not\s+exists\s+(\w+)/gi).length, 27, 'Expected 27 explicitly named indexes')

for (const expected of [
  /references\s+public\.hradnik_places\s*\(\s*id\s*\)\s+on\s+delete\s+cascade/i,
  /references\s+public\.hradnik_users\s*\(\s*id\s*\)\s+on\s+delete\s+cascade/i,
  /references\s+public\.hradnik_sources\s*\(\s*source_key\s*\)\s+on\s+delete\s+cascade/i,
  /create\s+extension\s+if\s+not\s+exists\s+pgcrypto\s+with\s+schema\s+extensions/i,
  /create\s+extension\s+if\s+not\s+exists\s+pg_trgm\s+with\s+schema\s+extensions/i,
  /grant\s+select\s+on\s+table\s+public\.hradnik_sources,\s*public\.hradnik_places,\s*public\.hradnik_place_sources\s+to\s+anon,\s*authenticated/i,
  /revoke\s+all\s+on\s+table\s+public\.hradnik_sources,[\s\S]*?from\s+anon,\s*authenticated/i,
  /insert\s+into\s+public\.hradnik_sync_control\s*\(\s*id,\s*sync_key\s*\)[\s\S]*?extensions\.gen_random_bytes\s*\(\s*32\s*\)/i,
  /insert\s+into\s+public\.hradnik_enrich_control\s*\(\s*id\s*\)/i
]) requireMatch(expected, expected.toString())

const sourceSeed = baseline.match(/insert\s+into\s+public\.hradnik_sources\s*\([^;]+?on\s+conflict/is)?.[0] || ''
assert.equal((sourceSeed.match(/^\s*\('[^']+',/gm) || []).length, 9, 'Expected nine catalog source seeds')
// SQL functions legitimately INSERT rows when called at runtime.
// Only inspect top-level seed statements after the function / policy definitions.
const seedBlock = baseline.slice(baseline.indexOf('insert into public.hradnik_sources(source_key'))
assert(seedBlock.length > 0 && seedBlock.length < baseline.length, 'Expected catalog seed block not found')
assert(!/insert\s+into\s+public\.hradnik_(?:users|sessions|user_place_state)\b/i.test(seedBlock), 'Private account/session data must never be embedded in static seed statements')
assert(!/insert\s+into\s+public\.hradnik_places\b/i.test(seedBlock), 'Production catalog must be imported/synced separately')

assert(/update\s+public\.hradnik_places/i.test(followup), 'Photo URL follow-up missing')
assert(/where\s+photo_urls\s+is\s+not\s+null/i.test(followup), 'Photo URL follow-up needs a guard')
assert(/https:\/\/commons\.wikimedia\.org/.test(followup), 'Expected HTTPS Wikimedia normalization')
console.log('P0-03 static migration audit PASS: 9 tables/RLS, 14 protected functions, 5 triggers, 27 indexes, 3 public policies, 9 catalog sources.')
console.log('This is NOT a fresh-database restore test. The catalog, private users, credentials and Edge deployment are separate steps.')
