import {createContainer,containerStatus,publishContainer,graph} from './meta.mjs';
export function createScheduler(store,integrations,{create=createContainer,status=containerStatus,publish=publishContainer,lookup=(id,a)=>graph(`${id}?fields=id,permalink`,{account:a}),pause=ms=>new Promise(r=>setTimeout(r,ms)),polls=30,pollMs=2000,enabled=true,minSpacingMs=0,maxLateMs=0,now=()=>Date.now()}={}){
 let busy=false;
 async function recover(){await store.mutate(db=>{for(const p of db.posts)if(p.status==='processing'){p.status='reconciliation_required';p.error='Uygulama işlem sırasında kapandı. Instagram sonucunu kontrol edin; otomatik tekrar yapılmadı.'}for(const e of db.events||[])if(e.status==='processing'){e.status='reconciliation_required';e.error='İşlem sırasında süreç kapandı; sonuç kontrol edilmeli.'}})}
 async function runOnce(){if(busy||!enabled)return;busy=true;
 try{
 const currentTime=now();
 const due=store.read().posts.filter(p=>p.status==='scheduled'&&Date.parse(p.scheduledAt)<=currentTime).sort((a,b)=>Date.parse(a.scheduledAt)-Date.parse(b.scheduledAt));
 let candidate,account;
 for(const p of due){
  try{
   const a=integrations.account(p.accountId);
   if(a.verifiedAt&&a.publishing){
    if(minSpacingMs>0){
     const lastPublished=store.read().posts.filter(x=>x.accountId===a.id&&x.status==='published').reduce((max,x)=>Math.max(max,Date.parse(x.publishedAt||x.publishAttemptedAt||'')||0),0);
     if(lastPublished&&(currentTime-lastPublished)<minSpacingMs)continue;
    }
    if(maxLateMs>0&&(currentTime-Date.parse(p.scheduledAt))>maxLateMs){
     await store.mutate(db=>{
      const target=db.posts.find(x=>x.id===p.id);
      if(target&&target.status==='scheduled'){
       target.status='late_rescheduled';
       target.error='Planlanan zamanın üzerinden tolerans süresi geçtiği için ani yayını engellemek üzere ertelendi.';
       target.scheduledAt=new Date(currentTime+1800000).toISOString();
      }
     });
     continue;
    }
    candidate=p;account=a;break;
   }
  }catch{/* A missing account must not block other accounts. */}
 }
 if(!candidate)return;
 const post=await store.mutate(db=>{const p=db.posts.find(p=>p.id===candidate.id);if(!p||p.status!=='scheduled'||p.accountId!==account.id||Date.parse(p.scheduledAt)>currentTime)return null;const current=integrations.account(p.accountId);if(!current.verifiedAt||!current.publishing||current.token!==account.token)return null;p.status='processing';p.attemptStartedAt=new Date(currentTime).toISOString();delete p.error;return structuredClone(p)});if(!post)return;
 const update=values=>store.mutate(db=>{const p=db.posts.find(p=>p.id===post.id);if(!p)throw Error('Yayın kaydı kayboldu.');Object.assign(p,values)});
 try{const container=await create(post,account);if(!container.id)throw Error('Medya container kimliği alınamadı.');await update({containerId:container.id});let ready=false;
 for(let i=0;i<polls;i++){const state=await status(container.id,account);if(state.status_code==='FINISHED'){ready=true;break}if(['ERROR','EXPIRED'].includes(state.status_code))throw Error('Instagram medyayı işleyemedi.');await pause(pollMs)}
 if(!ready)throw Error('Medya işleme sonucu doğrulanamadı.');
 await update({publishAttemptedAt:new Date(now()).toISOString()});const result=await publish(container.id,account);if(!result.id)throw Error('Yayın sonucu belirsiz.');
 await update({status:'published',publishedId:result.id,publishedAt:new Date(now()).toISOString()});
 try{const published=await lookup(result.id,account);if(published.permalink)await update({permalink:published.permalink})}catch{}
 }catch(e){if(e.metaCode===190&&integrations.invalidate)await integrations.invalidate(account.id);await update({status:'reconciliation_required',error:e.message})}
 }finally{busy=false}}
 return {recover,runOnce};
}
