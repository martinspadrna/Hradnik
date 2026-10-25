import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const source = readFileSync(new URL('./verify-restore-edge-allowlist.mjs', import.meta.url), 'utf8')
const sourceManifest = JSON.parse(readFileSync(new URL('../supabase/restore-edge-allowlist.json', import.meta.url), 'utf8'))

function runFixture(change = () => {}) {
  const root = mkdtempSync(join(tmpdir(), 'hradnik-edge-guard-'))
  try {
    mkdirSync(join(root, 'scripts'), { recursive: true })
    mkdirSync(join(root, 'supabase/functions'), { recursive: true })
    writeFileSync(join(root, 'scripts/verify-restore-edge-allowlist.mjs'), source)
    const manifest = JSON.parse(JSON.stringify(sourceManifest))
    for (const slug of [...manifest.approvedForIsolatedRestore, 'hradnik-geocode']) {
      mkdirSync(join(root, 'supabase/functions', slug), { recursive: true })
      writeFileSync(join(root, 'supabase/functions', slug, 'index.ts'), '// synthetic offline entrypoint\n')
    }
    change({ root, manifest })
    writeFileSync(join(root, 'supabase/restore-edge-allowlist.json'), JSON.stringify(manifest))
    return spawnSync(process.execPath, ['scripts/verify-restore-edge-allowlist.mjs'], { cwd: root, encoding: 'utf8' })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

let count = 0
function accept(change) {
  const result = runFixture(change)
  assert.equal(result.status, 0, result.stderr)
  count++
}
function reject(change, label) {
  const result = runFixture(change)
  assert.notEqual(result.status, 0, label + ' must be rejected')
  count++
}

accept()
reject(({ root }) => rmSync(join(root, 'supabase/functions/hradnik-auth/index.ts')), 'Missing approved entrypoint')
reject(({ root }) => {
  mkdirSync(join(root, 'supabase/functions/hradnik-migrate-temporary'))
  writeFileSync(join(root, 'supabase/functions/hradnik-migrate-temporary/index.ts'), '// forbidden')
}, 'Live-only migration helper added to repository')
reject(({ root }) => {
  mkdirSync(join(root, 'supabase/functions/unreviewed'))
  writeFileSync(join(root, 'supabase/functions/unreviewed/index.ts'), '// new')
}, 'Unreviewed function directory')
reject(({ manifest }) => manifest.approvedForIsolatedRestore.push('hradnik-geocode'), 'Legacy geocoder approved')
reject(({ manifest }) => manifest.approvedForIsolatedRestore.pop(), 'Required function missing')
reject(({ manifest }) => manifest.approvedForIsolatedRestore.push('hradnik-auth'), 'Duplicate approved function')
reject(({ manifest }) => manifest.excludedFromRestore.pop(), 'Migration-helper exclusion removed')
reject(({ root }) => writeFileSync(join(root, 'supabase/functions/hradnik-admin/index.ts'), ''), 'Empty function entrypoint')
assert.equal(count, 9)
console.log('PASS: ' + count + ' offline Edge Function allowlist integrity scenarios.')
