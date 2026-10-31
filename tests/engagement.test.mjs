import test from 'node:test';
import assert from 'node:assert/strict';

test('özel API hatası otomatik etkileşimi kapatır ve diğer gönderiye devam etmez',async()=>{
 const store=storeFor({opportunities:[{id:'o-one',url:'https://www.instagram.com/p/ONE/'},{id:'o-two',url:'https://www.instagram.com/p/TWO/'}]});
 await store.mutate(db=>{db.engagement.maxCommentsPerDay=3});let clock=Date.now()+3000,sends=0;
 for(const opportunityId of ['o-one','o-two'])await queueReviewedComment(store,{opportunityId,message:'İlgili yorum',confirmed:true,scheduledAt:new Date(Date.now()+1000).toISOString(),accountId:'a',expectedUsername:'brand',approvalMode:'rules'});
 const worker=createEngagementQueue(store,{now:()=>clock,call:async action=>{if(action==='check')return {installed:true,sessionSaved:true};if(action==='identity')return {verified:true,username:'brand'};sends++;throw Error('Instagram session verification required')}});
 await worker.runOnce();clock+=31*60*1000;await worker.runOnce();assert.equal(sends,1);assert.equal(store.read().engagement.enabled,false);assert.equal(store.read().engagement.autoSend,false);assert.ok(store.read().engagement.blockedReason);
});

test('otomatik beğeni önce kaydedilir, aynı gönderide bir kez çalışır ve kapatılınca durur',async()=>{
 const store=storeFor({opportunities:[{id:'o-like',url:'https://www.instagram.com/p/LIKE_TEST/'}]});
 await store.mutate(db=>{db.engagement.autoLike=true});
 let clock=Date.now()+3000,likes=0;
 await queueReviewedComment(store,{opportunityId:'o-like',message:'İlgili yorum.',confirmed:true,scheduledAt:new Date(Date.now()+1000).toISOString(),accountId:'a',expectedUsername:'brand',approvalMode:'rules'});
 const worker=createEngagementQueue(store,{now:()=>clock,call:async action=>{
  if(action==='check')return {installed:true,sessionSaved:true};if(action==='identity')return {verified:true,username:'brand'};
  if(action==='comment')return {id:'comment-like',accepted:true};if(action==='like'){likes++;return {liked:true}}
 }});
 await worker.runOnce();assert.equal(store.read().events.filter(e=>e.kind==='private_like').length,1);assert.equal(likes,0);
 clock+=31*60*1000;await store.mutate(db=>{db.engagement.autoLike=false});await worker.runOnce();assert.equal(likes,0);
 await store.mutate(db=>{db.engagement.autoLike=true});await Promise.all([worker.runOnce(),worker.runOnce()]);await worker.runOnce();
 assert.equal(likes,1);assert.equal(store.read().events.find(e=>e.kind==='private_like').status,'accepted');
});

test('AI arızasında hazır yorum veya dış etkileşim üretilmez',async()=>{
  const store=storeFor();const actions=[];
  const worker=createDiscoveryAutomation(store,integrations,{call:async a=>{actions.push(a);return a==='check'?{installed:true,sessionSaved:true}:a==='identity'?{verified:true,username:'brand'}:{items:[candidate]}},text:async()=>{throw Error('provider offline')}});
  await assert.rejects(worker.runOnce({manual:true}),/provider offline/);
  assert.equal(store.read().opportunities.length,0);
  assert.equal(actions.some(a=>['like','story','follow','comment'].includes(a)),false);
});

test('inceleme modunda keşif hiçbir beğeni, takip veya hikaye işlemi yapmaz',async()=>{
  const store=storeFor();await store.mutate(db=>{db.engagement.autoSend=false;db.engagement.autoLike=true;db.engagement.autoFollow=true;db.engagement.viewStories=true});const actions=[];
  const worker=createDiscoveryAutomation(store,integrations,{call:async a=>{actions.push(a);return a==='check'?{installed:true,sessionSaved:true}:a==='identity'?{verified:true,username:'brand'}:{items:[candidate]}},text:async(c,p)=>({text:p.task==='relevance'?JSON.stringify({relevant:true,score:92,reason:'İlgili'}):'Gönderiye özel taslak.'})});
  assert.equal((await worker.runOnce({manual:true})).review,1);
  assert.equal(actions.some(a=>['like','story','follow','comment'].includes(a)),false);
});
import {createDiscoveryAutomation,createEngagementQueue,validateEngagement,queueReviewedComment} from '../engagement.mjs';
function storeFor(extra={}){let db={brand:{name:'Test marka'},posts:[],opportunities:[],events:[],engagement:{enabled:true,autoSend:true,accountId:'a',hashtags:['mimari'],minRelevance:85,maxCommentsPerDay:1},...extra};return {read:()=>structuredClone(db),mutate:async fn=>fn(db)}}
const account={id:'a',verifiedAt:'yes',username:'brand'};
const integrations={account:()=>account,ai:()=>({})};
const candidate={url:'https://www.instagram.com/p/contextual_post/',username:'architect',caption:'Şube lokasyonu seçerken işletme yoğunluğu analizi.'};
test('otomatik keşif bağlamı değerlendirir, özgün yorumu kuyruğa alır, özel oturum kimliğini tekrar kontrol ederek gönderir',async()=>{const store=storeFor();let sends=0;const call=async(action)=>{if(action==='check')return {installed:true,sessionSaved:true};if(action==='identity')return {verified:true,username:'brand'};if(action==='discover')return {items:[candidate]};if(action==='comment'){sends++;return {id:'comment-1',accepted:true}}};const text=async(c,input)=>({text:input.task==='relevance'?JSON.stringify({relevant:true,score:93,reason:'Lokasyon analizi marka konusuyla doğrudan ilgili.'}):'Lokasyon seçerken çevredeki işletme yoğunluğu da karar için yararlı bir ölçüt.'});const auto=createDiscoveryAutomation(store,integrations,{call,text});const r=await auto.runOnce({manual:true});assert.equal(r.queued,1);assert.equal(store.read().opportunities[0].source,'automatic_discovery');await auto.runOnce({manual:true});assert.equal(store.read().events.filter(e=>e.kind==='private_comment').length,1);const worker=createEngagementQueue(store,{call,now:()=>Date.now()+3000});await Promise.all([worker.runOnce(),worker.runOnce()]);assert.equal(sends,1);assert.equal(store.read().events.find(e=>e.kind==='private_comment').status,'accepted')});
test('alakasız gönderiye yorum üretilmez ve aynı gün keşif tekrarlanmaz',async()=>{const store=storeFor();let tasks=[];const auto=createDiscoveryAutomation(store,integrations,{call:async action=>action==='check'?{installed:true,sessionSaved:true}:action==='identity'?{verified:true,username:'brand'}:{items:[candidate]},text:async(c,p)=>{tasks.push(p.task);return {text:JSON.stringify({relevant:false,score:10,reason:'İlgili değil'})}}});const r=await auto.runOnce({manual:true});assert.equal(r.queued,0);assert.deepEqual(tasks,['relevance']);assert.equal(store.read().opportunities.length,0);assert.equal((await auto.runOnce({manual:true})).skipped,'already_attempted')});
test('yanlış özel oturum hesabında keşif ve yorum yapılmaz',async()=>{const store=storeFor();let discovery=0;const auto=createDiscoveryAutomation(store,integrations,{call:async action=>{if(action==='check')return {installed:true,sessionSaved:true};if(action==='identity')return {verified:true,username:'wrong_account'};discovery++}});await assert.rejects(auto.runOnce({manual:true}),/eşleşmiyor/);assert.equal(discovery,0);assert.equal(store.read().events[0].status,'reconciliation_required')});
test('oturum yoksa sahte sonuç yok; model alaka sözleşmesi bozuksa otomatik yorum yok',async()=>{const store=storeFor();const offline=createDiscoveryAutomation(store,integrations,{call:async()=>({installed:true,sessionSaved:false})});assert.equal((await offline.runOnce({manual:true})).skipped,'connection_required');assert.equal(store.read().events.length,0);const broken=createDiscoveryAutomation(store,integrations,{call:async a=>a==='check'?{installed:true,sessionSaved:true}:a==='identity'?{verified:true,username:'brand'}:{items:[candidate]},text:async()=>({text:'Kesinlikle harika!'})});await assert.rejects(broken.runOnce({manual:true}),/JSON/);assert.equal(store.read().opportunities.length,0)});
test('otomatik gönderim kapalıysa ilgili yorum yalnızca taslakta kalır',async()=>{const store=storeFor();await store.mutate(d=>{d.engagement.autoSend=false});const auto=createDiscoveryAutomation(store,integrations,{call:async a=>a==='check'?{installed:true,sessionSaved:true}:a==='identity'?{verified:true,username:'brand'}:{items:[candidate]},text:async(c,p)=>({text:p.task==='relevance'?JSON.stringify({relevant:true,score:92,reason:'İşletme lokasyonu ile doğrudan ilgili'}):'Taslak yorum'})});const result=await auto.runOnce({manual:true});assert.equal(result.review,1);assert.equal(store.read().opportunities[0].commentDraft,'Taslak yorum');assert.equal(store.read().events.filter(e=>e.kind==='private_comment').length,0)});
test('yorum sonucu belirsizse tekrar gönderilmez; bağlantı yokken gönderim sayılmaz',async()=>{const store=storeFor();await store.mutate(d=>d.opportunities.push({id:'o',url:candidate.url}));await queueReviewedComment(store,{opportunityId:'o',message:'İlgili yorum.',confirmed:true,scheduledAt:new Date(Date.now()+1000).toISOString()});let sends=0;const offline=createEngagementQueue(store,{now:()=>Date.now()+3000,call:async()=>({installed:true,sessionSaved:false})});await offline.runOnce();assert.equal(store.read().events[0].status,'waiting_connection');const worker=createEngagementQueue(store,{now:()=>Date.now()+400000,call:async a=>{if(a==='check')return {installed:true,sessionSaved:true};sends++;throw Error('timeout')}});await worker.runOnce();await worker.runOnce();assert.equal(sends,1);assert.equal(store.read().events[0].status,'reconciliation_required')});
test('alaka ve günlük uygulama sınırları doğrulanır',()=>{assert.throws(()=>validateEngagement({enabled:true}));assert.throws(()=>validateEngagement({maxCommentsPerDay:99}));assert.throws(()=>validateEngagement({minRelevance:40}));assert.throws(()=>validateEngagement({hashtags:['hashtag space']}));assert.equal(validateEngagement({}).maxCommentsPerDay,1)});
