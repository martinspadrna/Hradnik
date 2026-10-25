import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Validate pg_restore --list output before importing a catalogue-only archive.
// This is an offline allowlist: private or unrelated database objects fail closed.
const path=process.argv[2]
assert(path,'Supply an actual pg_restore --list manifest file')
const manifest=readFileSync(path,'utf8')
const requiredTables=new Set(['hradnik_places','hradnik_place_sources'])
const allowedSequences=new Set(['hradnik_places_id_seq','hradnik_place_sources_id_seq'])
const foundTables=new Set()
const foundSequences=new Set()
let count=0

for(const line of manifest.split(/\r?\n/)) {
  const entry=line.trim()
  if(!entry || entry.startsWith(';')) continue
  const match=entry.match(/^\d+;\s+\d+\s+\d+\s+(TABLE DATA|SEQUENCE SET)\s+(\S+)\s+(\S+)\s+(\S+)$/)
  assert(match,'Unexpected archive object or malformed TOC entry: '+entry)
  const [,kind,schema,name]=match
  assert.equal(schema,'public','Catalog archive object outside public schema: '+name)
  if(kind==='TABLE DATA') {
    assert(requiredTables.has(name),'Non-catalog table in archive: '+name)
    assert(!foundTables.has(name),'Duplicate catalog table data in archive: '+name)
    foundTables.add(name)
  } else {
    assert(allowedSequences.has(name),'Non-catalog sequence in archive: '+name)
    assert(!foundSequences.has(name),'Duplicate catalog sequence in archive: '+name)
    foundSequences.add(name)
  }
  count++
}

assert.deepEqual([...foundTables].sort(),[...requiredTables].sort(),
  'Archive must include exactly the two approved catalog tables')
assert(count>=2 && count<=4,'Unexpected number of archive objects')
console.log('PASS: archive TOC contains exactly two catalogue tables and no extra objects ('+count+' entries).')
