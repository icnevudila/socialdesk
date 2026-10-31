import {dayInZone,zonedInputToISO,addDays} from './public/time.js';

// A starting experiment, not a claim about Instagram's ranking algorithm.
export function balancedSchedule(posts,accountId,{now=new Date(),slots=['12:30','19:30'],weekdays=[0,1,2,3,4,5,6]}={}){
 if(!accountId||!slots.length||slots.some(s=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(s))||!weekdays.length||weekdays.some(d=>!Number.isInteger(d)||d<0||d>6))throw Error('Geçerli hesap, yayın günü ve saatleri gerekli.');
 const pending=posts.filter(p=>p.accountId===accountId&&['scheduled','planned'].includes(p.status)).sort((a,b)=>Date.parse(a.scheduledAt)-Date.parse(b.scheduledAt));
 const reels=pending.filter(p=>p.kind==='reel'),images=pending.filter(p=>p.kind!=='reel');
 const occupied=new Set(posts.filter(p=>p.accountId===accountId&&['published','processing','reconciliation_required'].includes(p.status)&&p.scheduledAt).map(p=>dayInZone(p.publishedAt||p.scheduledAt)));
 let day=dayInZone(now),index=0;const changes=[];
 for(let guard=0;(images.length||reels.length)&&guard<730;guard++,day=addDays(day,1)){
  if(!weekdays.includes(new Date(day+'T12:00:00Z').getUTCDay())||occupied.has(day))continue;
  const post=(index%3===1&&reels.length?reels:images.length?images:reels)[0];
  const time=post.kind==='reel'?slots.at(-1):slots[index%slots.length];
  const scheduledAt=zonedInputToISO(day+'T'+time);
  if(Date.parse(scheduledAt)<=now.getTime()+2*60*60*1000)continue;
  (post.kind==='reel'?reels:images).shift();
  changes.push({id:post.id,previousScheduledAt:post.scheduledAt,scheduledAt,kind:post.kind});index++;
 }
 if(images.length||reels.length)throw Error('İçeriklerin tamamı iki yıllık plana sığmadı.');
 return {dailyLimit:1,mode:'initial_experiment',confidence:'insufficient_account_history',timeZone:'Europe/Istanbul',changes};
}
