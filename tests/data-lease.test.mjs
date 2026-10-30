import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {acquireDataLease} from '../data-lease.mjs';
test('aynı veri klasörünü iki süreç sahiplenemez; bırakılan kilit yeniden alınır',async()=>{const dir=await mkdtemp(path.join(os.tmpdir(),'socialdesk-lock-'));try{const release=await acquireDataLease(dir);await assert.rejects(acquireDataLease(dir),/başka/);release();const second=await acquireDataLease(dir);second()}finally{await rm(dir,{recursive:true,force:true})}});
