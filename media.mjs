import {mkdir,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export function mediaType(buffer){if(buffer.length>8&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return {ext:'png',mime:'image/png'};if(buffer.length>3&&buffer[0]===255&&buffer[1]===216&&buffer[2]===255)return {ext:'jpg',mime:'image/jpeg'};if(buffer.length>12&&buffer.toString('ascii',4,8)==='ftyp')return {ext:'mp4',mime:'video/mp4'};if(buffer.length>12&&buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP')return {ext:'webp',mime:'image/webp'};throw Error('PNG, JPEG, WebP veya MP4 dosyası seçin.')}
export async function saveMedia(dir,buffer){if(!buffer.length||buffer.length>50*1024*1024)throw Error('Dosya 1 bayt–50 MB arasında olmalı.');const type=mediaType(buffer);await mkdir(path.join(dir,'media'),{recursive:true});const name=randomUUID()+'.'+type.ext;await writeFile(path.join(dir,'media',name),buffer);return {localUrl:'/media/'+name,bytes:buffer.length,mime:type.mime}}
export async function readMedia(dir,name){if(!/^[\da-f-]{36}\.(png|jpg|webp|mp4)$/.test(name))throw Error('Medya bulunamadı.');const buffer=await readFile(path.join(dir,'media',name));return {buffer,...mediaType(buffer)}}
// Normalise provider adapters to a persisted local file for the editor.
export async function materializeImage(dir,result,config){
 if(Buffer.isBuffer(result))return saveMedia(dir,result);
 const source=String(result?.url||'');
 if(source.startsWith('data:image/')){const match=source.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);if(!match)throw Error('Görsel verisi okunamadı.');return saveMedia(dir,Buffer.from(match[2],'base64'))}
 const url=new URL(source);const base=new URL(config.baseUrl);if(url.username||url.password||!(url.protocol==='https:'||(url.protocol==='http:'&&url.host===base.host)))throw Error('Sağlayıcının görsel adresi desteklenmiyor.');
 const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('Üretilen görsel indirilemedi.');const chunks=[];let length=0;for await(const chunk of response.body){length+=chunk.length;if(length>50*1024*1024)throw Error('Görsel 50 MB sınırını aşıyor.');chunks.push(chunk)}
 return {...await saveMedia(dir,Buffer.concat(chunks)),...(url.protocol==='https:'?{sourceUrl:url.href}:{})};
}
