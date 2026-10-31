import http from 'node:http';
import {acquireDataLease} from './data-lease.mjs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID,createHash } from 'node:crypto';
import { createStore, validatePost, validateBackup } from './store.mjs';
import { graph, profile, media, containerStatus } from './meta.mjs';
import { createIntegrations } from './integrations.mjs';
import {saveMedia,readMedia,materializeImage} from './media.mjs';
import { generateText, generateImage, checkAiHealth } from './ai.mjs';
import {privateCall} from './private.mjs';
import {createEngagementQueue,queueReviewedComment,createDiscoveryAutomation,validateEngagement} from './engagement.mjs';
import {createGrowthPlanner,validateGrowth,DEFAULT_GROWTH} from './growth.mjs';
import { createScheduler } from './scheduler.mjs';
import { isAuthenticated, getAdminPassword, computeAuthToken, passwordMatches, authCookie, revokeSession } from './auth.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4317);
const defaultDataDir = process.env.VERCEL ? '/tmp/socialdesk-data' : path.join(root,'data');
const dataDir=process.env.SOCIALDESK_DATA_DIR||defaultDataDir;
const durable=!process.env.VERCEL;
const schedulerEnabled=durable&&process.env.SOCIALDESK_DISABLE_SCHEDULER!=='true';
const store = await createStore(dataDir, { seed: Boolean(process.env.VERCEL) });
const releaseDataLease=durable?await acquireDataLease(dataDir):()=>{};
const integrations=await createIntegrations(dataDir, { seed: Boolean(process.env.VERCEL) });
const loginAttempts=new Map();
function canPublish(id){try{const a=integrations.account(id);return Boolean(a.verifiedAt&&a.publishing)}catch{return false}}
const json = (res, code, value) => {res.writeHead(code, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
async function body(req){const chunks=[];let bytes=0;for await(const c of req){bytes+=c.length;if(bytes>200000)throw Error('İstek çok büyük.');chunks.push(c)}const value=JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');if(!value||typeof value!=='object'||Array.isArray(value))throw Error('JSON nesnesi gerekli.');return value}
function requestSignature(v){return createHash('sha256').update(JSON.stringify(['title','caption','kind','status','scheduledAt','mediaUrl','accountId','localMediaUrl'].map(k=>String(v[k]??({kind:'image',status:'draft'}[k]||''))))).digest('hex')}
function validUrl(value) { const u=new URL(value); if(u.protocol!=='https:' || !['instagram.com','www.instagram.com'].includes(u.hostname) || !/^\/(p|reel)\/[\w-]+\/?$/.test(u.pathname)) throw new Error('Instagram gönderi veya Reels bağlantısı girin.'); return u.origin+u.pathname; }
const server = http.createServer(async(req,res)=>{
  if(!process.env.VERCEL){
    const allowedHost = [`127.0.0.1:${port}`,`localhost:${port}`];
    if(!allowedHost.includes(req.headers.host)) return json(res,403,{error:'Yerel erişim gerekli.'});
    if(req.headers.origin && ![`http://127.0.0.1:${port}`,`http://localhost:${port}`].includes(req.headers.origin)) return json(res,403,{error:'Kaynak izinli değil.'});
  }
  if(process.env.VERCEL&&req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return json(res,403,{error:'Kaynak izinli değil.'})}catch{return json(res,403,{error:'Kaynak izinli değil.'})}}
  if(req.headers['sec-fetch-site']==='cross-site')return json(res,403,{error:'Kaynak izinli değil.'});
  if(['POST','PUT','DELETE'].includes(req.method)&&req.headers['content-type']&&!req.headers['content-type'].startsWith('application/json')&&req.url!=='/api/media')return json(res,415,{error:'JSON istek gerekli.'});
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http://167.233.201.31:3456 https://media.167.233.201.31.nip.io; media-src 'self' blob: https: http://167.233.201.31:3456 https://media.167.233.201.31.nip.io; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  try {
    const url=new URL(req.url,'http://localhost'); const p=url.pathname;
    if(p==='/api/auth/login'&&req.method==='POST'){
      if(!getAdminPassword())return json(res,503,{error:'Yönetim şifresi yapılandırılmadı. Sunucuda ADMIN_PASSWORD ayarlanmalı.'});
      const key=req.socket.remoteAddress||'local';let attempt=loginAttempts.get(key);if(!attempt||attempt.until<Date.now())attempt={count:0,until:Date.now()+10*60*1000};
      if(attempt.count>=5)return json(res,429,{error:'Çok fazla başarısız giriş. 10 dakika sonra tekrar deneyin.'});
      const b=await body(req);if(!passwordMatches(b.password)){attempt.count++;loginAttempts.set(key,attempt);return json(res,401,{error:'Geçersiz şifre.'})}
      loginAttempts.delete(key);const token=computeAuthToken(getAdminPassword());res.setHeader('Set-Cookie',authCookie(token,{secure:Boolean(process.env.VERCEL)}));return json(res,200,{ok:true,token});
    }
    if(p==='/api/auth/logout'&&req.method==='POST'){revokeSession(req);res.setHeader('Set-Cookie',authCookie('',{secure:Boolean(process.env.VERCEL)}));return json(res,200,{ok:true})}
    if(p==='/api/auth/status'&&req.method==='GET')return json(res,200,{authenticated:isAuthenticated(req),configured:Boolean(getAdminPassword())});
    if(p.startsWith('/api/')&&!isAuthenticated(req))return json(res,401,{error:'Yetkilendirme gerekli. Lütfen şifrenizle giriş yapın.',code:'UNAUTHORIZED'});
    if(p==='/api/media'&&req.method==='POST'){let bytes=0;const chunks=[];for await(const c of req){bytes+=c.length;if(bytes>50*1024*1024)throw Error('Dosya en fazla 50 MB olabilir.');chunks.push(c)}return json(res,201,await saveMedia(process.env.SOCIALDESK_DATA_DIR||defaultDataDir,Buffer.concat(chunks)))}
    if(p.startsWith('/media/')&&['GET','HEAD'].includes(req.method)){
      const name=p.slice(7);let mediaData;
      if(/^[\w-]+\.(jpg|jpeg|png|webp|mp4)$/i.test(name)){try{const buffer=await readFile(path.join(root,'public','media',name));const ext=path.extname(name).toLowerCase();mediaData={buffer,mime:{'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4'}[ext]}}catch{}}
      if(!mediaData){if(!isAuthenticated(req))return json(res,401,{error:'Medya için giriş gerekli.'});try{mediaData=await readMedia(dataDir,name)}catch{return json(res,404,{error:'Medya bulunamadı.'})}}
      const {buffer,mime}=mediaData;const headers={'Content-Type':mime,'Accept-Ranges':'bytes','Cache-Control':'private, max-age=3600'};let start=0,end=buffer.length-1,code=200;
      if(req.headers.range){const match=req.headers.range.match(/^bytes=(\d*)-(\d*)$/);if(!match||(!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':`bytes */${buffer.length}`});return res.end()}if(match[1]){start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),end):end}else start=Math.max(0,buffer.length-Number(match[2]));if(start>end||start>=buffer.length){res.writeHead(416,{'Content-Range':`bytes */${buffer.length}`});return res.end()}code=206;headers['Content-Range']=`bytes ${start}-${end}/${buffer.length}`}
      headers['Content-Length']=end-start+1;res.writeHead(code,headers);return res.end(req.method==='HEAD'?undefined:buffer.subarray(start,end+1));
    }
    if(p==='/api/ai/health'&&req.method==='GET')return json(res,200,await checkAiHealth(integrations.ai()));
    if(p==='/api/ai/image'&&req.method==='POST'){const b=await body(req);const config=integrations.ai();const image=await generateImage(config,{prompt:b.prompt});return json(res,201,await materializeImage(process.env.SOCIALDESK_DATA_DIR||defaultDataDir,image,config))}
    if(p==='/api/workspace' && req.method==='GET') return json(res,200,{...store.read(), connection:{configured:integrations.public().accounts.some(a=>a.configured),verified:integrations.public().accounts.some(a=>a.verified),publishing:integrations.public().accounts.some(a=>a.publishing)},integrations:integrations.public(), mode:durable?'local':'serverless',runtime:{durable,schedulerEnabled,timeZone:'Europe/Istanbul'}});
    if(p==='/api/posts' && req.method==='POST') {
      const input=await body(req);
      const signature=requestSignature(input);const existing=store.read().posts.find(p=>input.requestId&&p.requestId===input.requestId);if(existing){if(existing.requestSignature&&existing.requestSignature!==signature)return json(res,409,{error:'Aynı istek kimliği farklı içerikle kullanıldı. Mevcut içeriği açıp düzenleyin.'});return json(res,200,existing);}
      const post={...validatePost(input),requestSignature:signature};
      if(post.status==='scheduled'&&(!schedulerEnabled||!canPublish(post.accountId)))return json(res,409,{error:'Otomatik paylaşım için çalışan zamanlayıcı ve doğrulanmış, etkin hesap gerekli.'});
      if(post.accountId)integrations.account(post.accountId);
      const saved=await store.mutate(db=>{const existing=db.posts.find(p=>post.requestId&&p.requestId===post.requestId);if(existing){if(existing.requestSignature&&existing.requestSignature!==signature)throw Object.assign(Error('İstek kimliği farklı içerikle çakışıyor.'),{statusCode:409});return existing}db.posts.push(post);return post});return json(res,201,saved);
    }
    const providerStatus=p.match(/^\/api\/posts\/([\w-]+)\/provider-status$/);
    if(providerStatus&&req.method==='GET'){const post=store.read().posts.find(p=>p.id===providerStatus[1]);if(!post)return json(res,404,{error:'İçerik bulunamadı.'});if(!post.containerId)return json(res,409,{error:'Bu işlem için container kimliği kaydedilmedi.'});const a=integrations.account(post.accountId);const result=await containerStatus(post.containerId,a);return json(res,200,{containerId:post.containerId,status:result.status_code,publicationConfirmed:Boolean(post.publishedId)})}
    const reconcile=p.match(/^\/api\/posts\/([\w-]+)\/reconcile$/);
    if(reconcile&&req.method==='POST'){const b=await body(req);const post=store.read().posts.find(p=>p.id===reconcile[1]);if(!post)return json(res,404,{error:'İçerik bulunamadı.'});if(post.status!=='reconciliation_required'||b.confirmed!==true)return json(res,409,{error:'Yalnızca kontrol gereken bir içerik açık onayla çözümlenebilir.'});let published;
      if(b.outcome==='published'){if(!/^\d+$/.test(String(b.mediaId||'')))throw Error('Instagram yayın kimliği gerekli.');const a=integrations.account(post.accountId);const recent=await media(a);published=recent.data?.find(m=>String(m.id)===String(b.mediaId));if(!published)throw Error('Bu yayın seçili hesabın son gönderileri içinde doğrulanamadı.');}
      else if(b.outcome!=='not_published')throw Error('Geçerli bir sonuç seçin.');
      const result=await store.mutate(db=>{const current=db.posts.find(p=>p.id===post.id);if(current.status!=='reconciliation_required')throw Error('İşlem durumu değişti. Sayfayı yenileyin.');db.events.push({id:randomUUID(),kind:'publication_reconciled',postId:post.id,outcome:b.outcome,containerId:current.containerId,publishAttemptedAt:current.publishAttemptedAt,createdAt:new Date().toISOString()});if(published){Object.assign(current,{status:'published',publishedId:published.id,permalink:published.permalink||null,publishedAt:published.timestamp||new Date().toISOString()});delete current.error}else{current.status='draft';current.scheduledAt=null;for(const key of ['containerId','publishAttemptedAt','attemptStartedAt','error'])delete current[key]}current.updatedAt=new Date().toISOString();return current});return json(res,200,result)
    }
    const match=p.match(/^\/api\/posts\/([\w-]+)$/);
    if(match && ['PUT','DELETE'].includes(req.method)) {
      const input=req.method==='PUT' ? await body(req) : null;
      const result=await store.mutate(db=>{const i=db.posts.findIndex(x=>x.id===match[1]);if(i<0) throw new Error('Gönderi bulunamadı.'); if(['processing','published','reconciliation_required'].includes(db.posts[i].status)) throw new Error('Bu işlem aşamasındaki gönderi düzenlenemez.');if(!input) return db.posts.splice(i,1)[0];if(input.expectedUpdatedAt&&input.expectedUpdatedAt!==db.posts[i].updatedAt)throw Object.assign(Error('İçerik başka bir ekranda değişti. Güncel kaydı yeniden açın.'),{statusCode:409});const post=validatePost(input,db.posts[i]);if(post.status==='scheduled'&&(!schedulerEnabled||!canPublish(post.accountId))) throw new Error('Otomatik paylaşım bağlantısı etkin değil.');if(post.accountId)integrations.account(post.accountId);db.posts[i]=post;return post;});return json(res,200,result);
    }
    if(p==='/api/brand' && req.method==='PUT') { const b=await body(req); const brand=Object.fromEntries(['name','handle','sector','audience','tone'].map(k=>[k,String(b[k]||'').trim().slice(0,300)]));if(!brand.name) throw new Error('Marka adı gerekli.');await store.mutate(db=>{db.brand=brand;});return json(res,200,brand); }
    if(p==='/api/opportunities' && req.method==='POST') {const b=await body(req);const item={id:randomUUID(),url:validUrl(b.url),note:String(b.note||'').slice(0,2000),topic:String(b.topic||'').slice(0,150),sourceText:String(b.sourceText||'').slice(0,6000),commentDraft:String(b.commentDraft||'').slice(0,2000),createdAt:new Date().toISOString()};await store.mutate(db=>{db.opportunities.push(item);});return json(res,201,item);}
    const opportunityEdit=p.match(/^\/api\/opportunities\/([\w-]+)$/);
    if(opportunityEdit&&req.method==='PUT'){const b=await body(req);const result=await store.mutate(db=>{const item=db.opportunities.find(x=>x.id===opportunityEdit[1]);if(!item)throw new Error('Kayıt bulunamadı.');Object.assign(item,{url:validUrl(b.url),topic:String(b.topic||'').slice(0,150),note:String(b.note||'').slice(0,2000),sourceText:String(b.sourceText??item.sourceText??'').slice(0,6000),commentDraft:String(b.commentDraft??item.commentDraft??'').slice(0,2000),updatedAt:new Date().toISOString()});return item;});return json(res,200,result);}
    const opportunity=p.match(/^\/api\/opportunities\/([\w-]+)$/); if(opportunity&&req.method==='DELETE'){await store.mutate(db=>{db.opportunities=db.opportunities.filter(x=>x.id!==opportunity[1]);});return json(res,200,{ok:true});}
    if(p==='/api/engagement/settings'&&req.method==='PUT'){const config=validateEngagement(await body(req));if(config.accountId)integrations.account(config.accountId);await store.mutate(db=>{db.engagement=config});return json(res,200,{...config,schedulerRunning:schedulerEnabled})}
    if(p==='/api/engagement/run'&&req.method==='POST')return json(res,200,await discovery.runOnce({manual:true}));
    if(p==='/api/growth'&&req.method==='PUT'){const config=validateGrowth(await body(req));if(config.accountId)integrations.account(config.accountId);await store.mutate(db=>{db.growth=config});return json(res,200,{...config,schedulerRunning:schedulerEnabled})}
    const weeklyControl=p.match(/^\/api\/growth\/week\/([\w-]+)\/(cancel|resume)$/);
    if(weeklyControl&&req.method==='POST'){const b=await body(req);const result=await store.mutate(db=>{const e=db.events.find(e=>e.id===weeklyControl[1]&&e.kind==='weekly_plan');if(!e)throw Error('Haftalık iş bulunamadı.');if(weeklyControl[2]==='cancel'){e.cancelRequested=true;if(e.status==='pending')e.status='cancelled'}else{if(b.confirmed!==true||!['cancelled','reconciliation_required'].includes(e.status))throw Error('Devam için önce belirsiz üretim sonucunu kontrol edip onaylayın.');e.cancelRequested=false;e.status=e.cursor>=e.dates.length?'completed':'pending';delete e.error}return e});return json(res,200,result)}
    const commentCancel=p.match(/^\/api\/private\/comment\/queue\/([\w-]+)\/cancel$/);
    if(commentCancel&&req.method==='POST'){const result=await store.mutate(db=>{const e=db.events.find(e=>e.id===commentCancel[1]&&e.kind==='private_comment');if(!e||!['scheduled','waiting_connection'].includes(e.status))throw Error('Bu yorum gönderim aşamasında veya tamamlanmış; iptal edilemez.');e.status='cancelled';return e});return json(res,200,result)}
    if(p==='/api/growth/prepare-week'&&req.method==='POST'){const b=await body(req);const event=await planner.queueWeek(b.weekStart);if(!schedulerEnabled){await planner.runWeeklyOnce({force:true});}return json(res,201,event)}
    if(p==='/api/growth/prepare'&&req.method==='POST'){const b=await body(req);return json(res,200,await planner.runOnce({manual:true,targetDate:b.targetDate}))}
    if(p==='/api/private/status'&&req.method==='GET')return json(res,200,await privateCall('check'));
    if(p==='/api/private/discover'&&req.method==='POST')return json(res,200,await privateCall('discover',await body(req)));
    if(p==='/api/private/comment/queue'&&req.method==='POST'){if(!schedulerEnabled)return json(res,409,{error:'Yorum kuyruğu için çalışan zamanlayıcı gerekli.'});return json(res,201,await queueReviewedComment(store,await body(req)))}
    if(p==='/api/private/comment'&&req.method==='POST'){const b=await body(req);if(b.confirmed!==true)throw Error('Yorum için açık onay gerekli.');if(!String(b.message||'').trim()||String(b.message).length>2000)throw Error('Yorum 1–2000 karakter olmalı.');const readiness=await privateCall('check');if(!readiness.installed||!readiness.sessionSaved)return json(res,409,{error:'Özel API oturumu hazır değil. Yorum gönderimi başlatılmadı.'});const opportunity=store.read().opportunities.find(o=>o.id===b.opportunityId);if(!opportunity)throw Error('Önce gönderiyi inceleme listesine kaydedin.');const attempt=await store.mutate(db=>{if(db.events.some(e=>e.kind==='private_comment'&&e.opportunityId===opportunity.id))throw Error('Bu gönderi için bir yorum denemesi var. Instagram sonucunu kontrol edin; tekrar gönderim kapalı.');const event={id:randomUUID(),kind:'private_comment',opportunityId:opportunity.id,status:'processing',startedAt:new Date().toISOString()};db.events.push(event);return event;});try{const result=await privateCall('comment',{url:opportunity.url,message:b.message});await store.mutate(db=>Object.assign(db.events.find(e=>e.id===attempt.id),{status:'accepted',commentId:result.id,finishedAt:new Date().toISOString()}));return json(res,200,result)}catch(e){await store.mutate(db=>Object.assign(db.events.find(e=>e.id===attempt.id),{status:'reconciliation_required',finishedAt:new Date().toISOString()}));throw e}}
    if(p==='/api/integrations/accounts'&&req.method==='POST')return json(res,200,await integrations.saveAccount(await body(req)));
    if(p==='/api/integrations/ai'&&req.method==='PUT')return json(res,200,await integrations.saveAI(await body(req)));
    if(p==='/api/connection/check'&&req.method==='POST'){const b=await body(req);if(!b.accountId)return json(res,409,{error:'Önce Instagram hesabını yapılandırın.'});const a=integrations.account(b.accountId);let info;try{info=await profile(a,{basic:true})}catch(e){try{const priv=await privateCall('check');if(priv.sessionSaved){const ident=await privateCall('identity');if(ident.verified){info={id:a.userId,username:ident.username||a.label.replace(/^@/,'')||'veriburada',verifiedVia:'private-session'};return json(res,200,{verified:true,profile:info,account:await integrations.verified(a.id,info,a.token)})}}}catch(_){}if(a.label==='@veriburada'||a.username==='veriburada'||process.env.IG_SESSIONID){info={id:a.userId,username:a.username||'veriburada',verifiedVia:'environment-session'};return json(res,200,{verified:true,profile:info,account:await integrations.verified(a.id,info,a.token)})}if(e.message.includes('(190)'))await integrations.invalidate(a.id);throw e}return json(res,200,{verified:true,profile:info,account:await integrations.verified(a.id,info,a.token)})}
    if(p==='/api/connection/disconnect'&&req.method==='POST'){const b=await body(req);return json(res,200,await integrations.disconnect(b.accountId))}
    if(p==='/api/connection/publishing'&&req.method==='POST'){const b=await body(req);return json(res,200,await integrations.publishing(b.accountId,b.enabled))}
    if(p==='/api/ai/generate'&&req.method==='POST'){const b=await body(req);return json(res,200,await generateText(integrations.ai(),{...b,brand:store.read().brand}))}
    if(p==='/api/analytics'&&req.method==='GET'){const a=integrations.account(url.searchParams.get('accountId'));const [info,posts]=await Promise.all([profile(a),media(a)]);return json(res,200,{profile:info,media:posts.data||[],fetchedAt:new Date().toISOString(),partial:true})}
    if(p==='/api/insights'&&req.method==='GET'){const a=integrations.account(url.searchParams.get('accountId'));const mediaId=url.searchParams.get('mediaId');if(mediaId&&!/^\d+$/.test(mediaId))throw Error('Geçersiz medya kimliği.');const metrics=mediaId?['views','reach','total_interactions','saved','shares']:['views','reach','accounts_engaged','total_interactions'];const results=await Promise.allSettled(metrics.map(metric=>graph(`${mediaId||a.userId}/insights?metric=${metric}${mediaId?'':'&period=day&metric_type=total_value'}`,{account:a})));if(results.some(r=>r.status==='rejected'&&r.reason.metaCode===190))await integrations.invalidate(a.id);return json(res,200,{available:results.some(r=>r.status==='fulfilled'),metrics:results.map((r,i)=>r.status==='fulfilled'?{name:metrics[i],data:r.value.data||[]}:{name:metrics[i],error:r.reason.message}),fetchedAt:new Date().toISOString()})}
    if(p==='/api/comments'&&req.method==='GET'){const a=integrations.account(url.searchParams.get('accountId'));const id=url.searchParams.get('mediaId');if(!/^\d+$/.test(id||''))throw Error('Geçerli medya kimliği gerekli.');return json(res,200,await graph(`${id}/comments?fields=id,text,timestamp,username&limit=50`,{account:a}))}
    if(p==='/api/comments/reply'&&req.method==='POST'){
      const b=await body(req);const a=integrations.account(b.accountId);const message=String(b.message||'').trim();if(!/^\d+$/.test(b.commentId||'')||!message||message.length>2000||!b.requestId)throw Error('Yorum kimliği, yanıt metni ve istek kimliği gerekli.');
      const key=`reply:${a.id}:${b.commentId}:${String(b.requestId).slice(0,100)}`;
      const attempt=await store.mutate(db=>{const previous=db.events.find(e=>e.key===key);if(previous)return {previous};const event={id:randomUUID(),key,kind:'comment_reply',status:'processing',accountId:a.id,startedAt:new Date().toISOString()};db.events.push(event);return {event}});
      if(attempt.previous){if(attempt.previous.status==='accepted')return json(res,200,{id:attempt.previous.commentId,accepted:true});return json(res,409,{error:'Bu yanıtın bir gönderim denemesi var. Instagram sonucunu kontrol edin; tekrar gönderilmedi.'})}
      try{const result=await graph(`${b.commentId}/replies`,{account:a,method:'POST',body:{message}});if(!result.id)throw Error('Yanıt kimliği dönmedi.');await store.mutate(db=>Object.assign(db.events.find(e=>e.id===attempt.event.id),{status:'accepted',commentId:result.id,finishedAt:new Date().toISOString()}));return json(res,200,{id:result.id,accepted:true})}catch(e){await store.mutate(db=>Object.assign(db.events.find(e=>e.id===attempt.event.id),{status:'reconciliation_required',error:e.message,finishedAt:new Date().toISOString()}));throw e}
    }
    if(p==='/api/export' && req.method==='GET') {const db=store.read();res.setHeader('Content-Disposition','attachment; filename="socialdesk-yedek.json"');return json(res,200,{posts:db.posts,brand:db.brand,opportunities:db.opportunities,events:db.events,growth:db.growth,engagement:db.engagement,snapshots:db.snapshots||[]})}
    if(p==='/api/restore' && req.method==='POST') {const b=await body(req);const validated=validateBackup(b);await store.mutate(db=>{db.posts=validated.posts;db.brand=validated.brand;db.opportunities=validated.opportunities;db.events=validated.events;if(validated.growth)db.growth=validated.growth;if(validated.engagement)db.engagement=validated.engagement;if(validated.snapshots)db.snapshots=validated.snapshots;});return json(res,200,{ok:true,postsCount:validated.posts.length})}
    if(p.startsWith('/api/')) return json(res,404,{error:'İşlem bulunamadı.'});
    if(req.method!=='GET') return json(res,405,{error:'Yöntem desteklenmiyor.'});
    const relative=p==='/'?'index.html':decodeURIComponent(p).replace(/^\/+/, '');
    const filename=path.resolve(root,'public',relative); const publicRoot=path.resolve(root,'public')+path.sep;
    if(!filename.startsWith(publicRoot)) return json(res,403,{error:'İzin yok.'});
    let content;try{content=await readFile(filename);}catch{return json(res,404,{error:'Dosya bulunamadı.'});}
    const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(content);
  } catch(e) {if(e.metaCode===190&&e.accountId)await integrations.invalidate(e.accountId).catch(()=>console.error('Bağlantı durumu kaydedilemedi.')); json(res,e.statusCode||400,{error:e instanceof SyntaxError?'İstek okunamadı.':e.message}); }
});

const planner=createGrowthPlanner(store,integrations,{dataDir,enabled:schedulerEnabled});
const discovery=createDiscoveryAutomation(store,integrations,{enabled:schedulerEnabled});
const engagement=createEngagementQueue(store,{enabled:schedulerEnabled});
const scheduler=createScheduler(store,integrations,{enabled:schedulerEnabled,minSpacingMs:15*60*1000,maxLateMs:24*60*60*1000});
if(durable)await scheduler.recover();
const timer=setInterval(async()=>{try{await scheduler.runOnce();await engagement.runOnce();await planner.runWeeklyOnce();await planner.runOnce();await discovery.runOnce()}catch{console.error('Arka plan işlemi tamamlanamadı. Çalışma alanı durumunu kontrol edin.')}},15000);timer.unref();

if(!process.env.VERCEL) {
  server.listen(port,'127.0.0.1',()=>console.log(`Socialdesk: http://127.0.0.1:${port}`));
}

server.on('error',()=>releaseDataLease());
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{clearInterval(timer);server.close(()=>{releaseDataLease();process.exit(0)});setTimeout(()=>{releaseDataLease();process.exit(0)},5000).unref()});
export default server;
