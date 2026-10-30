import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createIntegrations} from '../integrations.mjs';
import {profile,media,graph} from '../meta.mjs';
import {checkAiHealth} from '../ai.mjs';
const root=path.resolve(import.meta.dirname,'..');
const integrations=await createIntegrations(path.join(root,'data'));
const report={checkedAt:new Date().toISOString(),mode:'READ_ONLY_NO_GENERATION_NO_PUBLISH_NO_COMMENT',accounts:[],ai:null};
for(const publicAccount of integrations.public().accounts){const account=integrations.account(publicAccount.id);const r={accountId:account.id,profile:null,media:null,insights:null};
 try{const p=await profile(account,{basic:true});r.profile={ok:true,identityMatches:String(p.id)===String(account.userId)||String(p.user_id)===String(account.userId),username:p.username}}catch(e){r.profile={ok:false,error:e.message}}
 if(r.profile.ok){try{const m=await media(account);r.media={ok:true,count:m.data?.length||0}}catch(e){r.media={ok:false,error:e.message}}try{const m=await graph(`${account.userId}/insights?metric=reach&period=day&metric_type=total_value`,{account});r.insights={ok:true,metrics:m.data?.map(x=>x.name)||[]}}catch(e){r.insights={ok:false,error:e.message}}}
 report.accounts.push(r)
}
try{const ai=await checkAiHealth(integrations.ai());report.ai={reachable:ai.ok===true,status:ai.status,claim:'Health/models read only; generation not tested'}}catch(e){report.ai={reachable:false,error:e.message}}
await mkdir(path.join(root,'artifacts'),{recursive:true});await writeFile(path.join(root,'artifacts/live-readonly-audit.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
