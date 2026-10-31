import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {existsSync} from 'node:fs';
const root=path.dirname(fileURLToPath(import.meta.url));

export async function privateCall(action,values={},options={}){
 if(!['check','discover','comment','like','follow','story','interact','identity','publish','analytics'].includes(action))throw Error('Desteklenmeyen işlem.');
 const dir=options.dataDir||process.env.SOCIALDESK_DATA_DIR||path.join(root,'data');
 const python=options.pythonBin??[process.env.PYTHON_BIN,path.join(root,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python')].find(p=>p&&existsSync(p));
 if(!python||process.env.VERCEL){
   if(action==='check')return {installed:false,available:false,sessionSaved:false,version:null,mode:'unavailable'};
   throw Error('Özel Instagram API ortamı bu sunucuda kurulu değil. Manuel inceleme listesini kullanabilirsiniz.');
 }
 if(action!=='check'&&!existsSync(path.join(dir,'private-session.json')))throw Error('Özel API oturumu yok. Yerel terminalde scripts/private_cli.py login komutunu çalıştırın.');
 if(action==='discover'&&!/^[\p{L}\p{N}_]{1,80}$/u.test(String(values.tag||'').replace(/^#/,'')))throw Error('Geçerli bir hashtag yazın.');
 if(action==='comment'&&(!String(values.message||'').trim()||String(values.message).length>2000))throw Error('Yorum 1–2000 karakter olmalı.');

 const args=[path.join(root,'scripts/private_cli.py'),action];
 if(action==='discover')args.push('--tag',String(values.tag));
 if(action==='comment'||action==='like'||action==='interact')if(values.url)args.push('--url',String(values.url));
 if(action==='follow'||action==='story'||action==='interact')if(values.username)args.push('--username',String(values.username));
 if(action==='publish'){
   if(values.url)args.push('--url',String(values.url));
   if(values.file)args.push('--file',String(values.file));
   if(values.caption)args.push('--caption',String(values.caption));
 }

 return new Promise((resolve,reject)=>{let output='',settled=false;const finish=(err,data)=>{if(settled)return;settled=true;clearTimeout(timer);err?reject(err):resolve(data)};
 const child=spawn(python,args,{cwd:root,windowsHide:true,env:{...process.env,SOCIALDESK_DATA_DIR:dir,PYTHONIOENCODING:'utf-8'},stdio:['pipe','pipe','pipe']});
 const timer=setTimeout(()=>{finish(Error('Instagram işlem sonucu zamanında alınamadı. Tekrar göndermeden önce Instagram sonucunu kontrol edin.'));child.kill()},options.timeoutMs||120000);
 child.stdout.on('data',c=>{output+=c;if(output.length>200000){finish(Error('Özel API yanıtı boyut sınırını aştı.'));child.kill()}});child.stderr.on('data',()=>{});child.stdin.on('error',()=>{});
 child.on('error',()=>finish(Error('Özel API Python ortamı başlatılamadı.')));
 child.on('close',code=>{
   if(settled)return;
   try{
     const data=JSON.parse(output.trim());
     if(code||data.error)throw Error(data.error||'Instagram özel API isteği başarısız.');
     if(action==='comment'&&(!data.id||data.accepted!==true))throw Error('Instagram yorum sonucu doğrulanamadı.');
     if(action==='like'&&!data.liked)throw Error('Instagram beğeni işlemi başarısız.');
     if(action==='follow'&&!data.followed)throw Error('Instagram takip işlemi başarısız.');
     if(action==='discover'&&!Array.isArray(data.items))throw Error('Instagram keşif yanıtı okunamadı.');
     if(action==='publish'&&(!data.id||!data.published))throw Error('Instagram yayın sonucu doğrulanamadı.');
     finish(null,data);
   }catch(e){
     finish(Error(e.message.startsWith('Instagram')||e.message.startsWith('Özel')||e.message.startsWith('Geçerli')?e.message:'Özel API yanıtı okunamadı.'));
   }
 });
 child.stdin.end(JSON.stringify({message:String(values.message||''),caption:String(values.caption||'')}));
 });
}
