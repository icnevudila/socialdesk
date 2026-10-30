import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { createStore, validatePost } from './store.mjs';
import { graph, profile, media } from './meta.mjs';
import { createIntegrations } from './integrations.mjs';
import {saveMedia,readMedia,materializeImage} from './media.mjs';
import { generateText, generateImage, checkAiHealth } from './ai.mjs';
import {privateCall} from './private.mjs';
import { createScheduler } from './scheduler.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4317);
const defaultDataDir = process.env.VERCEL ? '/tmp/socialdesk-data' : path.join(root,'data');
const store = await createStore(process.env.SOCIALDESK_DATA_DIR || defaultDataDir, { seed: Boolean(process.env.VERCEL) });
const integrations=await createIntegrations(process.env.SOCIALDESK_DATA_DIR || defaultDataDir);
function canPublish(id){try{const a=integrations.account(id);return Boolean(a.verifiedAt&&a.publishing)}catch{return false}}
const json = (res, code, value) => {res.writeHead(code, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
async function body(req) { let s=''; for await (const c of req) {s+=c; if (Buffer.byteLength(s)>200000) throw new Error('İstek çok büyük.');} return JSON.parse(s || '{}'); }
function validUrl(value) { const u=new URL(value); if(u.protocol!=='https:' || !['instagram.com','www.instagram.com'].includes(u.hostname) || !/^\/(p|reel)\/[\w-]+\/?$/.test(u.pathname)) throw new Error('Instagram gönderi veya Reels bağlantısı girin.'); return u.origin+u.pathname; }
const server = http.createServer(async(req,res)=>{
  if(!process.env.VERCEL){
    const allowedHost = [`127.0.0.1:${port}`,`localhost:${port}`];
    if(!allowedHost.includes(req.headers.host)) return json(res,403,{error:'Yerel erişim gerekli.'});
    if(req.headers.origin && ![`http://127.0.0.1:${port}`,`http://localhost:${port}`].includes(req.headers.origin)) return json(res,403,{error:'Kaynak izinli değil.'});
  }
  if(req.headers['sec-fetch-site']==='cross-site')return json(res,403,{error:'Kaynak izinli değil.'});
  if(['POST','PUT','DELETE'].includes(req.method)&&req.headers['content-type']&&!req.headers['content-type'].startsWith('application/json')&&req.url!=='/api/media')return json(res,415,{error:'JSON istek gerekli.'});
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http://167.233.201.31:3456 https://media.167.233.201.31.nip.io; media-src 'self' blob: https: http://167.233.201.31:3456 https://media.167.233.201.31.nip.io; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  try {
    const url=new URL(req.url,'http://localhost'); const p=url.pathname;
    if(p==='/api/media'&&req.method==='POST'){let bytes=0;const chunks=[];for await(const c of req){bytes+=c.length;if(bytes>50*1024*1024)throw Error('Dosya en fazla 50 MB olabilir.');chunks.push(c)}return json(res,201,await saveMedia(process.env.SOCIALDESK_DATA_DIR||defaultDataDir,Buffer.concat(chunks)))}
    if(p.startsWith('/media/')&&req.method==='GET'){
      const relName = p.slice(7);
      const pubPath = path.resolve(root, 'public', 'media', relName);
      if(pubPath.startsWith(path.resolve(root, 'public', 'media'))){
        try{
          const buf = await readFile(pubPath);
          const ext = path.extname(pubPath).toLowerCase();
          const mimes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4' };
          res.writeHead(200, { 'Content-Type': mimes[ext] || 'application/octet-stream', 'Content-Length': buf.length, 'Cache-Control': 'public, max-age=86400' });
          return res.end(buf);
        }catch{}
      }
      try{const m=await readMedia(process.env.SOCIALDESK_DATA_DIR||defaultDataDir,relName);res.writeHead(200,{'Content-Type':m.mime,'Content-Length':m.buffer.length,'Cache-Control':'private, max-age=3600'});return res.end(m.buffer)}catch{return json(res,404,{error:'Medya bulunamadı.'})}
    }
    if(p==='/api/ai/health'&&req.method==='GET')return json(res,200,await checkAiHealth(integrations.ai()));
    if(p==='/api/ai/image'&&req.method==='POST'){const b=await body(req);const config=integrations.ai();const image=await generateImage(config,{prompt:b.prompt});return json(res,201,await materializeImage(process.env.SOCIALDESK_DATA_DIR||defaultDataDir,image,config))}
    if(p==='/api/workspace' && req.method==='GET') return json(res,200,{...store.read(), connection:{configured:integrations.public().accounts.some(a=>a.configured),verified:integrations.public().accounts.some(a=>a.verified),publishing:integrations.public().accounts.some(a=>a.publishing)},integrations:integrations.public(), mode:'local'});
    if(p==='/api/posts' && req.method==='POST') {
      const input=await body(req); const post=validatePost(input);
      const existing=store.read().posts.find(p=>post.requestId&&p.requestId===post.requestId);if(existing)return json(res,200,existing);
      if(post.status==='scheduled' && !canPublish(post.accountId)) return json(res,409,{error:'Otomatik paylaşım kapalı. Önce Meta bağlantısını doğrulayın; şimdilik yerel plana ekleyebilirsiniz.'});
      await store.mutate(db=>{const existing=db.posts.find(p=>post.requestId&&p.requestId===post.requestId);if(existing)return existing;db.posts.push(post);}); return json(res,201,post);
    }
    const match=p.match(/^\/api\/posts\/([\w-]+)$/);
    if(match && ['PUT','DELETE'].includes(req.method)) {
      const input=req.method==='PUT' ? await body(req) : null;
      const result=await store.mutate(db=>{const i=db.posts.findIndex(x=>x.id===match[1]);if(i<0) throw new Error('Gönderi bulunamadı.'); if(['processing','published','reconciliation_required'].includes(db.posts[i].status)) throw new Error('Bu işlem aşamasındaki gönderi düzenlenemez.');if(!input) return db.posts.splice(i,1)[0];const post=validatePost(input,db.posts[i]);if(post.status==='scheduled'&&!canPublish(post.accountId)) throw new Error('Otomatik paylaşım bağlantısı etkin değil.');db.posts[i]=post;return post;});return json(res,200,result);
    }
    if(p==='/api/brand' && req.method==='PUT') { const b=await body(req); const brand=Object.fromEntries(['name','handle','sector','audience','tone'].map(k=>[k,String(b[k]||'').trim().slice(0,300)]));if(!brand.name) throw new Error('Marka adı gerekli.');await store.mutate(db=>{db.brand=brand;});return json(res,200,brand); }
    if(p==='/api/opportunities' && req.method==='POST') {const b=await body(req);const item={id:randomUUID(),url:validUrl(b.url),note:String(b.note||'').slice(0,2000),topic:String(b.topic||'').slice(0,150),createdAt:new Date().toISOString()};await store.mutate(db=>{db.opportunities.push(item);});return json(res,201,item);}
    const opportunityEdit=p.match(/^\/api\/opportunities\/([\w-]+)$/);
    if(opportunityEdit&&req.method==='PUT'){const b=await body(req);const result=await store.mutate(db=>{const item=db.opportunities.find(x=>x.id===opportunityEdit[1]);if(!item)throw new Error('Kayıt bulunamadı.');Object.assign(item,{url:validUrl(b.url),topic:String(b.topic||'').slice(0,150),note:String(b.note||'').slice(0,2000),updatedAt:new Date().toISOString()});return item;});return json(res,200,result);}
    const opportunity=p.match(/^\/api\/opportunities\/([\w-]+)$/); if(opportunity&&req.method==='DELETE'){await store.mutate(db=>{db.opportunities=db.opportunities.filter(x=>x.id!==opportunity[1]);});return json(res,200,{ok:true});}
    if(p==='/api/private/status'&&req.method==='GET')return json(res,200,await privateCall('check'));
    if(p==='/api/private/discover'&&req.method==='POST')return json(res,200,await privateCall('discover',await body(req)));
    if(p==='/api/private/comment'&&req.method==='POST'){const b=await body(req);if(b.confirmed!==true)throw Error('Yorum için açık onay gerekli.');if(!String(b.message||'').trim()||String(b.message).length>2000)throw Error('Yorum 1–2000 karakter olmalı.');const opportunity=store.read().opportunities.find(o=>o.id===b.opportunityId);if(!opportunity)throw Error('Önce gönderiyi inceleme listesine kaydedin.');const attempt=await store.mutate(db=>{if(db.events.some(e=>e.kind==='private_comment'&&e.opportunityId===opportunity.id))throw Error('Bu gönderi için bir yorum denemesi var. Instagram sonucunu kontrol edin; tekrar gönderim kapalı.');const event={id:randomUUID(),kind:'private_comment',opportunityId:opportunity.id,status:'processing',startedAt:new Date().toISOString()};db.events.push(event);return event;});try{const result=await privateCall('comment',{url:opportunity.url,message:b.message});await store.mutate(db=>Object.assign(db.events.find(e=>e.id===attempt.id),{status:'accepted',commentId:result.id,finishedAt:new Date().toISOString()}));return json(res,200,result)}catch(e){await store.mutate(db=>Object.assign(db.events.find(e=>e.id===attempt.id),{status:'reconciliation_required',finishedAt:new Date().toISOString()}));throw e}}
    if(p==='/api/integrations/accounts'&&req.method==='POST')return json(res,200,await integrations.saveAccount(await body(req)));
    if(p==='/api/integrations/ai'&&req.method==='PUT')return json(res,200,await integrations.saveAI(await body(req)));
    if(p==='/api/connection/check'&&req.method==='POST'){const b=await body(req);if(!b.accountId)return json(res,409,{error:'Önce Instagram hesabını yapılandırın.'});const a=integrations.account(b.accountId);const info=await graph(`${a.userId}?fields=id,user_id,username`,{account:a});return json(res,200,{verified:true,profile:info,account:await integrations.verified(a.id,info)})}
    if(p==='/api/connection/publishing'&&req.method==='POST'){const b=await body(req);return json(res,200,await integrations.publishing(b.accountId,b.enabled))}
    if(p==='/api/ai/generate'&&req.method==='POST'){const b=await body(req);return json(res,200,await generateText(integrations.ai(),{...b,brand:store.read().brand}))}
    if(p==='/api/analytics'&&req.method==='GET'){const a=integrations.account(url.searchParams.get('accountId'));const [info,posts]=await Promise.all([profile(a),media(a)]);return json(res,200,{profile:info,media:posts.data||[],fetchedAt:new Date().toISOString(),partial:true})}
    if(p==='/api/insights'&&req.method==='GET'){const a=integrations.account(url.searchParams.get('accountId'));const mediaId=url.searchParams.get('mediaId');if(mediaId&&!/^\d+$/.test(mediaId))throw Error('Geçersiz medya kimliği.');const metrics=mediaId?['views','reach','total_interactions','saved','shares']:['views','reach','accounts_engaged','total_interactions'];const results=await Promise.allSettled(metrics.map(metric=>graph(`${mediaId||a.userId}/insights?metric=${metric}${mediaId?'':'&period=day&metric_type=total_value'}`,{account:a})));return json(res,200,{metrics:results.map((r,i)=>r.status==='fulfilled'?{name:metrics[i],data:r.value.data||[]}:{name:metrics[i],error:r.reason.message}),fetchedAt:new Date().toISOString()})}
    if(p==='/api/comments'&&req.method==='GET'){const a=integrations.account(url.searchParams.get('accountId'));const id=url.searchParams.get('mediaId');if(!/^\d+$/.test(id||''))throw Error('Geçerli medya kimliği gerekli.');return json(res,200,await graph(`${id}/comments?fields=id,text,timestamp,username&limit=50`,{account:a}))}
    if(p==='/api/comments/reply'&&req.method==='POST'){const b=await body(req);const a=integrations.account(b.accountId);if(!/^\d+$/.test(b.commentId||'')||!String(b.message||'').trim()||b.message.length>2000)throw Error('Yorum kimliği ve yanıt metni gerekli.');return json(res,200,await graph(`${b.commentId}/replies`,{account:a,method:'POST',body:{message:b.message}}))}
    if(p==='/api/export' && req.method==='GET') return json(res,200,store.read());
    if(p.startsWith('/api/')) return json(res,404,{error:'İşlem bulunamadı.'});
    if(req.method!=='GET') return json(res,405,{error:'Yöntem desteklenmiyor.'});
    const relative=p==='/'?'index.html':decodeURIComponent(p).replace(/^\/+/, '');
    const filename=path.resolve(root,'public',relative); const publicRoot=path.resolve(root,'public')+path.sep;
    if(!filename.startsWith(publicRoot)) return json(res,403,{error:'İzin yok.'});
    let content;try{content=await readFile(filename);}catch{return json(res,404,{error:'Dosya bulunamadı.'});}
    const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(content);
  } catch(e) { json(res,400,{error:e instanceof SyntaxError?'İstek okunamadı.':e.message}); }
});

const scheduler=createScheduler(store,integrations);
await scheduler.recover();
const timer=setInterval(()=>scheduler.runOnce().catch(()=>console.error('Zamanlayıcı durumu kaydedilemedi.')),15000);timer.unref();

if(!process.env.VERCEL) {
  server.listen(port,'127.0.0.1',()=>console.log(`Socialdesk: http://127.0.0.1:${port}`));
}

export default server;
