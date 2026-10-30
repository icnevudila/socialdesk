import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {once} from 'node:events';
export async function startFakeProviders(){const calls=[];let invalidAuth=false;const png=await readFile(new URL('../../public/logo.png',import.meta.url));const server=http.createServer(async(req,res)=>{let body='';for await(const c of req)body+=c;const u=new URL(req.url,'http://test');calls.push({method:req.method,path:u.pathname,query:u.search,body:body?body:null});res.setHeader('Content-Type','application/json');let data;
 if(u.pathname==='/health')data={status:'ok',testFixture:true};
 else if(u.pathname==='/v1/chat/completions')data={id:'qa-text',choices:[{message:{role:'assistant',content:'Örnek test yanıtı. Bu içerik yalnızca yerel QA ortamında üretildi.'}}]};
 else if(u.pathname==='/v1/responses')data={id:'qa-text',object:'response',status:'completed',output:[{type:'message',role:'assistant',content:[{type:'output_text',text:'Örnek test yanıtı.',annotations:[]}]}]};
 else if(u.pathname==='/v1/images/generations')data={data:[{b64_json:png.toString('base64')}]};
 else if(u.pathname.startsWith('/graph/')){if(invalidAuth){res.statusCode=400;res.end(JSON.stringify({error:{code:190,error_subcode:463,message:'Expired fixture token'}}));return}const p=u.pathname.replace(/^\/graph\/v\d+\.\d+\//,'');
 if(p==='123'&&req.method==='GET')data={id:'123',username:'qa_test',media_count:1,followers_count:10,follows_count:2};
 else if(p==='123/media'&&req.method==='GET')data={data:[{id:'901',caption:'Örnek test gönderisi',media_type:'IMAGE',timestamp:'2026-10-31T10:00:00Z',like_count:2,comments_count:1,permalink:'https://www.instagram.com/p/QA_ONLY/'}]};
 else if(p==='123/media'&&req.method==='POST')data={id:'701'};
 else if(p==='701')data={id:'701',status_code:'FINISHED'};
 else if(p==='123/media_publish')data={id:'801'};
 else if(p==='801')data={id:'801',permalink:'https://www.instagram.com/p/QA_ONLY/'};
 else if(p.endsWith('/insights'))data={data:[{name:u.searchParams.get('metric'),total_value:{value:5}}]};
 else if(p==='901/comments')data={data:[{id:'902',text:'Test kullanıcı yorumu',username:'qa_commenter',timestamp:'2026-10-31T10:00:00Z'}]};
 else if(p==='902/replies')data={id:'903'};
 else{res.statusCode=501;data={error:{code:501,message:'Unimplemented fake route'}}}
 }else{res.statusCode=501;data={error:'Unimplemented fake route'}}res.end(JSON.stringify(data))});server.listen(0,'127.0.0.1');await once(server,'listening');return {server,calls,setAuthError:value=>{invalidAuth=value},url:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(resolve=>server.close(resolve))}}
