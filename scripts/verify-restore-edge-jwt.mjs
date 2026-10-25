import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Static comparison against the explicitly reviewed production JWT settings.
// This reads no Supabase credentials and never deploys any Edge Function.
const root=process.cwd()
const approved=JSON.parse(readFileSync(join(root,'supabase/restore-edge-allowlist.json'),'utf8')).approvedForIsolatedRestore
const config=readFileSync(join(root,'supabase/config.toml'),'utf8')
const expected=['hradnik-auth','hradnik-admin','hradnik-quality','hradnik-photo','hradnik-sync','hradnik-enrich-v4','hradnik-geocode-v3']
assert.deepEqual([...approved].sort(),[...expected].sort(),'Function allowlist changed: review deployed configuration first')

const seen=new Map()
let active=null
for(const original of config.split(/\r?\n/)) {
  const line=original.replace(/\s+#.*$/,'').trim()
  if(!line || line.startsWith('#')) continue
  const section=line.match(/^\[functions\.([a-z0-9-]+)\]$/)
  if(section) {
    active=section[1]
    assert(expected.includes(active),'Unapproved function configuration: '+active)
    assert(!seen.has(active),'Duplicate function section: '+active)
    seen.set(active,[])
  } else {
    assert(active,'Unexpected global configuration line: '+line)
    assert(/^verify_jwt\s*=\s*false$/.test(line),'Unexpected function setting for '+active+': '+line)
    seen.get(active).push('verify_jwt=false')
  }
}
assert.deepEqual([...seen.keys()].sort(),[...expected].sort(),'Missing function JWT settings')
for(const slug of expected)
  assert.deepEqual(seen.get(slug),['verify_jwt=false'],'JWT setting must be explicitly false exactly once: '+slug)
console.log('PASS: seven isolated-restore Edge JWT settings match read-only production inventory, no legacy deployment.')
