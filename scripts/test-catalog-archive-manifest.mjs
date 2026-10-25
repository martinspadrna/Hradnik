import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const header='; pg_restore --list output\n; Dumped from database version 16\n'
const places='1234; 0 20000 TABLE DATA public hradnik_places postgres\n'
const links='1235; 0 20001 TABLE DATA public hradnik_place_sources postgres\n'
const seq1='1236; 0 0 SEQUENCE SET public hradnik_places_id_seq postgres\n'
const seq2='1237; 0 0 SEQUENCE SET public hradnik_place_sources_id_seq postgres\n'
const base=header+places+links

function run(content) {
  const folder=mkdtempSync(join(tmpdir(),'hradnik-archive-'))
  try {
    const name=join(folder,'archive.list')
    writeFileSync(name,content)
    return spawnSync(process.execPath,['scripts/verify-catalog-archive-manifest.mjs',name],{
      cwd:process.cwd(),encoding:'utf8'
    })
  } finally { rmSync(folder,{recursive:true,force:true}) }
}
let scenarios=0
function passes(content,label) {
  const result=run(content)
  assert.equal(result.status,0,label+': '+result.stderr)
  scenarios++
}
function rejects(content,label) {
  const result=run(content)
  assert.notEqual(result.status,0,label+' must fail closed')
  scenarios++
}

passes(base,'two catalog tables')
passes(header+links+places+seq1+seq2,'different order with catalog sequences')
rejects(header+places,'missing source-link table')
rejects(header+places+places+links,'duplicate table data')
rejects(base+'1238; 0 20004 TABLE DATA public hradnik_users postgres\n','private user data')
rejects(base+'1239; 0 20005 TABLE DATA public hradnik_user_place_state postgres\n','private visit dates')
rejects(base+'1240; 0 20006 TABLE DATA public hradnik_sessions postgres\n','private sessions')
rejects(base+'1241; 0 20007 TABLE DATA public hradnik_new_unknown postgres\n','unreviewed future table')
rejects(base.replace('TABLE DATA public hradnik_places','TABLE DATA private hradnik_places'),'non-public schema')
rejects(base+'1242; 0 0 SEQUENCE SET public hradnik_users_id_seq postgres\n','non-catalog sequence')
rejects(base+'1243; 0 0 BLOBS - BLOBS postgres\n','non-table archive object')
rejects(header,'empty catalog archive')
rejects(base+'not a real TOC entry\n','malformed manifest')
assert.equal(scenarios,13)
console.log('PASS: '+scenarios+' synthetic catalogue-only archive allowlist scenarios.')
