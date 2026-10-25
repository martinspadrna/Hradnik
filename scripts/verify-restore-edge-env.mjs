import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
// Offline names only: never reads deployed secrets or opens a network connection.
const root=process.cwd()
const approved=JSON.parse(readFileSync(join(root,'supabase/restore-edge-allowlist.json'),'utf8')).approvedForIsolatedRestore
const config=JSON.parse(readFileSync(join(root,'supabase/restore-edge-env.json'),'utf8'))
const standard=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY']
const fallbacks={
  'hradnik-auth':[], 'hradnik-admin':[], 'hradnik-quality':[],
  'hradnik-photo':[], 'hradnik-sync':[],
  'hradnik-enrich-v4':['HRADNIK_ENRICH_KEY'],
  'hradnik-geocode-v3':['HRADNIK_GEOCODE_KEY']
}
const sorted=v=>[...v].sort()
assert.deepEqual(sorted(Object.keys(config)),sorted(['schemaVersion','runtimeProvided','functions','note']),
  'Manifest must contain variable names only, never values')
assert.equal(config.schemaVersion,1)
assert.equal(typeof config.note,'string')
assert.deepEqual(sorted(config.runtimeProvided),sorted(standard))
assert.deepEqual(sorted(approved),sorted(Object.keys(fallbacks)))
assert.deepEqual(sorted(Object.keys(config.functions)),sorted(approved))
for (const slug of approved) {
  assert.deepEqual(sorted(config.functions[slug]),sorted(fallbacks[slug]),
    'Unreviewed environment fallback list for '+slug)
  const code=readFileSync(join(root,'supabase/functions',slug,'index.ts'),'utf8')
  const used=[...code.matchAll(/Deno\.env\.get\s*\(\s*['"]([A-Z0-9_]+)['"]\s*\)/g)].map(m=>m[1])
  const calls=[...code.matchAll(/Deno\.env\.get\s*\(/g)].length
  assert.equal(used.length,calls,'Dynamic environment lookups require review in '+slug)
  assert.deepEqual(sorted([...new Set(used)]),sorted([...standard,...fallbacks[slug]]),
    'Environment names in source differ from approved metadata for '+slug)
}
console.log('PASS: seven Edge Function environment inventories match sources; no secret values read.')
