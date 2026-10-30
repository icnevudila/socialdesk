export function metaConfig(env=process.env){const configured=Boolean(env.INSTAGRAM_ACCESS_TOKEN&&env.INSTAGRAM_USER_ID&&/^v\d+\.\d+$/.test(env.META_API_VERSION||''));return {configured,publishing:configured&&env.ENABLE_PUBLISHING==='true'}}
function config(a){return a||{token:process.env.INSTAGRAM_ACCESS_TOKEN,userId:process.env.INSTAGRAM_USER_ID,version:process.env.META_API_VERSION}}
export async function graph(endpoint,{method='GET',body,account,fetchImpl=fetch}={}){
 const a=config(account);if(!a.token||!a.userId||!/^v\d+\.\d+$/.test(a.version||''))throw Error('Meta bağlantısı yapılandırılmadı.');
 const host = a.token?.startsWith('IGQ') ? 'https://graph.instagram.com' : 'https://graph.facebook.com';
 const url=new URL(`${host}/${a.version}/${endpoint}`);
 const response=await fetchImpl(url,{method,headers:{Authorization:`Bearer ${a.token}`,...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{})},body:body?new URLSearchParams(body):undefined,signal:AbortSignal.timeout(25000)});
 let data;try{data=await response.json()}catch{throw Error('Meta yanıtı okunamadı.')}
 if(!response.ok||data.error)throw Error(`Meta isteği başarısız (${data.error?.code??response.status}). İzinleri ve hesap bağlantısını kontrol edin.`);return data;
}
export async function createContainer(post,account){return graph(`${config(account).userId}/media`,{account,method:'POST',body:post.kind==='reel'?{video_url:post.mediaUrl,media_type:'REELS',caption:post.caption}:{image_url:post.mediaUrl,caption:post.caption}})}
export async function containerStatus(id,account){return graph(`${encodeURIComponent(id)}?fields=status_code`,{account})}
export async function publishContainer(id,account){return graph(`${config(account).userId}/media_publish`,{account,method:'POST',body:{creation_id:id}})}
export async function profile(account){
 const fields = (account.token||'').startsWith('IGQ')
  ? 'id,user_id,username,account_type,media_count,followers_count,follows_count'
  : 'id,username,name,media_count,followers_count,follows_count,profile_picture_url';
 return graph(`${account.userId}?fields=${fields}`,{account});
}
export async function media(account){return graph(`${account.userId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=25`,{account})}
