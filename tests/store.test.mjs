import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createStore,validatePost} from '../store.mjs';
const base={title:'İçerik',caption:'Açıklama'};
test('kalıcı kayıt ve eşzamanlı güncellemeler',async()=>{const dir=await mkdtemp(path.join(os.tmpdir(),'socialdesk-'));try{const s=await createStore(dir);await Promise.all(Array.from({length:12},(_,i)=>s.mutate(db=>db.posts.push(validatePost({...base,title:String(i)})))));assert.equal((await createStore(dir)).read().posts.length,12);await s.mutate(db=>{db.posts[0].title='Düzenlendi'});assert.equal((await createStore(dir)).read().posts[0].title,'Düzenlendi');await s.mutate(db=>{db.posts.splice(0,1)});assert.equal((await createStore(dir)).read().posts.length,11)}finally{await rm(dir,{recursive:true,force:true})}});
test('geçersiz medya ve plan zamanını engeller',()=>{assert.throws(()=>validatePost({...base,mediaUrl:'http://example.com/a.jpg'}));assert.throws(()=>validatePost({...base,status:'planned',scheduledAt:'2020-01-01'}));assert.throws(()=>validatePost({...base,status:'scheduled',scheduledAt:'2099-01-01'}));assert.throws(()=>validatePost({...base,status:'published'}));assert.equal(validatePost(base).status,'draft')});
