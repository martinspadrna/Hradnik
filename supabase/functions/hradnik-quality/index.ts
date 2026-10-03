import { createClient } from 'npm:@supabase/supabase-js@2.112.4'
const URL=Deno.env.get('SUPABASE_URL')!
const KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const db=createClient(URL,KEY,{auth:{persistSession:false}})
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json'}
const json=(d:any,s=200)=>new Response(JSON.stringify(d),{status:s,headers:CORS})
const enc=new TextEncoder()
const b64=(b:Uint8Array)=>{let s='';for(const x of b)s+=String.fromCharCode(x);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function tokenHash(token:string){return b64(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(token))))}
async function admin(req:Request){const h=req.headers.get('authorization')||'';if(!h.toLowerCase().startsWith('bearer '))return null;const token=h.slice(7).trim();if(!token)return null;const th=await tokenHash(token);const {data}=await db.from('hradnik_sessions').select('user_id,expires_at,hradnik_users(id,username,display_name,role)').eq('token_hash',th).gt('expires_at',new Date().toISOString()).maybeSingle();const u=(data as any)?.hradnik_users;return u?.role==='admin'?u:null}
Deno.serve(async(req)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:CORS})
 if(req.method!=='POST')return json({ok:true,service:'hradnik-quality'})
 const me=await admin(req);if(!me)return json({error:'Přístup mají jen administrátoři.'},403)
 let body:any;try{body=await req.json()}catch{return json({error:'Neplatné JSON.'},400)}
 try{
  if(body.action==='list'){
   const {data,error}=await db.from('hradnik_places').select('id,name,kind,character,municipality,district,region,latitude,longitude,description,official_url,source_url,wikidata_id,quality_score,quality_status,quality_reason,quality_checked_at,admin_deleted,is_visible').eq('is_current',true).eq('quality_status','needs_review').order('quality_score',{ascending:true}).order('name').limit(500)
   if(error)throw error
   return json({ok:true,places:data||[]})
  }
  const id=Number(body.id);if(!Number.isSafeInteger(id))return json({error:'Neplatné ID památky.'},400)
  if(body.action==='approve'){
   const {data,error}=await db.from('hradnik_places').update({quality_score:100,quality_status:'verified',quality_reason:`Ručně potvrzeno administrátorem ${me.username}`,quality_checked_at:new Date().toISOString(),is_visible:true,is_current:true,admin_deleted:false,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(error)throw error;return json({ok:true,place:data})
  }
  if(body.action==='reject'){
   const reason=String(body.reason||'Ručně zamítnuto administrátorem').slice(0,300)
   const {data,error}=await db.from('hradnik_places').update({quality_score:0,quality_status:'rejected',quality_reason:`${reason} (${me.username})`,quality_checked_at:new Date().toISOString(),is_visible:false,updated_at:new Date().toISOString()}).eq('id',id).select('*').single();if(error)throw error;return json({ok:true,place:data})
  }
  return json({error:'Neznámá akce.'},400)
 }catch(e){console.error(e);return json({error:'Interní chyba kontroly kvality.'},500)}
})
