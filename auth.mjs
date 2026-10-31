import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
const revoked=new Set();
const TTL=8*60*60*1000;
export function getAdminPassword(){return (process.env.ADMIN_PASSWORD||'').trim()}
export function getAdminUsername(){return (process.env.ADMIN_USERNAME||'admin').trim().toLowerCase()}
export function usernameMatches(input){if(!input)return true;const norm=String(input).trim().toLowerCase().replace(/^@/,'');return ['admin','veriburada',getAdminUsername()].includes(norm)}
function digest(password,value){return createHmac('sha256',process.env.AUTH_SECRET||password).update('socialdesk-session-v2:'+value).digest('hex')}
export function computeAuthToken(password,{now=Date.now(),nonce=randomBytes(24).toString('hex')}={}){if(!password)throw Error('ADMIN_PASSWORD yapılandırılmadı.');const payload=`${now+TTL}.${nonce}`;return `${payload}.${digest(password,payload)}`}
export function passwordMatches(input){const a=Buffer.from(String(input||''));const b=Buffer.from(getAdminPassword());return b.length>0&&a.length===b.length&&timingSafeEqual(a,b)}
export function verifyAuthToken(token,{now=Date.now()}={}){const password=getAdminPassword();if(!password||revoked.has(String(token)))return false;const match=String(token||'').match(/^(\d{13})\.([a-f0-9]{48})\.([a-f0-9]{64})$/);if(!match)return false;const expiry=Number(match[1]);if(expiry<=now||expiry>now+TTL+1000)return false;const expected=digest(password,`${match[1]}.${match[2]}`);return timingSafeEqual(Buffer.from(match[3]),Buffer.from(expected))}
export function isAuthenticated(req){const headers=req.headers||{};const bearer=String(headers.authorization||'').replace(/^Bearer /,'');const cookie=String(headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('socialdesk_auth='))?.slice('socialdesk_auth='.length);return [cookie,headers['x-socialdesk-auth'],bearer].some(token=>verifyAuthToken(token))}
export function authCookie(token,{secure=false}={}){return `socialdesk_auth=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${token?Math.floor(TTL/1000):0}${secure?'; Secure':''}`}

export function revokeSession(req){const headers=req.headers||{};const tokens=[String(headers.authorization||'').replace(/^Bearer /,''),headers['x-socialdesk-auth'],String(headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('socialdesk_auth='))?.slice('socialdesk_auth='.length)];for(const token of tokens)if(token)revoked.add(String(token));if(revoked.size>10000)for(const token of revoked)if(Number(token.split('.')[0])<=Date.now())revoked.delete(token)}
