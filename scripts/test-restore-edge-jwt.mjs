import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const config=readFileSync(new URL('../supabase/config.toml',import.meta.url),'utf8')
const manifest=readFileSync(new URL('../supabase/restore-edge-allowlist.json',import.meta.url),'utf8')
const script=readFileSync(new URL('./verify-restore-edge-jwt.mjs',import.meta.url),'utf8')

function run(mutate=v=>v, mutateManifest=v=>v) {
  const dir=mkdtempSync(join(tmpdir(),'hradnik-jwt-'))
  try {
    mkdirSync(join(dir,'scripts'),{recursive:true})
    mkdirSync(join(dir,'supabase'),{recursive:true})
    writeFileSync(join(dir,'scripts/verify-restore-edge-jwt.mjs'),script)
    writeFileSync(join(dir,'supabase/config.toml'),mutate(config))
    writeFileSync(join(dir,'supabase/restore-edge-allowlist.json'),mutateManifest(manifest))
    return spawnSync(process.execPath,['scripts/verify-restore-edge-jwt.mjs'],{cwd:dir,encoding:'utf8'})
  } finally { rmSync(dir,{recursive:true,force:true}) }
}

let n=0
function pass(change,manifestChange) { const r=run(change,manifestChange);assert.equal(r.status,0,r.stderr);n++ }
function reject(label,change,manifestChange) { const r=run(change,manifestChange);assert.notEqual(r.status,0,label);n++ }
pass()
reject('JWT unexpectedly enabled',v=>v.replace('[functions.hradnik-auth]\nverify_jwt = false','[functions.hradnik-auth]\nverify_jwt = true'))
reject('JWT line omitted',v=>v.replace('[functions.hradnik-photo]\nverify_jwt = false','[functions.hradnik-photo]'))
reject('Unknown setting',v=>v.replace('[functions.hradnik-admin]','[functions.hradnik-admin]\nentrypoint = "malicious.ts"'))
reject('Legacy function included',v=>v+'\n[functions.hradnik-geocode]\nverify_jwt = false\n')
reject('Temporary migration helper included',v=>v+'\n[functions.hradnik-migrate-temporary]\nverify_jwt = false\n')
reject('Duplicate function',v=>v+'\n[functions.hradnik-auth]\nverify_jwt = false\n')
reject('Allowlist mismatch',v=>v,m=>m.replace('"hradnik-photo",',''))
assert.equal(n,8)
console.log('PASS: '+n+' offline Edge JWT configuration scenarios.')
