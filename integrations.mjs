import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
export async function createIntegrations(dir){
 await mkdir(dir,{recursive:true});const file=path.join(dir,'integrations.json');let data;
 try{data=JSON.parse(await readFile(file,'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;data={accounts:[],ai:{}}}
 if(!data.accounts.length&&process.env.INSTAGRAM_ACCESS_TOKEN&&process.env.INSTAGRAM_USER_ID)data.accounts.push({id:'env',label:'Instagram',userId:process.env.INSTAGRAM_USER_ID,token:process.env.INSTAGRAM_ACCESS_TOKEN,version:process.env.META_API_VERSION,publishing:process.env.ENABLE_PUBLISHING==='true'});
 let queue=Promise.resolve();
 async function mutate(fn){const task=queue.then(async()=>{const next=structuredClone(data);const out=fn(next);await writeFile(file+'.tmp',JSON.stringify(next,null,2),{mode:0o600});await rename(file+'.tmp',file);data=next;return out});queue=task.catch(()=>{});return task}
 const account=id=>{const a=data.accounts.find(a=>a.id===id);if(!a)throw Error('Instagram hesabını seçin.');return structuredClone(a)};
 const publicAccount=a=>({id:a.id,label:a.label,userId:a.userId,version:a.version,configured:Boolean(a.token&&a.userId&&/^v\d+\.\d+$/.test(a.version||'')),verified:Boolean(a.verifiedAt),verifiedAt:a.verifiedAt||null,username:a.username||'',publishing:Boolean(a.publishing&&a.verifiedAt),hasToken:Boolean(a.token)});
 const defaultBaseUrl=(process.env.OMNISTUDIO_GATEWAY_URL?(process.env.OMNISTUDIO_GATEWAY_URL.replace(/\/+$/,'')+'/v1'):'')||process.env.OPENAI_BASE_URL||'http://167.233.201.31:3456/v1';
 const defaultKey=process.env.CHATGPT_API_KEY||process.env.OMNISTUDIO_GATEWAY_TOKEN||process.env.OPENAI_API_KEY||'';
 const defaultModel=process.env.OPENAI_MODEL||'gpt-4o';
 const defaultMode=(process.env.OMNISTUDIO_GATEWAY_URL||defaultBaseUrl.includes('3456'))?'chat':'responses';
 return {
  account,
  ai:()=>structuredClone({
   ...data.ai,
   apiKey:data.ai.apiKey||defaultKey,
   model:data.ai.model||defaultModel,
   baseUrl:data.ai.baseUrl||defaultBaseUrl,
   mode:data.ai.mode||defaultMode,
   imageModel:data.ai.imageModel||'dall-e-3',
   provider:data.ai.provider||((data.ai.baseUrl||defaultBaseUrl).includes('3456')?'omnistudio':'custom')
  }),
  public:()=>({
   accounts:data.accounts.map(publicAccount),
   ai:{
    model:data.ai.model||defaultModel,
    baseUrl:data.ai.baseUrl||defaultBaseUrl,
    mode:data.ai.mode||defaultMode,
    imageModel:data.ai.imageModel||'dall-e-3',
    provider:data.ai.provider||((data.ai.baseUrl||defaultBaseUrl).includes('3456')?'omnistudio':'custom'),
    configured:Boolean((data.ai.apiKey||defaultKey)&&(data.ai.model||defaultModel))
   }
  }),
  async saveAccount(b){return mutate(d=>{let a=b.id?d.accounts.find(a=>a.id===b.id):null;if(b.id&&!a)throw Error('Hesap bulunamadı.');if(!a){a={id:randomUUID()};d.accounts.push(a)}if(!String(b.label||'').trim()||!/^\d+$/.test(String(b.userId||''))||!/^v\d+\.\d+$/.test(b.version||''))throw Error('Hesap adı, sayısal Instagram ID ve API sürümü (vXX.0) gerekli.');const changed=Boolean(b.token&&b.token!==a.token)||a.userId!==b.userId||a.version!==b.version;Object.assign(a,{label:String(b.label).trim().slice(0,80),userId:String(b.userId),version:b.version,token:b.token||a.token||''});if(changed){a.verifiedAt=null;a.publishing=false;a.username=''}return publicAccount(a)})},
  async verified(id,profile){return mutate(d=>{const a=d.accounts.find(a=>a.id===id);if(!a)throw Error('Hesap bulunamadı.');if(String(profile.id)!==String(a.userId)&&String(profile.user_id)!==String(a.userId))throw Error('Token bu Instagram hesap kimliğiyle eşleşmiyor.');a.verifiedAt=new Date().toISOString();a.username=profile.username||a.label;return publicAccount(a)})},
  async publishing(id,value){return mutate(d=>{const a=d.accounts.find(a=>a.id===id);if(!a||!a.verifiedAt)throw Error('Önce hesabı doğrulayın.');a.publishing=value===true;return publicAccount(a)})},
  async saveAI(b){return mutate(d=>{
   const u=new URL(b.baseUrl||defaultBaseUrl);
   if(u.username||u.password||u.search||u.hash||!['http:','https:'].includes(u.protocol))throw Error('Geçerli bir HTTP veya HTTPS servis adresi gerekli.');
   if(!String(b.model||'').trim())throw Error('Model adı gerekli.');
   if(!['responses','chat'].includes(b.mode))throw Error('Geçersiz AI protokolü.');
   d.ai={
    apiKey:b.apiKey||d.ai.apiKey||'',
    model:String(b.model).trim().slice(0,150),
    baseUrl:u.href.replace(/\/$/,''),
    mode:b.mode,
    imageModel:String(b.imageModel||'dall-e-3').trim().slice(0,150),
    provider:b.provider||(u.href.includes('3456')||u.href.includes('167.233.201.31')?'omnistudio':'custom')
   };
   return {ok:true}
  })}
 }
}
