import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const ROOT = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
export const STATUSES = ['draft', 'planned', 'scheduled', 'processing', 'published', 'failed', 'reconciliation_required'];
export function validatePost(input, existing = {}) {
  const caption = String(input.caption ?? existing.caption ?? '').trim();
  const title = String(input.title ?? existing.title ?? '').trim();
  const kind = input.kind ?? existing.kind ?? 'image';
  const status = input.status ?? existing.status ?? 'draft';
  const scheduledAt = Object.hasOwn(input,'scheduledAt') ? input.scheduledAt : existing.scheduledAt ?? null;
  const mediaUrl = String(input.mediaUrl ?? existing.mediaUrl ?? '').trim();
  if (!title || title.length > 150) throw new Error('Başlık 1–150 karakter olmalı.');
  if (!caption || caption.length > 2200) throw new Error('Açıklama 1–2200 karakter olmalı.');
  if (!['image', 'reel'].includes(kind)) throw new Error('Desteklenmeyen içerik türü.');
  if (!['draft', 'planned', 'scheduled'].includes(status)) throw new Error('Geçersiz kayıt durumu.');
  const localMediaUrl=String(input.localMediaUrl ?? existing.localMediaUrl ?? '');
  if(localMediaUrl&&!/^\/media\/[\da-f-]{36}\.(png|jpg|webp|mp4)$/.test(localMediaUrl))throw Error('Geçersiz yerel medya.');
  if (mediaUrl) { let u; try { u = new URL(mediaUrl); } catch { throw new Error('Geçerli bir medya URL’si girin.'); } if (u.protocol !== 'https:') throw new Error('Medya URL’si HTTPS olmalı.'); }
  if (scheduledAt && !Number.isFinite(Date.parse(scheduledAt))) throw new Error('Geçerli bir tarih seçin.');
  if (status !== 'draft' && (!scheduledAt || !Number.isFinite(Date.parse(scheduledAt)) || Date.parse(scheduledAt) <= Date.now())) throw new Error('Gelecekte bir paylaşım zamanı seçin.');
  if (status === 'scheduled' && !mediaUrl) throw new Error('Otomatik paylaşım için herkese açık medya URL’si gerekli.');
  return { ...existing, id: existing.id || randomUUID(), title, caption, kind, status, localMediaUrl, requestId:String(existing.requestId||input.requestId||'').slice(0,100), accountId:String(input.accountId ?? existing.accountId ?? ''), scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null, mediaUrl, theme: ['forest','mint','paper'].includes(input.theme ?? existing.theme) ? (input.theme ?? existing.theme) : 'forest', updatedAt: new Date().toISOString(), createdAt: existing.createdAt || new Date().toISOString() };
}
export async function createStore(dir) {
  await mkdir(dir, {recursive:true});
  const file = path.join(dir, 'workspace.json');
  let db;
  try { db = JSON.parse(await readFile(file, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; db = {posts:[], opportunities:[], brand:{name:'Benim markam', handle:'', sector:'', audience:'', tone:'Samimi ve net'}, events:[]}; }
  // A single process owns the store. Queue mutations and atomically replace the file.
  let queue = Promise.resolve();
  async function mutate(fn) {
    const job = queue.then(async()=>{ const next = structuredClone(db); const result = await fn(next); await writeFile(file+'.tmp', JSON.stringify(next,null,2), 'utf8'); await rename(file+'.tmp',file); db = next; return result; });
    queue = job.catch(()=>{}); return job;
  }
  return { read:()=>structuredClone(db), mutate };
}

