// Vercel serves assets; one persistent backend owns auth, data, media and jobs.
export async function proxyCloudRequest(req,res,{baseUrl=process.env.SOCIALDESK_BACKEND_URL,token=process.env.SOCIALDESK_BRIDGE_TOKEN,fetchImpl=fetch}={}){
  let target;
  try{target=new URL(baseUrl);if(target.protocol!=='https:'||target.username||target.password||!token||token.length<32)throw Error();}
  catch{res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'Kalıcı cloud uygulaması yapılandırılmadı.'}));return;}
  target.pathname=new URL(req.url,'http://local').pathname;target.search=new URL(req.url,'http://local').search;
  const headers={'X-Socialdesk-Bridge':token,'X-Forwarded-Host':req.headers.host||'', 'X-Forwarded-Proto':'https'};
  for(const name of ['authorization','cookie','content-type','range','origin','sec-fetch-site','x-socialdesk-auth'])if(req.headers[name])headers[name]=req.headers[name];
  try{
    const chunks=[];let bytes=0;
    if(!['GET','HEAD'].includes(req.method))for await(const chunk of req){bytes+=chunk.length;if(bytes>50*1024*1024)throw Error('size');chunks.push(chunk);}
    const result=await fetchImpl(target,{method:req.method,headers,body:chunks.length?Buffer.concat(chunks):undefined,signal:AbortSignal.timeout(120000),redirect:'manual'});
    const outgoing={'Cache-Control':'no-store'};
    for(const name of ['content-type','content-range','accept-ranges','content-disposition'])if(result.headers.has(name))outgoing[name]=result.headers.get(name);
    const cookies=result.headers.getSetCookie?.()||[];if(cookies.length)outgoing['Set-Cookie']=cookies;
    const buffer=Buffer.from(await result.arrayBuffer());if(req.method==='HEAD'&&result.headers.has('content-length'))outgoing['Content-Length']=result.headers.get('content-length');else outgoing['Content-Length']=buffer.length;res.writeHead(result.status,outgoing);res.end(req.method==='HEAD'?undefined:buffer);
  }catch{if(!res.headersSent)res.writeHead(502,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'Kalıcı cloud uygulamasına ulaşılamadı. Yerel veya örnek veri gösterilmedi.'}));}
}
