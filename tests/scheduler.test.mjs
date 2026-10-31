import test from 'node:test';
import assert from 'node:assert/strict';
import {createScheduler} from '../scheduler.mjs';
const account={id:'a',userId:'1',token:'hidden',version:'v25.0',verifiedAt:'today',publishing:true};
function setup(options={},posts){let db={posts:posts||[{id:'p',accountId:'a',status:'scheduled',scheduledAt:'2020-01-01'}]};const store={read:()=>structuredClone(db),mutate:async fn=>fn(db)};return {store,scheduler:createScheduler(store,{account:()=>account},{create:async()=>({id:'c'}),status:async()=>({status_code:'FINISHED'}),publish:async()=>({id:'m'}),lookup:async()=>({permalink:'https://www.instagram.com/p/test/'}),pause:async()=>{},...options})}}
test('tek yayın, eşzamanlı tick ve yayın kimliği kalıcılığı',async()=>{let calls=0;const {store,scheduler}=setup({publish:async()=>{calls++;return {id:'m'}}});await Promise.all([scheduler.runOnce(),scheduler.runOnce()]);await scheduler.runOnce();assert.equal(calls,1);const p=store.read().posts[0];assert.equal(p.status,'published');assert.equal(p.containerId,'c');assert.equal(p.publishedId,'m');assert.ok(p.publishAttemptedAt);assert.ok(p.permalink)});
test('belirsiz yayın yanıtı kör tekrar edilmez',async()=>{let calls=0;const {store,scheduler}=setup({publish:async()=>{calls++;throw Error('timeout')}});await scheduler.runOnce();await scheduler.runOnce();assert.equal(calls,1);assert.equal(store.read().posts[0].status,'reconciliation_required')});
test('container hatasında yayın yapılmaz',async()=>{let calls=0;const {store,scheduler}=setup({status:async()=>({status_code:'ERROR'}),publish:async()=>{calls++}});await scheduler.runOnce();assert.equal(calls,0);assert.equal(store.read().posts[0].status,'reconciliation_required')});
test('süreç kesintisinden sonra iş karantinada kalır',async()=>{const {store,scheduler}=setup({},[{id:'p',status:'processing'}]);await scheduler.recover();await scheduler.runOnce();assert.equal(store.read().posts[0].status,'reconciliation_required')});
test('hazır olmayan medya yayınlanmaz',async()=>{let calls=0;const {store,scheduler}=setup({status:async()=>({status_code:'IN_PROGRESS'}),polls:2,publish:async()=>{calls++}});await scheduler.runOnce();assert.equal(calls,0);assert.equal(store.read().posts[0].status,'reconciliation_required')});

test('kapalı/eksik ilk hesap diğer hesabın kuyruğunu durdurmaz',async()=>{const posts=[{id:'closed',accountId:'closed',status:'scheduled',scheduledAt:'2020-01-01'},{id:'p',accountId:'a',status:'scheduled',scheduledAt:'2020-01-02'}];let db={posts};const store={read:()=>structuredClone(db),mutate:async fn=>fn(db)};let target;const s=createScheduler(store,{account:id=>id==='a'?account:{id:'closed',publishing:false}},{create:async(p,a)=>{target=a.id;return {id:'c'}},status:async()=>({status_code:'FINISHED'}),publish:async()=>({id:'m'}),lookup:async()=>({})});await s.runOnce();assert.equal(target,'a');assert.equal(db.posts[1].status,'published');assert.equal(db.posts[0].status,'scheduled')});
test('süreç kesintisi belirsiz yorum ve içerik üretimini de karantinaya alır',async()=>{let db={posts:[],events:[{kind:'private_comment',status:'processing'},{kind:'growth',status:'processing'}]};const s=createScheduler({read:()=>db,mutate:async fn=>fn(db)},{account:()=>account});await s.recover();assert.ok(db.events.every(e=>e.status==='reconciliation_required'))});

test('uzun kesinti sonrası birikmiş gönderilerde minimum aralık korunur ve seri yayın engellenir',async()=>{
 let calls=0;
 const posts=[
  {id:'p1',accountId:'a',status:'scheduled',scheduledAt:'2026-10-25T10:00:00Z'},
  {id:'p2',accountId:'a',status:'scheduled',scheduledAt:'2026-10-26T10:00:00Z'}
 ];
 let currentTime=Date.parse('2026-10-31T12:00:00Z');
 const {store,scheduler}=setup({minSpacingMs:30*60*1000,now:()=>currentTime,publish:async()=>{calls++;return {id:'pub-'+calls}}},posts);
 await scheduler.runOnce();
 assert.equal(calls,1);
 assert.equal(store.read().posts[0].status,'published');
 assert.equal(store.read().posts[1].status,'scheduled');
 // Immediately next tick without elapsed time should NOT burst-publish p2
 await scheduler.runOnce();
 assert.equal(calls,1);
 assert.equal(store.read().posts[1].status,'scheduled');
 // After 30 minutes pass, p2 can be published
 currentTime+=31*60*1000;
 await scheduler.runOnce();
 assert.equal(calls,2);
 assert.equal(store.read().posts[1].status,'published');
});

test('tolerans süresini aşan çok eski gönderiler ertelenerek karantinaya alınır',async()=>{
 let calls=0;
 const posts=[
  {id:'p-old',accountId:'a',status:'scheduled',scheduledAt:'2026-10-01T10:00:00Z'}
 ];
 const currentTime=Date.parse('2026-10-31T12:00:00Z');
 const {store,scheduler}=setup({maxLateMs:24*60*60*1000,now:()=>currentTime,publish:async()=>{calls++;return {id:'m'}}},posts);
 await scheduler.runOnce();
 assert.equal(calls,0);
 const p=store.read().posts[0];
 assert.equal(p.status,'draft');
 assert.ok(p.error.includes('Toplu gecikmiş yayın yapılmadı'));
 assert.equal(p.scheduledAt,null);
 assert.ok(p.missedScheduledAt);
});
