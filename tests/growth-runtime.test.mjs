import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {bridgeAuthenticated,buildGrowthStatus,createSnapshotCollector} from '../growth-runtime.mjs';
import {proxyCloudRequest} from '../cloud-proxy.mjs';
import {privateCall} from '../private.mjs';

test('bridge rejects query-string secrets and short/wrong header tokens',()=>{
  const token='a'.repeat(48);
  assert.equal(bridgeAuthenticated({url:'/?secret=socialdesk_live_bridge',headers:{}},token),false);
  assert.equal(bridgeAuthenticated({headers:{'x-socialdesk-bridge':token}},token),true);
  assert.equal(bridgeAuthenticated({headers:{'x-socialdesk-bridge':token+'x'}},token),false);
  assert.equal(bridgeAuthenticated({headers:{'x-socialdesk-bridge':'short'}},'short'),false);
});

test('runtime reports unknown followers, stale heartbeat and only persisted account results',()=>{
  const now=Date.parse('2026-10-31T12:00:00Z');
  const db={engagement:{accountId:'a'},events:[],posts:[]};
  assert.equal(buildGrowthStatus(db,{now}).followerStats.current,null);
  assert.equal(buildGrowthStatus(db,{now,schedulerEnabled:true,heartbeat:{lastTickAt:'2026-10-30T12:00:00Z'}}).active,false);
  db.snapshots=[{accountId:'a',date:'2026-10-30',observedAt:'2026-10-30T12:00:00Z',followersCount:3},{accountId:'b',date:'2026-10-31',observedAt:'2026-10-31T12:00:00Z',followersCount:999},{accountId:'a',date:'2026-10-31',observedAt:'2026-10-31T12:00:00Z',followersCount:5}];
  const result=buildGrowthStatus(db,{now,schedulerEnabled:true,heartbeat:{lastTickAt:new Date(now).toISOString()}});
  assert.equal(result.active,true);assert.equal(result.followerStats.current,5);assert.match(result.followerStats.growthVelocity,/2 net/);assert.equal(result.today.comments,0);
});

test('daily Meta snapshots deduplicate and token errors invalidate rather than invent metrics',async()=>{
  let db={snapshots:[]};const store={read:()=>structuredClone(db),mutate:async f=>f(db)};let calls=0,invalid=0;
  const integrations={public:()=>({accounts:[{id:'a',verified:true}]}),account:()=>({id:'a'}),invalidate:async()=>invalid++};
  let now=new Date('2026-10-31T12:00:00Z');
  const collector=createSnapshotCollector(store,integrations,{now:()=>now,readProfile:async()=>{calls++;if(calls>1)throw Object.assign(Error('expired'),{metaCode:190});return {followers_count:0}}});
  await Promise.all([collector.runOnce(),collector.runOnce()]);assert.equal(calls,1);assert.equal(db.snapshots[0].followersCount,0);
  now=new Date('2026-11-01T12:00:00Z');await collector.runOnce();assert.equal(invalid,1);assert.equal(db.snapshots.length,1);
});

test('cloud proxy forwards credentials to one backend and preserves failure/cookie responses',async()=>{
  const req=Readable.from([Buffer.from('{"title":"İçerik"}')]);req.url='/api/posts?x=1';req.method='POST';req.headers={host:'panel.example',cookie:'socialdesk_auth=session','content-type':'application/json'};
  const res={writeHead(status,headers){this.status=status;this.headers=headers},end(data){this.data=data}};
  await proxyCloudRequest(req,res,{baseUrl:'https://backend.example',token:'b'.repeat(48),fetchImpl:async(url,options)=>{
    assert.equal(url.href,'https://backend.example/api/posts?x=1');assert.equal(options.headers.cookie,'socialdesk_auth=session');assert.match(options.body.toString(),/İçerik/);return new Response('{"error":"conflict"}',{status:409,headers:{'Set-Cookie':'socialdesk_auth=; Secure; HttpOnly'}});
  }});assert.equal(res.status,409);assert.match(res.headers['Set-Cookie'][0],/Secure/);
});

test('Vercel without a real private service never fabricates account or discovery data',async()=>{
  const old=process.env.VERCEL;process.env.VERCEL='1';
  try{assert.equal((await privateCall('check')).available,false);await assert.rejects(privateCall('analytics'));await assert.rejects(privateCall('discover',{tag:'esnaf'}));}
  finally{if(old===undefined)delete process.env.VERCEL;else process.env.VERCEL=old;}
});
