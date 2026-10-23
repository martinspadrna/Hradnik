import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

function run(overrides = {}) {
  const r = spawnSync(process.execPath, ['scripts/verify-restore-target.mjs'], {
    encoding: 'utf8',
    env: { ...process.env, HRADNIK_RESTORE_APPROVED:'yes',
      HRADNIK_RESTORE_TARGET_URL: 'https://abcdefghijklmnopqrst.supabase.co',
      HRADNIK_PREVIEW_URL:'https://hradnik-safe-test.vercel.app',
      ...overrides }
  })
  return r
}
assert.equal(run().status, 0, 'Isolated approved test environment must pass')
for (const target of [
 'https://abqiprdggptuxebhpfyi.supabase.co',
 'https://cgshssdjgzzuprlwnabl.supabase.co',
 'http://abcdefghijklmnopqrst.supabase.co',
 'https://example.com',
 'https://abcdefghijklmnopqrst.supabase.co/fn',
 ''
]) assert.notEqual(run({ HRADNIK_RESTORE_TARGET_URL:target }).status, 0, 'Unsafe or missing target should be rejected: '+target)
for (const options of [
 {HRADNIK_RESTORE_APPROVED:'no'},
 {HRADNIK_RESTORE_APPROVED:''},
 {HRADNIK_PREVIEW_URL:'https://hradnik.vercel.app'},
 {HRADNIK_PREVIEW_URL:'https://other.example.com'},
 {HRADNIK_PREVIEW_URL:''}
]) assert.notEqual(run(options).status, 0, 'Unsafe approval/preview combination should be rejected')
console.log('PASS: 12 offline P2-10 target/approval guard scenarios.')
