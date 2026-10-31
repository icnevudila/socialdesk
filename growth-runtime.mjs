import {timingSafeEqual} from 'node:crypto';
import {profile} from './meta.mjs';
import {dayInZone} from './public/time.js';

export function bridgeAuthenticated(req,token=process.env.SOCIALDESK_BRIDGE_TOKEN){
  if(!token||token.length<32)return false;
  const received=Buffer.from(String(req.headers?.['x-socialdesk-bridge']||''));
  const expected=Buffer.from(token);
  return received.length===expected.length&&timingSafeEqual(received,expected);
}

export function buildGrowthStatus(db,{schedulerEnabled=false,heartbeat={},now=Date.now()}={}){
  const today=dayInZone(new Date(now));
  const accountId=db.engagement?.accountId||db.growth?.accountId||'';
  const events=(db.events||[]).filter(e=>!accountId||e.accountId===accountId);
  const accepted=events.filter(e=>['private_comment','private_like'].includes(e.kind)&&e.status==='accepted');
  const comments=accepted.filter(e=>e.kind==='private_comment'&&dayInZone(e.finishedAt||e.startedAt)===today).length;
  const snapshots=(db.snapshots||[]).filter(s=>s.accountId===accountId&&Number.isFinite(s.followersCount)).sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt));
  const latest=snapshots.at(-1);
  const baseline=snapshots.filter(s=>s.date<today).at(-1);
  const next=events.filter(e=>e.kind==='private_comment'&&['scheduled','waiting_connection'].includes(e.status)).sort((a,b)=>Date.parse(a.scheduledAt)-Date.parse(b.scheduledAt))[0];
  const live=schedulerEnabled&&!db.automation?.paused&&Number.isFinite(Date.parse(heartbeat.lastTickAt))&&now-Date.parse(heartbeat.lastTickAt)<90000;
  return {
    active:live,mode:'Tek işlem kuyruğu',accountId,engagementBlockedReason:db.engagement?.blockedReason||null,
    worker:{...heartbeat,enabled:schedulerEnabled,paused:db.automation?.paused===true},
    today:{likes:accepted.filter(e=>e.kind==='private_like'&&dayInZone(e.finishedAt||e.startedAt)===today).length,stories:0,comments},maxDaily:{likes:db.engagement?.autoLike?Math.min(20,db.engagement?.maxLikesPerDay||10):0,stories:0,comments:db.engagement?.maxCommentsPerDay||1},
    totalProcessed:new Set(accepted.map(e=>e.url)).size,
    serverTime:new Date(now).toLocaleTimeString('tr-TR',{timeZone:'Europe/Istanbul'}),
    nextCountdownSeconds:next?Math.max(0,Math.ceil((Date.parse(next.scheduledAt)-now)/1000)):null,
    nextEstimatedTime:next?new Date(next.scheduledAt).toLocaleTimeString('tr-TR',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit'}):null,
    followerStats:{current:latest?.followersCount??null,target:1000,progressPct:latest?Math.min(100,latest.followersCount/10):null,
      observedAt:latest?.observedAt||null,source:latest?.source||null,
      growthVelocity:latest&&baseline?`${latest.followersCount-baseline.followersCount} net takipçi (son kayıt farkı)`:'Karşılaştırma için ölçüm bekleniyor'},
    publishedCount:(db.posts||[]).filter(p=>(!accountId||p.accountId===accountId)&&p.status==='published'&&p.publishedId).length,
    pendingReview:events.filter(e=>e.status==='reconciliation_required').length,
    actions:accepted.slice(-25).reverse().map(e=>({type:e.kind==='private_like'?'like':'comment',label:e.kind==='private_like'?'Beğeni':'Yorum',url:e.url,text:e.message||'İlgili gönderi beğenildi.',commentId:e.commentId,time:new Date(e.finishedAt||e.startedAt).toLocaleTimeString('tr-TR',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit'}),note:'Instagram yorum kimliği alındı'})),
    recentLogs:events.filter(e=>e.error).slice(-10).reverse().map(e=>`${e.kind}: ${e.error}`)
  };
}

export function createSnapshotCollector(store,integrations,{readProfile=profile,now=()=>new Date()}={}){
  let busy=false,nextAt=0;
  return {async runOnce(){
    const current=now();if(busy||current.getTime()<nextAt)return;
    busy=true;nextAt=current.getTime()+60*60*1000;
    try{
      for(const account of integrations.public().accounts.filter(a=>a.verified)){
        const date=dayInZone(current);
        if((store.read().snapshots||[]).some(s=>s.accountId===account.id&&s.date===date))continue;
        try{
          const data=await readProfile(integrations.account(account.id));
          if(!Number.isInteger(data.followers_count)||data.followers_count<0)continue;
          await store.mutate(db=>{db.snapshots??=[];if(!db.snapshots.some(s=>s.accountId===account.id&&s.date===date))db.snapshots.push({accountId:account.id,date,observedAt:current.toISOString(),followersCount:data.followers_count,mediaCount:data.media_count??null,source:'meta-api'});});
        }catch(e){
          if(e.metaCode===190)await integrations.invalidate(account.id);
          await store.mutate(db=>{
            db.events??=[];
            const key=`snapshot-error:${account.id}:${date}`;
            if(!(db.events||[]).some(event=>event.key===key))db.events.push({key,kind:'analytics_snapshot',accountId:account.id,status:'failed',error:'Meta hesap ölçümü alınamadı. Bağlantıyı ve izinleri kontrol edin.',finishedAt:current.toISOString()});
          });
        }
      }
    }finally{busy=false}
  }};
}
