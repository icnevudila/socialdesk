import test from 'node:test';
import assert from 'node:assert/strict';
import {balancedSchedule} from '../publishing-policy.mjs';
import {dayInZone} from '../public/time.js';
test('dengeli plan yayımlanan/başka hesap kayıtlarını korur ve tek güne yığılmaz',()=>{
 const posts=[{id:'published',accountId:'a',status:'published',scheduledAt:'2026-11-01T10:00:00Z'},...Array.from({length:5},(_,i)=>({id:String(i),accountId:'a',status:'scheduled',kind:i===4?'reel':'image',scheduledAt:'2026-11-01T12:00:00Z'})),{id:'other',accountId:'b',status:'scheduled',kind:'image'}];
 const plan=balancedSchedule(posts,'a',{now:new Date('2026-11-01T00:00:00Z')});
 assert.equal(plan.changes.length,5);assert.equal(new Set(plan.changes.map(c=>dayInZone(c.scheduledAt))).size,5);
 assert.ok(plan.changes.every(c=>!['published','other'].includes(c.id)&&dayInZone(c.scheduledAt)!=='2026-11-01'));
 assert.equal(plan.changes[1].kind,'reel');assert.equal(posts[1].scheduledAt,'2026-11-01T12:00:00Z');
});
test('yaklaşan iki saat ve hatalı kurallar plan dışıdır',()=>{
 const posts=[{id:'x',accountId:'a',status:'scheduled',kind:'image',scheduledAt:'2026-11-01T00:00:00Z'}];
 assert.throws(()=>balancedSchedule(posts,'a',{slots:['bad']}));
 const plan=balancedSchedule(posts,'a',{now:new Date('2026-11-01T09:30:00Z'),slots:['12:30']});assert.equal(dayInZone(plan.changes[0].scheduledAt),'2026-11-02');
});
