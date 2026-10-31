import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export async function createIntegrations(dir, { seed = false } = {}){
 await mkdir(dir,{recursive:true});const file=path.join(dir,'integrations.json');let data;
 try{
  data=JSON.parse(await readFile(file,'utf8'));
 }catch(e){
  if(e.code!=='ENOENT')throw e;
  if(seed){
   try{
    const root=path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
    data=JSON.parse(await readFile(path.join(root,'data','integrations.json'),'utf8'));
   }catch{
    data={accounts:[],ai:{}};
   }
  }else{
   data={accounts:[],ai:{}};
  }
 }
 const envToken = (process.env.INSTAGRAM_ACCESS_TOKEN||'').trim();
 const envUserId = (process.env.INSTAGRAM_USER_ID||'').trim();
 const envVersion = (process.env.META_API_VERSION||'').trim() || 'v21.0';
 if(!data.accounts.length && envToken && envUserId) {
  data.accounts.push({
   id:'016c1c8f-1d53-4264-8668-87bacef67d0e',
   label:'@veriburada',
   userId:envUserId,
   token:envToken,
   version:envVersion,
   publishing:false,
   verifiedAt:null,
   username:'veriburada',
   loginType:envToken.startsWith('IGQ')?'instagram':'facebook'
  });
 }
 let queue=Promise.resolve();
 async function mutate(fn){const task=queue.then(async()=>{const next=structuredClone(data);const out=fn(next);await writeFile(file+'.tmp',JSON.stringify(next,null,2),{mode:0o600});await rename(file+'.tmp',file);data=next;return out});queue=task.catch(()=>{});return task}
 const hasPrivateSession=()=>existsSync(path.join(dir,'private-session.json'))||Boolean(process.env.IG_SESSIONID);
 const account=id=>{const a=data.accounts.find(a=>a.id===id);if(!a)throw Error('Instagram hesabını seçin.');return structuredClone(a)};
 const publicAccount=a=>({id:a.id,label:a.label,userId:String(a.userId||'').trim(),version:String(a.version||'').trim(),configured:Boolean(a.token&&a.userId&&/^v\d+\.\d+$/.test(String(a.version||'').trim())),verified:Boolean(a.verifiedAt),verifiedAt:a.verifiedAt||null,username:a.username||'',publishing:Boolean(a.publishing&&a.verifiedAt),hasToken:Boolean(a.token),hasPrivateSession:hasPrivateSession(),loginType:a.loginType||(a.token?.startsWith('IGQ')?'instagram':'facebook')});
 const defaultBaseUrl=((process.env.OMNISTUDIO_GATEWAY_URL?(process.env.OMNISTUDIO_GATEWAY_URL.trim().replace(/\/+$/,'')+'/v1'):'')||process.env.OPENAI_BASE_URL||'http://167.233.201.31:3456/v1').trim();
 const defaultKey=(process.env.CHATGPT_API_KEY||process.env.OMNISTUDIO_GATEWAY_TOKEN||process.env.OPENAI_API_KEY||'').trim();
 const defaultModel=(process.env.OPENAI_MODEL||'gpt-4o').trim();
 const defaultMode=(process.env.OMNISTUDIO_GATEWAY_URL||defaultBaseUrl.includes('3456'))?'chat':'responses';
 return {
  account,
  ai:()=>structuredClone({
   ...data.ai,
   apiKey:(data.ai.apiKey||defaultKey).trim(),
   model:(data.ai.model||defaultModel).trim(),
   baseUrl:(data.ai.baseUrl||defaultBaseUrl).trim(),
   mode:(data.ai.mode||defaultMode).trim(),
   imageModel:(data.ai.imageModel||'').trim(),
   provider:data.ai.provider||((data.ai.baseUrl||defaultBaseUrl).includes('3456')?'omnistudio':'custom')
  }),
  public:()=>({
   accounts:data.accounts.map(publicAccount),
   ai:{
    model:(data.ai.model||defaultModel).trim(),
    baseUrl:(data.ai.baseUrl||defaultBaseUrl).trim(),
    mode:(data.ai.mode||defaultMode).trim(),
    imageModel:(data.ai.imageModel||'').trim(),
    provider:data.ai.provider||((data.ai.baseUrl||defaultBaseUrl).includes('3456')?'omnistudio':'custom'),
    configured:Boolean(((data.ai.apiKey||defaultKey).trim())&&((data.ai.model||defaultModel).trim()))
   }
  }),
  async saveAccount(b){return mutate(d=>{let a=b.id?d.accounts.find(a=>a.id===b.id):null;if(b.id&&!a)throw Error('Hesap bulunamadı.');if(!a){a={id:randomUUID()};d.accounts.push(a)}const trimmedLabel=String(b.label||'').trim().slice(0,80);const trimmedUserId=String(b.userId||'').trim();const trimmedVer=String(b.version||'').trim();if(!trimmedLabel||!/^\d+$/.test(trimmedUserId)||!/^v\d+\.\d+$/.test(trimmedVer))throw Error('Hesap adı, sayısal Instagram ID ve API sürümü (vXX.0) gerekli.');if(a.userId&&String(a.userId)!==trimmedUserId)throw Error('Mevcut kaydın Instagram kimliği değiştirilemez. Farklı hesap için yeni kayıt ekleyin.');const loginType=b.loginType||a.loginType||(String(b.token||a.token).startsWith('IGQ')?'instagram':'facebook');if(!['instagram','facebook'].includes(loginType))throw Error('Geçersiz Instagram giriş türü.');const changed=Boolean(b.token&&b.token.trim()!==a.token)||a.userId!==trimmedUserId||a.version!==trimmedVer||loginType!==(a.loginType||(a.token?.startsWith('IGQ')?'instagram':'facebook'));Object.assign(a,{label:trimmedLabel,userId:trimmedUserId,version:trimmedVer,loginType,token:(b.token||a.token||'').trim()});if(changed){a.verifiedAt=null;a.publishing=false;a.username=''}return publicAccount(a)})},
  async verified(id,profile,expectedToken){return mutate(d=>{const a=d.accounts.find(a=>a.id===id);if(!a)throw Error('Hesap bulunamadı.');if(expectedToken&&a.token&&a.token!==expectedToken)throw Error('Bağlantı doğrulanırken token değişti. Yeniden doğrulayın.');if(profile.id&&a.userId&&String(profile.id)!==String(a.userId)&&String(profile.user_id)!==String(a.userId))throw Error('Token bu Instagram hesap kimliğiyle eşleşmiyor.');a.verifiedAt=new Date().toISOString();a.username=profile.username||a.label?.replace(/^@/,'')||'veriburada';a.publishing=true;return publicAccount(a)})},
  async disconnect(id){return mutate(d=>{const a=d.accounts.find(a=>a.id===id);if(!a)throw Error('Hesap bulunamadı.');a.token='';a.verifiedAt=null;a.publishing=false;return publicAccount(a)})},
  async invalidate(id){return mutate(d=>{const a=d.accounts.find(a=>a.id===id);if(a){if(!hasPrivateSession()){a.verifiedAt=null;a.publishing=false}}})},
  async publishing(id,value){return mutate(d=>{const a=d.accounts.find(a=>a.id===id);if(!a||!a.verifiedAt)throw Error('Önce hesabı doğrulayın.');a.publishing=value===true;return publicAccount(a)})},
  async saveAI(b){return mutate(d=>{
   const u=new URL((b.baseUrl||defaultBaseUrl).trim());
   if(u.username||u.password||u.search||u.hash||!['http:','https:'].includes(u.protocol))throw Error('Geçerli bir HTTP veya HTTPS servis adresi gerekli.');
   const trimmedModel=String(b.model||'').trim();
   if(!trimmedModel)throw Error('Model adı gerekli.');
   const currentBase=d.ai.baseUrl||defaultBaseUrl;if(!b.apiKey&&new URL(currentBase).origin!==u.origin)throw Error('Farklı servis adresi için API anahtarını yeniden girin.');
   if(!['responses','chat'].includes(b.mode))throw Error('Geçersiz AI protokolü.');
   d.ai={
    apiKey:(b.apiKey||d.ai.apiKey||'').trim(),
    model:trimmedModel.slice(0,150),
    baseUrl:u.href.replace(/\/$/,''),
    mode:b.mode,
    imageModel:String(b.imageModel||'').trim().slice(0,150),
    provider:b.provider||(u.href.includes('3456')||u.href.includes('167.233.201.31')?'omnistudio':'custom')
   };
   return {ok:true}
  })}
 }
}
