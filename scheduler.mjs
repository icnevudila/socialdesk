import {createContainer,containerStatus,publishContainer,graph} from './meta.mjs';
export function createScheduler(store,integrations,{create=createContainer,status=containerStatus,publish=publishContainer,lookup=(id,a)=>graph(`${id}?fields=id,permalink`,{account:a}),pause=ms=>new Promise(r=>setTimeout(r,ms)),polls=30,pollMs=2000}={}){
 let busy=false;
 async function recover(){await store.mutate(db=>{for(const p of db.posts)if(p.status==='processing'){p.status='reconciliation_required';p.error='Uygulama işlem sırasında kapandı. Instagram sonucunu kontrol edin; otomatik tekrar yapılmadı.'}})}
 async function runOnce(){if(busy)return;busy=true;let post,account;
 try{
 const candidate=store.read().posts.find(p=>p.status==='scheduled'&&Date.parse(p.scheduledAt)<=Date.now());if(!candidate)return;
 try{account=integrations.account(candidate.accountId);if(!account.verifiedAt||!account.publishing)return}catch{return}
 post=await store.mutate(db=>{const p=db.posts.find(p=>p.id===candidate.id);if(!p||p.status!=='scheduled'||Date.parse(p.scheduledAt)>Date.now())return null;p.status='processing';p.attemptStartedAt=new Date().toISOString();delete p.error;return structuredClone(p)});if(!post)return;
 const update=values=>store.mutate(db=>Object.assign(db.posts.find(p=>p.id===post.id),values));
 try{const container=await create(post,account);if(!container.id)throw Error('Medya container kimliği alınamadı.');await update({containerId:container.id});let ready=false;
 for(let i=0;i<polls;i++){const state=await status(container.id,account);if(state.status_code==='FINISHED'){ready=true;break}if(['ERROR','EXPIRED'].includes(state.status_code))throw Error('Instagram medyayı işleyemedi.');await pause(pollMs)}
 if(!ready)throw Error('Medya işleme sonucu doğrulanamadı.');
 // Persist intent before the irreversible provider request.
 await update({publishAttemptedAt:new Date().toISOString()});const result=await publish(container.id,account);if(!result.id)throw Error('Yayın sonucu belirsiz.');
 await update({status:'published',publishedId:result.id,publishedAt:new Date().toISOString()});
 try{const published=await lookup(result.id,account);if(published.permalink)await update({permalink:published.permalink})}catch{/* Publication ID is durable; permalink retrieval can be repeated safely. */}
 }catch(e){await update({status:'reconciliation_required',error:e.message})}
 }finally{busy=false}}
 return {recover,runOnce};
}
