import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

function run(overrides = {}) {
  return spawnSync(process.execPath, ['scripts/verify-restore-target.mjs'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      HRADNIK_RESTORE_APPROVED: 'yes',
      HRADNIK_RESTORE_TARGET_URL: 'https://abcdefghijklmnopqrst.supabase.co',
      HRADNIK_PREVIEW_URL: 'https://hradnik-safe-test.vercel.app',
      ...overrides
    }
  })
}

let scenarios = 0
function accept(overrides = {}) {
  const result = run(overrides)
  assert.equal(result.status, 0, 'Safe isolated URL combination should pass: ' + result.stderr)
  scenarios++
}
function reject(overrides, label) {
  const result = run(overrides)
  assert.notEqual(result.status, 0, 'Unsafe configuration should be rejected: ' + label)
  scenarios++
}

accept()
for (const target of [
  'https://abqiprdggptuxebhpfyi.supabase.co',
  'https://cgshssdjgzzuprlwnabl.supabase.co',
  'http://abcdefghijklmnopqrst.supabase.co',
  'https://example.com',
  'https://abcdefghijklmnopqrst.supabase.co/fn',
  'https://abcdefghijklmnopqrst.supabase.co:8443',
  'https://user@abcdefghijklmnopqrst.supabase.co',
  'https://abcdefghijklmnopqrst.supabase.co?debug=1',
  'https://abcdefghijklmnopqrst.supabase.co#debug',
  ''
]) reject({ HRADNIK_RESTORE_TARGET_URL: target }, 'target ' + target)

for (const options of [
  { HRADNIK_RESTORE_APPROVED: 'no' },
  { HRADNIK_RESTORE_APPROVED: '' },
  { HRADNIK_RESTORE_APPROVED: 'YES' },
  { HRADNIK_PREVIEW_URL: 'https://hradnik.vercel.app' },
  { HRADNIK_PREVIEW_URL: 'https://other.example.com' },
  { HRADNIK_PREVIEW_URL: '' },
  { HRADNIK_PREVIEW_URL: 'http://hradnik-safe-test.vercel.app' },
  { HRADNIK_PREVIEW_URL: 'https://hradnik-safe-test.vercel.app:8443' },
  { HRADNIK_PREVIEW_URL: 'https://hradnik-safe-test.vercel.app/test' },
  { HRADNIK_PREVIEW_URL: 'https://hradnik-safe-test.vercel.app?debug=1' },
  { HRADNIK_PREVIEW_URL: 'https://hradnik-safe-test.vercel.app#debug' },
  { HRADNIK_PREVIEW_URL: 'https://user@hradnik-safe-test.vercel.app' }
]) reject(options, JSON.stringify(options))

assert.equal(scenarios, 23, 'Keep the safety matrix intentionally complete')
console.log('PASS: ' + scenarios + ' offline P2-10 restore target and approval guard scenarios.')
