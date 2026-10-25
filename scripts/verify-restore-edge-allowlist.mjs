import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// Offline-only inventory check. Does not invoke Supabase CLI or deploy anything.
// Keep this independent of the JSON allowlist so an accidental addition fails CI.
const expectedApproved = [
  'hradnik-auth',
  'hradnik-admin',
  'hradnik-quality',
  'hradnik-photo',
  'hradnik-sync',
  'hradnik-enrich-v4',
  'hradnik-geocode-v3'
]
const expectedExcluded = ['hradnik-geocode', 'hradnik-migrate-temporary']
const root = process.cwd()
const manifest = JSON.parse(readFileSync(join(root, 'supabase/restore-edge-allowlist.json'), 'utf8'))

function assertExactList(actual, expected, label) {
  assert(Array.isArray(actual), label + ' must be an array')
  assert(actual.every(value => typeof value === 'string'), label + ' must contain only strings')
  assert.equal(new Set(actual).size, actual.length, label + ' must not contain duplicates')
  assert.deepEqual([...actual].sort(), [...expected].sort(), label + ' differs from the reviewed function inventory')
}

assert.equal(manifest.schemaVersion, 1, 'Unreviewed Edge allowlist schema version')
assertExactList(manifest.approvedForIsolatedRestore, expectedApproved, 'Approved functions')
assertExactList(manifest.excludedFromRestore, expectedExcluded, 'Excluded functions')
assert(manifest.approvedForIsolatedRestore.every(slug => !manifest.excludedFromRestore.includes(slug)), 'Approved and excluded functions overlap')

const functionRoot = join(root, 'supabase/functions')
const folders = readdirSync(functionRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory()).map(entry => entry.name)
assert.deepEqual(folders.sort(), [...expectedApproved, 'hradnik-geocode'].sort(),
  'An unexpected/missing source folder requires review before any isolated restore')

for (const slug of expectedApproved) {
  const entrypoint = statSync(join(functionRoot, slug, 'index.ts'))
  assert(entrypoint.isFile() && entrypoint.size > 0, 'Missing/empty Edge entrypoint: ' + slug)
}
console.log('PASS: seven approved isolated-restore Edge Functions, legacy and temporary functions excluded (offline only).')
