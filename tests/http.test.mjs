import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {once} from 'node:events';
import os from 'node:os';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
test('HTTP CRUD, kalıcılık, yayın engeli ve yerel erişim',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'socialdesk-http-'));let child;const port=14317;const base=`http://127.0.0.1:${port}`;
 async function start(){child=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,PORT:String(port),SOCIALDESK_DATA_DIR:dir,INSTAGRAM_ACCESS_TOKEN:'',INSTAGRAM_USER_ID:'',ENABLE_PUBLISHING:'false'},stdio:['ignore','pipe','pipe']});await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('Sunucu başlatılamadı')}),new Promise((_,reject)=>{const t=setTimeout(()=>reject(Error('Sunucu zaman aşımı')),5000);t.unref()})])}
 async function stop(){if(child&&child.exitCode===null){const ended=once(child,'exit');child.kill();await ended}}
 async function req(p,method='GET',body,headers={}){const r=await fetch(base+p,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json()}}
 try{await start();const post={title:'Test',caption:'Açıklama',status:'planned',scheduledAt:'2099-01-01T12:00:00Z'};let r=await req('/api/posts','POST',post);assert.equal(r.status,201);const id=r.data.id;
 assert.equal((await req('/api/posts/'+id,'PUT',{...post,title:'Düzenlendi'})).status,200);
 assert.equal((await req('/api/posts','POST',{...post,status:'scheduled',mediaUrl:'https://example.com/a.jpg'})).status,409);
 assert.equal((await req('/api/posts','POST',{...post,scheduledAt:'bozuk'})).status,400);
 assert.equal((await req('/api/posts','POST',{...post,mediaUrl:'javascript:alert(1)'})).status,400);
 assert.equal((await req('/api/posts','POST',post,{Origin:'https://other.example'})).status,403);
 assert.equal((await req('/api/connection/check','POST')).status,409);
 assert.equal((await req('/api/brand','PUT',{name:'Test marka',tone:'Net'})).status,200);
 const o=await req('/api/opportunities','POST',{url:'https://www.instagram.com/p/test123/',topic:'Konu',note:'Not'});assert.equal(o.status,201);
 assert.equal((await req('/api/opportunities','POST',{url:'https://evil.example/p/test/'})).status,400);
 await stop();await start();const w=(await req('/api/workspace')).data;assert.equal(w.posts[0].title,'Düzenlendi');assert.equal(w.brand.name,'Test marka');assert.equal(w.opportunities[0].note,'Not');assert.equal(w.connection.verified,false);
 const exported=(await req('/api/export')).data;assert.equal('connection' in exported,false);
 assert.equal((await req('/api/posts/'+id,'DELETE')).status,200);assert.equal((await req('/api/opportunities/'+o.data.id,'DELETE')).status,200);assert.equal((await req('/api/workspace')).data.posts.length,0);
 }finally{await stop();await rm(dir,{recursive:true,force:true})}
});
