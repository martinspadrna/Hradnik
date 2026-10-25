import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const script=readFileSync(new URL('./verify-restore-edge-env.mjs',import.meta.url),'utf8')
const allow=readFileSync(new URL('../supabase/restore-edge-allowlist.json',import.meta.url),'utf8')
const original=JSON.parse(readFileSync(new URL('../supabase/restore-edge-env.json',import.meta.url),'utf8'))
const sources=Object.keys(original.functions).map(slug=>({slug,code:readFileSync(new URL('../supabase/functions/'+slug+'/index.ts',import.meta.url),'utf8')}))
function run(change=()=>{}) {
  const dir=mkdtempSync(join(tmpdir(),'hradnik-env-'))
  try {
    mkdirSync(join(dir,'scripts'),{recursive:true})
    mkdirSync(join(dir,'supabase/functions'),{recursive:true})
    writeFileSync(join(dir,'scripts/verify-restore-edge-env.mjs'),script)
    writeFileSync(join(dir,'supabase/restore-edge-allowlist.json'),allow)
    const inventory=JSON.parse(JSON.stringify(original))
    for (const {slug,code} of sources) {
      const folder=join(dir,'supabase/functions',slug)
      mkdirSync(folder,{recursive:true})
      writeFileSync(join(folder,'index.ts'),code)
    }
    change({dir,inventory})
    writeFileSync(join(dir,'supabase/restore-edge-env.json'),JSON.stringify(inventory))
    return spawnSync(process.execPath,['scripts/verify-restore-edge-env.mjs'],{cwd:dir,encoding:'utf8'})
  } finally { rmSync(dir,{recursive:true,force:true}) }
}
let count=0
function passes(change) {const result=run(change);assert.equal(result.status,0,result.stderr);count++}
function fails(change,label) {const result=run(change);assert.notEqual(result.status,0,label);count++}
passes()
fails(({inventory})=>inventory.functions['hradnik-enrich-v4']=[],'missing custom fallback')
fails(({inventory})=>inventory.functions['hradnik-auth']=['SECRET'],'unexpected fallback')
fails(({inventory})=>inventory.secretValue='should never be stored','extra secret value')
fails(({dir})=>{
  const p=join(dir,'supabase/functions/hradnik-sync/index.ts')
  writeFileSync(p,readFileSync(p,'utf8')+"\nconst test=Deno.env.get('UNREVIEWED')\n")
},'new env dependency')
fails(({dir})=>{
  const p=join(dir,'supabase/functions/hradnik-photo/index.ts')
  writeFileSync(p,readFileSync(p,'utf8').replace("Deno.env.get('SUPABASE_URL')","Deno.env.get('OTHER_URL')"))
},'changed standard env variable')
fails(({dir})=>{
  const p=join(dir,'supabase/functions/hradnik-quality/index.ts')
  writeFileSync(p,readFileSync(p,'utf8')+"\nconst test=Deno.env.get(runtimeName)\n")
},'dynamic env lookup')
assert.equal(count,7)
console.log('PASS: '+count+' synthetic Edge environment inventory scenarios.')
