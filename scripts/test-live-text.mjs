import {writeFile} from 'node:fs/promises';
import {createIntegrations} from '../integrations.mjs';
import {generateText} from '../ai.mjs';
if(!process.argv.includes('--run-one'))throw Error('Tek gerçek metin isteği için --run-one gerekli.');
const i=await createIntegrations(new URL('../data',import.meta.url).pathname.replace(/^\/(\w:)/,'$1'));
const report={checkedAt:new Date().toISOString(),mode:'ONE_LIVE_TEXT_REQUEST_NO_PUBLISH',ok:false};
try{const r=await generateText(i.ai(),{task:'caption',brief:'Tek cümlelik bağlantı testi. Yalnızca Socialdesk bağlantı testi yaz. Hashtag ekleme.',brand:{name:'Socialdesk'}},{timeout:20000,maxRetries:0});report.ok=true;report.model=r.model;report.characters=r.text.length;report.preview=r.text.slice(0,120)}catch(e){report.error=e.message}
await writeFile(new URL('../artifacts/live-text-audit.json',import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
