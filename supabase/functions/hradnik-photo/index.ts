import { createClient } from '@supabase/supabase-js'

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth:{persistSession:false} })
const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'content-type', 'Content-Type':'application/json' }
function norm(s=''){return s.toLocaleLowerCase('cs-CZ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').replace(/^(hrad|zamek|tvrz|klaster|pevnost|zricenina)\s+/,'').trim()}
function secureImageUrl(value:any){const url=String(value||'').trim();return /^http:\/\/(?:commons|thumb|upload)\.wikimedia\.org\//i.test(url)?'https://'+url.slice(7):url}
function imageUrlFromClaim(v:any){const id=v?.mainsnak?.datavalue?.value;if(typeof id!=='string')return '';return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(id.replaceAll(' ','_'))}?width=1400`}
async function commonsSearch(name:string,lat?:number,lon?:number){
  const params=new URLSearchParams({action:'query',generator:'search',gsrnamespace:'6',gsrlimit:'8',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'1400',format:'json',origin:'*',gsrsearch:`${name} hrad OR ${name} zámek`})
  const r=await fetch('https://commons.wikimedia.org/w/api.php?'+params.toString(),{headers:{'User-Agent':'Hradnik/1.0'}});if(!r.ok)return null;const j=await r.json();const pages=Object.values(j.query?.pages||{}) as any[]
  const n=norm(name);const scored=pages.map(p=>{const title=norm(String(p.title||'').replace(/^file:/i,''));let score=0;if(title===n)score+=10;if(title.includes(n))score+=6;const ext=p.imageinfo?.[0]?.extmetadata||{};if(ext.Artist?.value)score+=1;if(ext.LicenseShortName?.value)score+=1;return {...p,score}}).sort((a,b)=>b.score-a.score)
  const p=scored[0];if(!p?.imageinfo?.[0]?.thumburl && !p?.imageinfo?.[0]?.url)return null;const ii=p.imageinfo[0],ext=ii.extmetadata||{};return {url:ii.thumburl||ii.url,credit:ext.Artist?.value?.replace(/<[^>]+>/g,'')||'',license:ext.LicenseShortName?.value||'',source_url:`https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}`}
}
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('',{status:204,headers:cors});
 if(req.method!=='POST')return new Response(JSON.stringify({error:'POST only'}),{status:405,headers:cors});
 try{
  const body=await req.json();const id=body.place_id?Number(body.place_id):null;const name=String(body.name||'').trim();if(!name)return new Response(JSON.stringify({error:'name required'}),{status:400,headers:cors})
  let place:any=null;if(id){place=(await db.from('hradnik_places').select('id,name,wikidata_id,latitude,longitude,photo_urls,photo_credit,photo_license,photo_source_url').eq('id',id).maybeSingle()).data}else{place=(await db.from('hradnik_places').select('id,name,wikidata_id,latitude,longitude,photo_urls,photo_credit,photo_license,photo_source_url').eq('is_current',true).eq('is_visible',true).eq('normalized_name',norm(name)).order('source_count',{ascending:false}).limit(1).maybeSingle()).data}
  if(!place)return new Response(JSON.stringify({error:'place not found'}),{status:404,headers:cors})
  const storedUrls=Array.isArray(place.photo_urls)?place.photo_urls:[]
  const normalizedUrls=storedUrls.map((x:any)=>typeof x==='string'?secureImageUrl(x):x)
  const existing=normalizedUrls.find((x:any)=>typeof x==='string'&&/^https?:\/\//.test(x))
  if(existing){
    if(JSON.stringify(normalizedUrls)!==JSON.stringify(storedUrls))await db.from('hradnik_places').update({photo_urls:normalizedUrls}).eq('id',place.id)
    return new Response(JSON.stringify({url:existing,credit:place.photo_credit||'',license:place.photo_license||'',source_url:place.photo_source_url||''}),{status:200,headers:cors})
  }
  let found:any=null
  if(place.wikidata_id){try{const r=await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${place.wikidata_id}.json`,{headers:{'User-Agent':'Hradnik/1.0'}});if(r.ok){const j=await r.json();const ent=j.entities?.[place.wikidata_id];const vals=ent?.claims?.P18;if(vals?.length)found={url:imageUrlFromClaim(vals[0])}}}catch{}}
  if(!found?.url)found=await commonsSearch(place.name,place.latitude,place.longitude)
  if(!found?.url)return new Response(JSON.stringify({url:''}),{status:200,headers:cors})
  found.url=secureImageUrl(found.url)
  await db.from('hradnik_places').update({photo_urls:[found.url],photo_credit:found.credit||null,photo_license:found.license||null,photo_source_url:found.source_url||null,updated_at:new Date().toISOString()}).eq('id',place.id)
  return new Response(JSON.stringify(found),{status:200,headers:cors})
 }catch(e){return new Response(JSON.stringify({error:String(e)}),{status:500,headers:cors})}
})
