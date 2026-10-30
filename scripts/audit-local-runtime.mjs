import {readFile,writeFile,readdir} from 'node:fs/promises';
import path from 'node:path';
const base='http://127.0.0.1:4317/api/';
const report={checkedAt:new Date().toISOString(),mode:'LOCAL_RUNTIME_AND_REAL_READS_ONLY',checks:{}};let token;
async function request(route,method='GET',body){const response=await fetch(base+route,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});return {status:response.status,data:await response.json()}}
report.checks.unauthenticated=(await request('workspace')).status;
const login=await request('auth/login','POST',{password:process.env.ADMIN_PASSWORD});if(login.status!==200)throw Error('Yerel yönetim girişi doğrulanamadı.');token=login.data.token;report.checks.login=login.status;
const w=await request('workspace');report.checks.workspace={status:w.status,posts:w.data.posts.length,statuses:w.data.posts.reduce((acc,p)=>(acc[p.status]=(acc[p.status]||0)+1,acc),{}),runtime:w.data.runtime};
for(const a of w.data.integrations.accounts){const r=await request('analytics?accountId='+encodeURIComponent(a.id));report.checks.analytics={status:r.status,...(r.status===200?{username:r.data.profile.username,followers:r.data.profile.followers_count??null,mediaReturned:r.data.media.length}:{error:r.data.error})};const insight=await request('insights?accountId='+encodeURIComponent(a.id));report.checks.insights={status:insight.status,metrics:insight.data.metrics?.map(m=>({name:m.name,ok:!m.error}))}}
const priv=await request('private/status');report.checks.privateAPI={status:priv.status,installed:priv.data.installed,sessionSaved:priv.data.sessionSaved};
const health=await request('ai/health');report.checks.aiHealth={status:health.status,reachable:health.data.ok===true,...(health.data.error?{error:health.data.error}:{})};
const backups=(await readdir('artifacts')).filter(p=>p.startsWith('audit-backup-')).sort();const before=JSON.parse(await readFile(path.join('artifacts',backups.at(-1),'workspace.json'),'utf8'));report.checks.originalDataPreserved={posts:JSON.stringify(before.posts)===JSON.stringify(w.data.posts),brand:JSON.stringify(before.brand)===JSON.stringify(w.data.brand),opportunities:JSON.stringify(before.opportunities)===JSON.stringify(w.data.opportunities)};
await request('auth/logout','POST',{});await writeFile('artifacts/local-runtime-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
