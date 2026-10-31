import {randomUUID} from 'node:crypto';
import {generateText,generateImage} from './ai.mjs';
import {materializeImage} from './media.mjs';
import {validatePost} from './store.mjs';
import {dayInZone,localInput,zonedInputToISO,addDays} from './public/time.js';

export const DEFAULT_GROWTH={
  enabled:false,
  accountId:'',
  topics:[],
  weekdays:[1,3,5],
  publishAt:'13:00',
  prepareAt:'09:00',
  autoImages:false,
  autoQueue:false,
  mediaSources:[]
};

export function validateGrowth(input){
  const config={...DEFAULT_GROWTH,...input};
  config.enabled=input.enabled===true;
  config.autoImages=input.autoImages===true;
  config.autoQueue=input.autoQueue===true;
  config.topics=(Array.isArray(input.topics)?input.topics:[]).map(t=>String(t).trim()).filter(Boolean).slice(0,30);
  config.mediaSources=(Array.isArray(input.mediaSources)?input.mediaSources:[]).map(t=>String(t).trim()).filter(Boolean).slice(0,60);
  if(config.topics.some(t=>t.length>150))throw Error('Her konu en fazla 150 karakter olmalı.');
  config.weekdays=[...new Set(input.weekdays||DEFAULT_GROWTH.weekdays)];
  if(!config.weekdays.length||config.weekdays.some(d=>!Number.isInteger(d)||d<0||d>6))throw Error('En az bir geçerli yayın günü seçin.');
  
  if(Array.isArray(input.slots)&&input.slots.length){
    if(input.slots.length>3||input.slots.some(slot=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(slot).trim())))throw Error('Bir gün için 1–3 geçerli yayın saati seçin.');
    config.slots=[...new Set(input.slots.map(slot=>String(slot).trim()))].sort();
    const minutes=config.slots.map(slot=>Number(slot.slice(0,2))*60+Number(slot.slice(3)));
    if(minutes.some((minute,index)=>index&&minute-minutes[index-1]<180))throw Error('Yayın saatleri arasında en az 3 saat bırakın.');
    config.publishAt=config.slots[0];
  }else if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(config.publishAt))throw Error('Saatleri SS:DD biçiminde seçin.');

  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(config.prepareAt))throw Error('Saatleri SS:DD biçiminde seçin.');
  for(const source of config.mediaSources){
    let u;
    try{u=new URL(source)}catch{throw Error('Medya adresleri HTTPS olmalı.')}
    if(u.protocol!=='https:'||u.username||u.password)throw Error('Medya adresleri HTTPS olmalı.')
  }
  if(config.enabled&&(!config.accountId||!config.topics.length))throw Error('Otomatik plan için hesap ve en az bir içerik konusu gerekli.');
  if(config.autoQueue&&!config.autoImages&&!config.mediaSources.length)throw Error('Otomatik kuyruk için onaylı medya URL’leri veya görsel üretimi gerekli.');
  return config;
}

export function createGrowthPlanner(store,integrations,{dataDir,enabled=true,text=generateText,image=generateImage,materialize=materializeImage,now=()=>new Date()}={}){
  let busy=false;
  async function runOnce({manual=false,targetDate,configOverride,slotOverride}={}){
    if(busy)return {skipped:'busy'};
    if(!enabled&&!manual)throw Error('Bu ortamda sürekli çalışan büyüme planlayıcısı yok.');
    const config={...DEFAULT_GROWTH,...(configOverride||store.read().growth)};
    const current=now();
    const today=dayInZone(current);
    const day=targetDate||addDays(today,1);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw Error('Geçerli hedef gün seçin.');
    if(!manual&&(!config.enabled||localInput(current).slice(11)<config.prepareAt))return {skipped:'not_due'};
    if(!config.topics.length||!config.accountId)throw Error('Önce büyüme planı için hesap ve konu seçin.');
    const account=integrations.account(config.accountId);
    if(!manual&&!config.weekdays.includes(new Date(day+'T12:00:00Z').getUTCDay()))return {skipped:'off_day'};
    
    // If slots specified and length > 1, process multi-slot
    const isMultiSlot = Array.isArray(config.slots) && config.slots.length > 1 && !slotOverride;
    const slots = slotOverride ? [slotOverride] : (isMultiSlot ? config.slots : [config.publishAt || '13:00']);

    if (!isMultiSlot) {
      // Standard single-slot behavior (preserves exact test contract)
      const scheduledAt=zonedInputToISO(day+'T'+slots[0]);
      if(Date.parse(scheduledAt)<=current.getTime())throw Error('Hazırlanacak paylaşım zamanı gelecekte olmalı.');
      busy=true;
      const key=`growth:${account.id}:${day}`;
      let run,post;
      try{
        const claim=await store.mutate(db=>{
          if(db.events.some(e=>e.key===key))return {skipped:'already_attempted'};
          if(db.posts.some(p=>p.accountId===account.id&&p.scheduledAt&&dayInZone(p.scheduledAt)===day&&p.status!=='failed'))return {skipped:'slot_occupied'};
          const event={id:randomUUID(),key,kind:'growth',accountId:account.id,targetDate:day,status:'processing',startedAt:current.toISOString()};
          db.events.push(event);
          return {event:structuredClone(event)};
        });
        if(claim.skipped)return claim;
        run=claim.event;
        const index=Math.floor(Date.parse(day+'T12:00:00Z')/86400000);
        const topic=config.topics[index%config.topics.length];
        const ai=integrations.ai();
        const recent=store.read().posts.filter(p=>p.accountId===account.id).slice(-8).map(p=>p.title).join(', ');
        const result=await text(ai,{task:'caption',brief:topic,brand:store.read().brand,context:'Son içerik başlıkları; tekrar etme: '+recent});
        post=validatePost({title:topic,caption:result.text,status:'draft',accountId:account.id,scheduledAt,requestId:key,mediaUrl:config.mediaSources[index%Math.max(config.mediaSources.length,1)]||'',kind:/\.mp4(?:[?#]|$)/i.test(config.mediaSources[index%Math.max(config.mediaSources.length,1)]||'')?'reel':'image'});
        await store.mutate(db=>{db.posts.push(post);Object.assign(db.events.find(e=>e.id===run.id),{postId:post.id,stage:'text_saved'})});
        if(config.autoImages){
          const generated=await image(ai,{prompt:`${topic}. Marka: ${store.read().brand.name}. Instagram için ticari içerik görseli. Uydurma yazı ve istatistik ekleme.`});
          const saved=await materialize(dataDir,generated,ai);
          post.kind='image';post.localMediaUrl=saved.localUrl;
          if(saved.sourceUrl)post.mediaUrl=saved.sourceUrl;
          await store.mutate(db=>Object.assign(db.posts.find(p=>p.id===post.id),{localMediaUrl:post.localMediaUrl,mediaUrl:post.mediaUrl,kind:post.kind}));
        }
        let status='ready_for_review';
        if(config.autoQueue){
          const latest=integrations.account(account.id);
          if(!latest.verifiedAt||!latest.publishing)throw Error('Hesap doğrulanmış veya otomatik paylaşım etkin değil; içerik taslak olarak korundu.');
          post=validatePost({...post,status:'scheduled'},post);
          await store.mutate(db=>Object.assign(db.posts.find(p=>p.id===post.id),post));
          status='queued';
        }
        await store.mutate(db=>Object.assign(db.events.find(e=>e.id===run.id),{status,finishedAt:new Date().toISOString()}));
        return {status,postId:post.id,targetDate:day};
      }catch(e){
        if(run)await store.mutate(db=>Object.assign(db.events.find(x=>x.id===run.id),{status:'reconciliation_required',error:e.message,finishedAt:new Date().toISOString()}));
        throw e;
      }finally{
        busy=false;
      }
    }

    // Multi-slot behavior (e.g. 3 daily posts)
    const plannedPosts = [];
    for (let slotIndex = 0; slotIndex < slots.length; slotIndex++) {
      const slot = slots[slotIndex];
      const scheduledAt = zonedInputToISO(day + 'T' + slot);
      if (Date.parse(scheduledAt) <= current.getTime() && !manual) continue;
      const key = `growth:${account.id}:${day}:${slot}`;
      busy = true;
      let run, post;
      try {
        const claim = await store.mutate(db => {
          if (db.events.some(e => e.key === key)) return { skipped: 'already_attempted' };
          if (db.posts.some(p => p.accountId === account.id && p.scheduledAt === scheduledAt && p.status !== 'failed')) return { skipped: 'slot_occupied' };
          const event = { id: randomUUID(), key, kind: 'growth', accountId: account.id, targetDate: day, slot, status: 'processing', startedAt: current.toISOString() };
          db.events.push(event);
          return { event: structuredClone(event) };
        });
        if (claim.skipped) continue;
        run = claim.event;
        const dayNum = Math.floor(Date.parse(day + 'T12:00:00Z') / 86400000);
        const topicIndex = (dayNum * 3 + slotIndex) % config.topics.length;
        const topic = config.topics[topicIndex];
        const ai = integrations.ai();
        const recent = store.read().posts.filter(p => p.accountId === account.id).slice(-8).map(p => p.title).join(', ');

        const slotBrief=`${topic}. Yayın saati: ${slot}, İstanbul. Somut ve yararlı bir bilgi ver. Gerçek müşteri vakası veya istatistik uydurma; aynı çağrıyı sürekli tekrarlama.`;

        const result = await text(ai, { task: 'caption', brief: slotBrief, brand: store.read().brand, context: 'Son içerik başlıkları; tekrar etme: ' + recent });
        const mediaIndex = (dayNum * 3 + slotIndex) % Math.max(config.mediaSources.length, 1);
        post = validatePost({
          title: topic,
          caption: result.text,
          status: 'draft',
          accountId: account.id,
          scheduledAt,
          requestId: key,
          mediaUrl: config.mediaSources[mediaIndex] || '',
          kind:/\.mp4(?:[?#]|$)/i.test(config.mediaSources[mediaIndex]||'')?'reel':'image'
        });

        await store.mutate(db => {
          db.posts.push(post);
          Object.assign(db.events.find(e => e.id === run.id), { postId: post.id, stage: 'text_saved' });
        });

        if (config.autoImages) {
          const generated = await image(ai, { prompt: `${topic}. Marka: ${store.read().brand.name}. Instagram için ticari içerik görseli. Uydurma yazı ve istatistik ekleme.` });
          const saved = await materialize(dataDir, generated, ai);
          post.kind='image';post.localMediaUrl = saved.localUrl;
          if (saved.sourceUrl) post.mediaUrl = saved.sourceUrl;
          await store.mutate(db => Object.assign(db.posts.find(p => p.id === post.id), { localMediaUrl: post.localMediaUrl, mediaUrl: post.mediaUrl, kind:post.kind }));
        }

        let status = 'ready_for_review';
        if (config.autoQueue) {
          const latest = integrations.account(account.id);
          if (!latest.verifiedAt || !latest.publishing) throw Error('Hesap doğrulanmış veya otomatik paylaşım etkin değil; içerik taslak olarak korundu.');
          post = validatePost({ ...post, status: 'scheduled' }, post);
          await store.mutate(db => Object.assign(db.posts.find(p => p.id === post.id), post));
          status = 'queued';
        }
        await store.mutate(db => Object.assign(db.events.find(e => e.id === run.id), { status, finishedAt: new Date().toISOString() }));
        plannedPosts.push({ status, postId: post.id, targetDate: day, slot });
      } catch (e) {
        if (run) await store.mutate(db => Object.assign(db.events.find(x => x.id === run.id), { status: 'reconciliation_required', error: e.message, finishedAt: new Date().toISOString() }));
        throw e;
      } finally {
        busy = false;
      }
    }
    return { status: plannedPosts.length ? 'queued' : 'skipped', planned: plannedPosts.length, posts: plannedPosts, targetDate: day };
  }

  let weeklyBusy = false;
  async function queueWeek(weekStart){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(weekStart||''))throw Error('Hafta için geçerli bir gün seçin.');
    const g=validateGrowth({...DEFAULT_GROWTH,...store.read().growth});
    if(!g.accountId||!g.topics.length)throw Error('Önce büyüme kurallarını kaydedin.');
    integrations.account(g.accountId);
    const offset=(new Date(weekStart+'T12:00:00Z').getUTCDay()+6)%7;
    const monday=addDays(weekStart,-offset);
    const dates=Array.from({length:7},(_,i)=>addDays(monday,i)).filter(day=>g.weekdays.includes(new Date(day+'T12:00:00Z').getUTCDay())&&Date.parse(zonedInputToISO(day+'T'+g.publishAt))>now().getTime());
    if(!dates.length)throw Error('Bu haftada gelecekte kalan seçili yayın günü yok.');
    return store.mutate(db=>{
      const key=`week:${g.accountId}:${monday}`;
      const existing=db.events.find(e=>e.key===key);
      if(existing)return existing;
      const event={id:randomUUID(),key,kind:'weekly_plan',accountId:g.accountId,weekStart:monday,dates,cursor:0,config:g,results:[],status:'pending',createdAt:new Date().toISOString()};
      db.events.push(event);
      return event;
    });
  }

  async function runWeeklyOnce({force=false}={}){
    if((!enabled&&!force)||weeklyBusy)return;
    weeklyBusy=true;
    try{
      const candidate=store.read().events.find(e=>e.kind==='weekly_plan'&&e.status==='pending');
      if(!candidate)return;
      await store.mutate(db=>{const e=db.events.find(e=>e.id===candidate.id);e.status='processing'});
      try{
        const day=candidate.dates[candidate.cursor];
        const r=await runOnce({manual:true,targetDate:day,configOverride:candidate.config});
        if(r.skipped==='busy'){
          await store.mutate(db=>{db.events.find(e=>e.id===candidate.id).status='pending'});
          return;
        }
        await store.mutate(db=>{
          const e=db.events.find(e=>e.id===candidate.id);
          e.results.push({targetDate:day,...r});
          e.cursor++;
          e.status=e.cancelRequested?'cancelled':e.cursor>=e.dates.length?'completed':'pending';
          if(e.status==='completed')e.finishedAt=new Date().toISOString();
        });
      }catch(error){
        await store.mutate(db=>Object.assign(db.events.find(e=>e.id===candidate.id),{status:'reconciliation_required',error:error.message}));
      }
    }finally{
      weeklyBusy=false;
    }
  }

  return {runOnce,queueWeek,runWeeklyOnce};
}
