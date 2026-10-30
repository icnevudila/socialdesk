import {startFakeProviders} from '../tests/support/fake-providers.mjs';
import {mkdtemp,readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');await mkdir(path.join(root,'artifacts'),{recursive:true});const dir=await mkdtemp(path.join(root,'artifacts','qa-runtime-'));const fake=await startFakeProviders();
const source=JSON.parse(await readFile(path.join(root,'data/workspace.json'),'utf8'));const workspace={posts:source.posts.slice(0,12).map(p=>({...p,accountId:'qa-account',status:'planned'})),opportunities:[],events:[],brand:{...source.brand,name:'QA · Örnek çalışma alanı'}};await writeFile(path.join(dir,'workspace.json'),JSON.stringify(workspace));await writeFile(path.join(dir,'integrations.json'),JSON.stringify({accounts:[{id:'qa-account',label:'Örnek test hesabı',userId:'123',token:'fixture-token',version:'v25.0',loginType:'instagram',verifiedAt:new Date().toISOString(),username:'qa_test',publishing:true}],ai:{baseUrl:fake.url+'/v1',apiKey:'fixture-key',model:'qa-model',imageModel:'qa-image',mode:'chat',provider:'custom'}}));
const child=spawn(process.execPath,['--watch','--watch-preserve-output','--import','./tests/support/redirect-providers.mjs','server.mjs'],{cwd:root,env:{...process.env,PORT:'14319',SOCIALDESK_DATA_DIR:dir,ADMIN_PASSWORD:'qa-test-only-password',SOCIALDESK_TEST_GATEWAY_URL:fake.url,INSTAGRAM_ACCESS_TOKEN:'',INSTAGRAM_USER_ID:'',VERCEL:''},stdio:'inherit'});
console.log('QA only: http://127.0.0.1:14319 (real providers blocked)');
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{child.kill();fake.server.close();process.exit(0)});child.on('exit',()=>{fake.server.close();process.exit(0)});
