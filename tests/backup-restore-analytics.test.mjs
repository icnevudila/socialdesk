import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBackup,createStore} from '../store.mjs';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

test('validateBackup geçersiz verileri reddeder ve geçerli yedeği doğrular', ()=>{
 assert.throws(()=>validateBackup(null),/Yedek nesnesi geçersiz/);
 assert.throws(()=>validateBackup([]),/Yedek nesnesi geçersiz/);
 assert.throws(()=>validateBackup({}),/Yedek dosyasında gönderiler bulunamadı/);
 assert.throws(()=>validateBackup({posts:[]}),/Yedek dosyasında marka bilgisi eksik/);
 
 const valid={
  posts:[{id:'p1',title:'Test',caption:'Deneme',status:'draft'}],
  brand:{name:'Veriburada'},
  opportunities:[],
  events:[],
  snapshots:[{date:'2026-10-31',followersCount:150}]
 };
 const res=validateBackup(valid);
 assert.equal(res.posts.length,1);
 assert.equal(res.brand.name,'Veriburada');
 assert.equal(res.snapshots.length,1);
});

test('yedekten geri yükleme çalışma alanını doğru günceller', async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'sd-restore-test-'));
 try{
  const store=await createStore(dir);
  const backupData=validateBackup({
   posts:[{id:'post-1',title:'İşletme Analizi',caption:'Detaylar',status:'draft'}],
   brand:{name:'Restored Brand',handle:'restored'},
   opportunities:[],
   events:[],
   snapshots:[{date:'2026-10-30',followersCount:100},{date:'2026-10-31',followersCount:120}]
  });
  await store.mutate(db=>{
   Object.assign(db,backupData);
  });
  const current=store.read();
  assert.equal(current.brand.name,'Restored Brand');
  assert.equal(current.posts.length,1);
  assert.equal(current.posts[0].id,'post-1');
  assert.equal(current.snapshots.length,2);
  assert.equal(current.snapshots[1].followersCount,120);
 }finally{
  await rm(dir,{recursive:true,force:true});
 }
});
