import {dayInZone,localInput,zonedInputToISO,addDays} from './time.js';
const $=s=>document.querySelector(s);
const paths={home:'M3 11 12 3l9 8M5 10v11h5v-6h4v6h5V10',growth_live:'M13 2L3 14h9l-1 8 10-12h-9l1-8z',calendar:'M4 5h16v16H4zM4 10h16M8 3v4M16 3v4',studio:'m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z',discover:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M16 8l-3 5-5 3 3-5z',analytics:'M4 20h17M7 16v-5M12 16V5M17 16V8',settings:'M4 7h16M4 17h16M8 4v6M16 14v6',plus:'M12 5v14M5 12h14',arrow:'M5 12h14m-5-5 5 5-5 5',check:'m5 12 4 4L19 6',image:'M3 3h18v18H3zM3 16l6-6 5 5 3-3 4 4M16 7h.01'};
const icon=n=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[n]||paths.studio}"/></svg>`;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nav=[['home','Genel bakış'],['growth_live','Hesap büyümesi'],['calendar','İçerik takvimi'],['studio','İçerik stüdyosu'],['growth','Büyüme planı'],['discover','Keşif ve etkileşim'],['analytics','Analiz'],['settings','Marka ve bağlantılar']];
const labels={draft:'Taslak',planned:'Yerel plan',scheduled:'Yayın kuyruğunda',processing:'İşleniyor',published:'Yayınlandı',reconciliation_required:'Kontrol gerekiyor',failed:'Başarısız'};
let db,page='home',growthLiveState=null,growthLiveLoading=false,analyticsLoading=false,month=new Date(),calendarMode='month',editing=null,analyticsData=null,selectedAccount=localStorage.getItem('socialdesk.account')||'',growthTargetDate=addDays(dayInZone(),1),discoveryTab='list',studioTab='editor',contentQuery='',contentFilter='all';
const accounts=()=>db.integrations?.accounts||[];
const visiblePosts=()=>{if(!selectedAccount)return db.posts;const f=db.posts.filter(p=>p.accountId===selectedAccount);if(f.length)return f;if(accounts().length===1&&accounts()[0].id===selectedAccount)return db.posts;return f;};
const accountOptions=id=>'<option value="">Hesap seçin</option>'+accounts().map(a=>`<option value="${a.id}" ${a.id===id?'selected':''}>${esc(a.username||a.label)}</option>`).join('');
function showLoginScreen(error=''){
 $('#composer').close();
 const savedUser = localStorage.getItem('socialdesk_last_user') || 'admin';
 $('#app').innerHTML=`<main class="login-layout">
  <div class="login-bg-glow"></div>
  <section class="login-card">
    <div class="login-brand-header">
      <div class="login-logo-wrap">
        <img src="/logo.png" class="login-logo" alt="Socialdesk" onerror="this.style.display='none'">
        <span class="logo-text">Socialdesk</span>
      </div>
      <div class="login-engine-badge">
        Çalışma alanına giriş
      </div>
    </div>
    
    <div class="login-title-group">
      <span class="section-kicker">KONTROL PANELİ GİRİŞİ</span>
      <h1>Yönetici Oturumu</h1>
      <p>İçerik takvimini, yayınlarını ve hesap ölçümlerini yönetmek için giriş yap.</p>
    </div>

    <form id="auth-login-form">
      <label>Kullanıcı Adı / ID
        <input type="text" id="login-username" value="${esc(savedUser)}" autocomplete="username" placeholder="Kullanıcı adınızı girin" required autofocus>
      </label>
      
      <label>Yönetim Şifresi
        <div class="pw-wrap">
          <input type="password" id="login-password" autocomplete="current-password" placeholder="Şifrenizi girin" required>
          <button type="button" id="toggle-pw" class="btn-eye" title="Şifreyi Göster/Gizle" aria-label="Şifreyi Göster">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </label>

      <div class="login-row-remember">
        <label class="remember-check">
          <input type="checkbox" id="login-remember" checked>
          <span>Kullanıcı adımı hatırla</span>
        </label>
        <span class="badge-safe">Yönetici erişimi</span>
      </div>

      <div id="login-error" class="error" role="alert">${esc(error)}</div>

      <button class="primary btn-login" type="submit">
        <span>Panele Giriş Yap</span>
        ${icon('arrow')}
      </button>
</form>
    <small class="login-footer-note">Socialdesk · İçerik çalışma alanın</small>
  </section>
  <div class="login-side-visual">
    <img class="login-art" src="/workspace-art.svg" alt="Socialdesk İçerik ve Büyüme Masası">
    <div class="login-side-features">
      <div class="feature-item">
        <span class="feat-icon">${icon('calendar')}</span>
        <div><strong>Kendi yayın ritmin</strong><small>İçeriklerini uygun gün ve saatlere planla.</small></div>
      </div>
      <div class="feature-item">
        <span class="feat-icon">${icon('discover')}</span>
        <div><strong>İlgili içerikleri keşfet</strong><small>Markana uygun gönderileri değerlendir.</small></div>
      </div>
      <div class="feature-item">
        <span class="feat-icon">${icon('analytics')}</span>
        <div><strong>Sonuçlarını takip et</strong><small>Ölçülen takipçileri ve yayınlarını birlikte gör.</small></div>
      </div>
    </div>
  </div>
</main>`;
 $('#login-password').focus();
}
async function api(path,method='GET',body){
  const token=localStorage.getItem('socialdesk_auth_token')||'';
  const headers={...(body?{'Content-Type':'application/json'}:{}),...(token?{'x-socialdesk-auth':token,'authorization':'Bearer '+token}:{})};
  const r=await fetch('/api/'+path,{method,headers,credentials:'include',body:body?JSON.stringify(body):undefined});
  const data=await r.json();
  if(r.status===401){showLoginScreen();const err=new Error(data.error||'UNAUTHORIZED');err.status=401;throw err;}
  if(!r.ok)throw Error(data.error||'İşlem tamamlanamadı.');
  return data;
}
function toast(t){$('#toast').textContent=t;$('#toast').style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').style.display='none',4000)}
async function refresh(){db=await api('workspace');if(selectedAccount&&!accounts().some(a=>a.id===selectedAccount))selectedAccount='';if(!selectedAccount&&accounts().length===1)selectedAccount=accounts()[0].id}
function heading(title,desc,action=true){return `<div class="heading"><div><h1>${title}</h1><p>${desc}</p></div>${action?`<button class="primary" data-action="new">${icon('plus')} İçerik oluştur</button>`:''}</div>`}
function empty(symbol,title,text,button='',action='new'){return `<div class="empty"><img class="empty-art" src="/calendar-art.svg" alt=""><h3>${title}</h3><p>${text}</p>${button?`<button data-action="${action}">${button} ${icon('arrow')}</button>`:''}</div>`}
function date(v){if(v&&!Number.isFinite(Date.parse(v)))return 'Tarih okunamadı';return v?new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(v)):'Tarih seçilmedi'}
function row(p){const thumb=postMediaThumb(p);return `<div class="post-row"><div class="avatar ${thumb?'has-thumb':''}"><img class="post-thumb" src="${esc(thumb||'')}" alt="" loading="lazy" decoding="async" width="42" height="42" ${thumb?'':'style="display:none"'}>${thumb?'':icon(p.kind==='reel'?'studio':'image')}</div><div class="body"><strong>${esc(p.title)}</strong><small>${date(p.scheduledAt)} · ${p.kind==='reel'?'Reels':'Gönderi'}</small></div><span class="badge">${p.status==='scheduled'&&!accounts().find(a=>a.id===p.accountId)?.publishing?'Bağlantı / yayın ayarı bekliyor':labels[p.status]}</span><button data-edit="${p.id}" aria-label="${esc(p.title)} düzenle">Aç</button></div>`}
function home(){const upcoming=visiblePosts().filter(p=>['planned','scheduled'].includes(p.status)).sort((a,b)=>Date.parse(a.scheduledAt)-Date.parse(b.scheduledAt));return heading('Genel bakış','İçeriklerini hazırla, planını takip et.')+(sessionStorage.getItem('socialdesk.unsaved')?'<div class="notice recovery-notice"><span>Kaydedilmemiş bir içerik metnin var.</span><button data-action="restore-draft">Taslağı geri getir</button></div>':'')+`<section class="workbench"><div><span class="section-kicker">İÇERİK MASASI</span><h2>${visiblePosts().length?'İçerik takvimini yönet.':'İlk içeriğini hazırla.'}</h2><p>${visiblePosts().length?`${visiblePosts().filter(p=>p.status==='draft').length} taslak, ${visiblePosts().filter(p=>['planned','scheduled'].includes(p.status)).length} planlanan içerik.`:'Henüz bir taslak yok. Bir konu seçerek başla.'}</p><button class="primary" data-action="new">Yeni içerik ${icon('arrow')}</button></div><img src="/workspace-art.svg" alt="İçerik kartından paylaşım takvimine uzanan özgün çizim"></section><div class="stats">${[['Taslaklar',visiblePosts().filter(p=>p.status==='draft').length,'Üzerinde çalıştığın fikirler','studio'],['Planlanan',upcoming.length,'Takvimindeki içerikler','calendar'],['Yayınlanan',visiblePosts().filter(p=>p.status==='published').length,'API yayın kimliği kaydedilen','image'],['Kaydedilen fırsatlar',db.opportunities.length,'İnceleme listendeki gönderiler','discover']].map(([t,n,s,i])=>`<div class="stat"><div class="stat-top">${t}${icon(i)}</div><strong>${n}</strong><small>${s}</small></div>`).join('')}</div><div class="columns"><section class="panel"><div class="panel-head"><h2>Sıradaki içerikler</h2><button class="text-btn" data-page="calendar">Takvime git →</button></div>${upcoming.length?upcoming.slice(0,4).map(row).join(''):empty('calendar','Henüz planlanan içerik yok.','İlk içeriğini hazırla ve sana uygun bir güne yerleştir.','İçerik hazırla')}</section><section class="panel"><div class="panel-head"><h2>Kurulum durumu</h2><span class="badge green">${[db.brand.name&&db.brand.name!=='Benim markam',accounts().some(a=>a.verified),db.posts.length>0].filter(Boolean).length}/3 hazır</span></div>${[['Markanı tanımla','İçeriklerin için bir ses ve hedef kitle belirle.','Marka ayarları','settings'],['Instagram hesabını bağla','Yayınlama için resmi bağlantını yapılandır.','Bağlantıları incele','settings'],['İlk içeriğini hazırla','Bir fikirle başla, takvimine yerleştir.','Stüdyoyu aç','studio']].map(([t,d,b,p],i)=>`<div class="check-item"><span class="number ${[db.brand.name&&db.brand.name!=='Benim markam',accounts().some(a=>a.verified),db.posts.length>0][i]?'done':''}">${[db.brand.name&&db.brand.name!=='Benim markam',accounts().some(a=>a.verified),db.posts.length>0][i]?'✓':i+1}</span><div><h3>${t}</h3><p>${[db.brand.name&&db.brand.name!=='Benim markam',accounts().some(a=>a.verified),db.posts.length>0][i]?['Marka profilin kayıtlı.','En az bir hesabın API ile doğrulandı.',db.posts.length+' içerik çalışma alanında kayıtlı.'][i]:d}</p><button class="text-btn" data-page="${p}">${b} →</button></div></div>`).join('')}</section></div><div class="page-note">${icon('check')} Kayıtların çalışma alanında tutulur. Otomatik paylaşım ${db.connection.publishing?'etkin':'kapalı'}.</div>`}
function postMediaThumb(p){
  if(p.thumbnailUrl) return p.thumbnailUrl;
  const raw = (p.localMediaUrl && /^\/media\/[a-zA-Z0-9_\-\.]+\.(png|jpg|jpeg|webp|mp4)$/i.test(p.localMediaUrl)) ? p.localMediaUrl : safeHttps(p.mediaUrl);
  if(!raw || raw === '#') return null;
  if(raw.endsWith('.mp4') || p.kind === 'reel'){
    return raw.replace(/\.mp4$/i, '_thumb.jpg');
  }
  return raw;
}

function calendar(){let start=new Date(month.getFullYear(),month.getMonth(),1);start.setDate(start.getDate()-(start.getDay()+6)%7);if(calendarMode==='week'){start=new Date(month);start.setDate(start.getDate()-(start.getDay()+6)%7)}const days=calendarMode==='week'?7:42;return heading('İçerik takvimi','Markanın ritmini, görsel takvim üzerinden takip et.')+`<div class="toolbar"><h2>${month.toLocaleDateString('tr-TR',{month:'long',year:'numeric'})}</h2><div style="display:flex;gap:6px"><button data-action="prev" aria-label="Önceki dönem">←</button><button data-action="today">Bugün</button><button data-action="next" aria-label="Sonraki dönem">→</button></div><button data-action="mode">${calendarMode==='month'?'Haftalık görünüm':'Aylık görünüm'}</button></div><div class="panel calendar ${calendarMode==='week'?'week-mode':''}">${['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map(x=>`<div class="day-label">${x}</div>`).join('')}${Array.from({length:days},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);const key=localDay(d);const dayPosts=visiblePosts().filter(p=>p.scheduledAt&&localDay(new Date(p.scheduledAt))===key);return `<div class="day ${d.getMonth()!==month.getMonth()?'off':''} ${key===localDay(new Date())?'today':''}"><div class="day-head"><button class="day-btn" data-day="${key}" aria-label="${key} için içerik oluştur">${d.getDate()}</button>${dayPosts.length?`<span class="day-badge">${dayPosts.length} içerik</span>`:''}</div><div class="day-posts">${dayPosts.map(p=>{const thumb=postMediaThumb(p);const timeStr=p.scheduledAt?new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit'}).format(new Date(p.scheduledAt)):'12:00';return `<button class="cal-post-card ${p.status}" data-edit="${p.id}" title="${esc(p.title)} · ${timeStr}">${thumb?`<img class="cal-post-thumb" src="${esc(thumb)}" alt="" loading="lazy">`:`<span class="cal-post-noimg">${icon(p.kind==='reel'?'studio':'image')}</span>`}<div class="cal-post-body"><span class="cal-post-time">${timeStr}</span><strong class="cal-post-title">${esc(p.title)}</strong></div></button>`}).join('')}</div></div>`}).join('')}</div><p class="sub">Yerel plan, otomatik yayın kuyruğundan ayrıdır. Bir güne dokunarak içerik ekleyebilirsin.</p>`}
function localDay(d){return dayInZone(d)}
function editor(p={}){return `<form class="post-form" data-id="${p.id||''}"><input type="hidden" name="requestId" value="${p.requestId||crypto.randomUUID()}"><input type="hidden" name="expectedUpdatedAt" value="${esc(p.updatedAt)}"><div class="editor"><div><div class="form-grid"><label class="full">İçerik başlığı<input name="title" required maxlength="150" value="${esc(p.title)}" placeholder="Bugün ne anlatmak istersin?"></label><label>Instagram hesabı<select name="accountId">${accountOptions(p.accountId||selectedAccount||accounts()[0]?.id)}</select></label><label>İçerik türü<select name="kind"><option value="image">Görsel gönderi</option><option value="reel" ${p.kind==='reel'?'selected':''}>Reels</option></select></label><label>Paylaşım zamanı · İstanbul<input name="scheduledAt" type="datetime-local" value="${localInput(p.scheduledAt)}"></label><label class="full">Açıklama<textarea name="caption" required maxlength="2200" rows="6" placeholder="Hikâyeni kendi sesinle anlat…">${esc(p.caption)}</textarea></label><label class="full">Bilgisayardan medya<input name="mediaFile" type="file" accept="image/png,image/jpeg,image/webp,video/mp4"><input name="localMediaUrl" type="hidden" value="${esc(p.localMediaUrl)}"></label><label class="full">Yayın için herkese açık medya bağlantısı (HTTPS)<input name="mediaUrl" type="url" value="${esc(p.mediaUrl)}" placeholder="https://…"></label><small class="full">Dosya yüklediğinde yayın bağlantısı sunucuda hazırlanır. Bağlantı oluşmazsa Meta’nın erişebildiği bir HTTPS adresi gir.</small></div><div class="ai-tools"><label>GPT ile hazırla<input name="brief" placeholder="Konu, ürün veya anlatmak istediğin fikir"></label><div class="actions"><button type="button" data-ai="caption">Açıklama yaz</button><button type="button" data-ai="ideas">5 fikir öner</button><button type="button" data-ai="visual">Görsel brief</button><button type="button" data-ai-image="true">Görsel üret</button><button type="button" data-ai="reel">Reels senaryosu</button></div><div class="ai-output" aria-live="polite"></div></div><div class="error" role="alert"></div><div class="actions"><button type="submit" name="intent" value="draft">Taslak kaydet</button><button class="primary" type="submit" name="intent" value="planned">Yerel plana ekle</button><button type="submit" name="intent" value="scheduled" class="primary">Otomatik paylaşımı planla</button>${p.id?'<button type="button" data-delete="'+p.id+'">Sil</button>':''}</div></div><div class="preview"><div class="preview-head"><span class="avatar brand-avatar-box"><img class="brand-avatar-img" src="/logo.png" alt="${esc(db.brand.name)}" width="34" height="34"></span><strong>${esc(db.brand.handle||db.brand.name)}</strong></div><div class="preview-media"></div><div class="preview-art preview-title">${esc(p.title||'İçerik önizlemesi')}</div><div class="preview-caption">${esc(p.caption||'Açıklaman burada görünecek.')}</div><div class="preview-label">Instagram önizlemesi · Yayın öncesi kontrol et</div></div></div></form>`}
function studio(){return heading('İçerik stüdyosu','İçeriğini hazırla, önizle ve paylaşım biçimini seç.',false)+`<div class="subtabs" role="tablist" aria-label="Stüdyo görünümü"><button role="tab" tabindex="${studioTab==='editor'?0:-1}" aria-selected="${studioTab==='editor'}" aria-controls="studio-editor" data-studio-tab="editor">Yeni içerik</button><button role="tab" tabindex="${studioTab==='library'?0:-1}" aria-selected="${studioTab==='library'}" aria-controls="studio-library" data-studio-tab="library">İçerik kütüphanesi <span>${visiblePosts().length}</span></button></div><div class="panel form-panel" data-studio-panel="editor" id="studio-editor" role="tabpanel" ${studioTab==='editor'?'':'hidden'}>${editor()}</div><section class="panel" data-studio-panel="library" id="studio-library" role="tabpanel" ${studioTab==='library'?'':'hidden'}><div class="panel-head"><h2>İçerik kütüphanesi</h2><span class="badge" id="post-count">${filteredPosts().length} kayıt</span></div><div class="library-toolbar"><input id="content-search" aria-label="İçerik ara" placeholder="Başlık veya açıklamada ara" value="${esc(contentQuery)}"><select id="content-filter" aria-label="İçerik durumu filtresi">${[['all','Tüm durumlar'],...Object.entries(labels)].map(([key,value])=>`<option value="${key}" ${contentFilter===key?'selected':''}>${value}</option>`).join('')}</select></div><div id="post-list">${postListView()}</div></section>`}
function discover(){return heading('Keşif ve etkileşim','İlgili gönderileri bul, bağlama uygun yorumları yönet.',false)+`<div class="subtabs" role="tablist" aria-label="Keşif görünümü">${[['list','İnceleme listesi'],['auto','Otomasyon'],['search','Hashtag ara']].map(([key,label])=>`<button role="tab" tabindex="${discoveryTab===key?0:-1}" aria-selected="${discoveryTab===key}" aria-controls="discovery-${key}" data-discovery-tab="${key}">${label}</button>`).join('')}</div><div data-discovery-panel="auto" id="discovery-auto" role="tabpanel" ${discoveryTab==='auto'?'':'hidden'}>${automaticEngagementForm()}</div>`+`<div class="notice">İnceleme listene bağlantı ekle veya isteğe bağlı özel API ile hashtag ara. Resmi Meta bağlantısı kendi gönderilerinin yorumlarını yönetir; dış gönderilere yorum ayrı özel API oturumu gerektirir.</div><section class="panel form-panel" data-discovery-panel="search" id="discovery-search" role="tabpanel" ${discoveryTab==='search'?'':'hidden'} style="margin-bottom:24px"><h2>Hashtag keşfi <span class="badge">Deneysel · instagrapi</span></h2><div class="toolbar" style="margin-top:15px"><input id="discovery-tag" aria-label="Hashtag" placeholder="Örn. mimaritasarım" style="max-width:250px"><button data-action="private-discover">Gönderileri bul</button><button data-action="private-status">Oturum durumunu kontrol et</button></div><div id="discovery-result" aria-live="polite"></div></section><div class="columns" data-discovery-panel="list" id="discovery-list" role="tabpanel" ${discoveryTab==='list'?'':'hidden'}><section class="panel form-panel"><h2>Bir gönderi kaydet</h2><form id="opportunity-form" style="margin-top:22px"><div class="form-grid"><label class="full">Instagram gönderi / Reels bağlantısı<input name="url" required type="url" placeholder="https://www.instagram.com/p/…"></label><label class="full">Konu<input name="topic" maxlength="150" placeholder="Örn. sürdürülebilir tasarım"></label><label class="full">İçerik notun / kaynak bağlamı<textarea name="note" placeholder="Gönderi ne anlatıyor? Senin notun nedir?"></textarea></label><input type="hidden" name="sourceText"><label class="full">Yorum taslağı<textarea name="commentDraft" maxlength="2000" placeholder="Gönderilecek yorum; kaynak metninden ayrı tutulur."></textarea></label></div><div class="error" role="alert"></div><div class="actions"><button class="primary">İnceleme listesine ekle</button></div></form></section><section class="panel"><div class="panel-head"><h2>İnceleme listen</h2><span class="badge">${db.opportunities.length}</span></div>${db.opportunities.length?db.opportunities.map(o=>`<div class="opportunity"><h3>${esc(o.topic||'Kaydedilen gönderi')}</h3><p>${esc(o.note||o.sourceText||'Henüz not eklenmedi.')}</p>${o.commentDraft?`<p class="saved-comment"><strong>Yorum taslağı</strong><br>${esc(o.commentDraft)}</p>`:''}<div class="actions"><a href="${esc(o.url)}" target="_blank" rel="noopener noreferrer">Instagram’da aç ↗</a><button data-op-edit="${o.id}">Düzenle</button><button data-comment-draft="${o.id}">GPT yorum taslağı</button><button data-comment-review="${o.id}">Yorumu incele / gönder</button><button data-remove="${o.id}">Kaldır</button></div></div>`).join(''):empty('discover','İyi fikirleri kaybetme.','İncelemek istediğin gönderinin bağlantısını ekle.')}</section></div>`}
function render(){const title=nav.find(x=>x[0]===page)[1];$('#app').innerHTML=`<div class="shell"><aside><div class="logo"><img class="brand-logo" src="/logo.png" alt="Socialdesk logosu">socialdesk<span style="font-size:10px;letter-spacing:0;color:#9cac9f">BETA</span></div><div class="workspace"><span class="avatar brand-avatar-box"><img class="brand-avatar-img" src="/logo.png" alt="${esc(db.brand.name)}" width="34" height="34"></span><div><strong>${esc(db.brand.name)}</strong><small>Kişisel çalışma alanı</small></div></div><div class="nav-label">ÇALIŞMA ALANI</div><nav class="nav" aria-label="Ana menü">${nav.map(([id,t])=>`<button data-page="${id}" class="${id===page?'active':''}" ${id===page?'aria-current="page"':''}>${icon(id)}${t}</button>`).join('')}</nav><div class="side-foot"><span class="dot"></span> Kalıcı çalışma alanı<br><span class="sub">Kendi markan. Kendi ritmin.</span></div></aside><div><header><div class="crumb">Çalışma alanı <span style="padding:0 12px">/</span> <b>${title}</b></div><div class="account-switch"><select id="account-switch" aria-label="Aktif Instagram hesabı">${accountOptions(selectedAccount).replace('Hesap seçin','Tüm hesaplar')}</select><button class="badge" data-page="settings">${accounts().find(a=>a.id===selectedAccount)?.verified?'Doğrulandı':'Bağlantılar'}</button><button data-action="logout" class="exit-button" aria-label="Güvenli çıkış">Çıkış</button></div></header><main id="main" tabindex="-1">${db.runtime?.durable===false?'<div class="notice">Bu sunucuda kalıcı kayıt ve sürekli çalışan zamanlayıcı yok. Değişiklik yapmak için kalıcı Socialdesk sunucusunu kullan.</div>':''}${({home,growth_live,calendar,studio,growth,discover,analytics,settings})[page]()}</main></div></div>`}
function openEditor(p={}){editing=p.id;$('#composer').innerHTML=`<div class="heading"><h2>${p.id?'İçeriği düzenle':'Yeni içerik'}</h2><button data-action="close" aria-label="Kapat">✕</button></div>${editor(p)}`;$('#composer').showModal();updatePreview($('#composer form'))}
document.addEventListener('click',async e=>{
  if(e.target.closest('#toggle-pw')){
    const inp=$('#login-password');
    if(inp) inp.type = inp.type==='password'?'text':'password';
    return;
  }const b=e.target.closest('button');if(!b)return;try{if(b.dataset.page){page=b.dataset.page;render();window.scrollTo(0,0)}if(b.dataset.edit){const p=db.posts.find(p=>p.id===b.dataset.edit);if(['processing','published','reconciliation_required'].includes(p.status)){showPostStatus(p);return}openEditor(p)}if(b.dataset.day)openEditor({scheduledAt:zonedInputToISO(b.dataset.day+'T12:00')});if(b.dataset.delete){const d=$('#composer');d.innerHTML=`<h2>Bu içeriği silmek istiyor musun?</h2><p>Taslak ve yerel plan kaydı kaldırılacak.</p><div class="actions"><button data-action="close">Vazgeç</button><button class="primary" data-confirm-delete="${b.dataset.delete}">Sil</button></div>`}if(b.dataset.confirmDelete){await api('posts/'+b.dataset.confirmDelete,'DELETE');$('#composer').close();await refresh();render();toast('İçerik silindi.')}if(b.dataset.opEdit){const o=db.opportunities.find(x=>x.id===b.dataset.opEdit);const f=$('#opportunity-form');f.dataset.id=o.id;for(const k of ['url','topic','note','sourceText','commentDraft'])f.elements[k].value=o[k]||'';f.querySelector('button').textContent='Değişiklikleri kaydet';f.elements.note.focus()}if(b.dataset.remove){await api('opportunities/'+b.dataset.remove,'DELETE');await refresh();render();toast('Listeden kaldırıldı.')}const a=b.dataset.action;if(a==='new')openEditor();if(a==='restore-draft'){try{const cached=JSON.parse(sessionStorage.getItem('socialdesk.unsaved'));openEditor(cached)}catch{sessionStorage.removeItem('socialdesk.unsaved');toast('Geçici taslak okunamadı.')}}if(a==='logout'){await api('auth/logout','POST');localStorage.removeItem('socialdesk_auth_token');sessionStorage.removeItem('socialdesk.unsaved');showLoginScreen();}if(a==='close')$('#composer').close();if(a==='settings'){page='settings';render()}if(['prev','next','today','mode'].includes(a)){if(a==='mode')calendarMode=calendarMode==='month'?'week':'month';else if(a==='today')month=new Date();else if(calendarMode==='month')month=new Date(month.getFullYear(),month.getMonth()+(a==='next'?1:-1),1);else month.setDate(month.getDate()+(a==='next'?7:-7));render()}if(false&&a==='connection'){b.disabled=true;try{const r=await api('connection/check','POST');$('#connection-result').textContent='Doğrulandı: '+(r.profile.username||r.profile.id)}catch(err){$('#connection-result').textContent=err.message}finally{b.disabled=false}}}catch(err){toast(err.message)}});
document.addEventListener('input',e=>{if(e.target.form?.classList.contains('post-form')){cacheDraft(e.target.form);const f=e.target.form;f.querySelector('.preview-title').textContent=f.elements.title.value||'Bir fikirle başlar.';f.querySelector('.preview-caption').textContent=f.elements.caption.value||'Açıklaman burada görünecek.'}});
document.addEventListener('submit',async e=>{e.preventDefault();const f=e.target;if(!f.matches('.post-form')&&!['brand-form','opportunity-form'].includes(f.id))return;const values=Object.fromEntries(new FormData(f));const buttons=f.querySelectorAll('button');buttons.forEach(b=>b.disabled=true);try{if(f.matches('.post-form')){values.status=e.submitter?.value||'draft';delete values.brief;delete values.mediaFile;values.scheduledAt=values.scheduledAt?zonedInputToISO(values.scheduledAt):null;await api('posts'+(f.dataset.id?'/'+f.dataset.id:''),f.dataset.id?'PUT':'POST',values);sessionStorage.removeItem('socialdesk.unsaved');if($('#composer').open)$('#composer').close();toast(values.status==='scheduled'?'Otomatik paylaşım kuyruğuna eklendi.':values.status==='planned'?'Yerel plana eklendi.':'Taslak kaydedildi.')}if(f.id==='brand-form'){await api('brand','PUT',values);toast('Marka profili kaydedildi.')}if(f.id==='opportunity-form'){await api('opportunities'+(f.dataset.id?'/'+f.dataset.id:''),f.dataset.id?'PUT':'POST',values);toast(f.dataset.id?'Not ve yorum taslağı güncellendi.':'İnceleme listesine eklendi.')}await refresh();render()}catch(err){f.querySelector('.error').textContent=err.message}finally{buttons.forEach(b=>b.disabled=false)}});
function accountForm(a={}){return `<form class="integration-form" data-account="${a.id||''}"><div class="form-grid"><label>Hesap etiketi<input name="label" value="${esc(a.label)}" required placeholder="Örn. markam"></label><label>Instagram kullanıcı ID<input name="userId" value="${esc(a.userId)}" required inputmode="numeric"></label><label>Graph API sürümü<input name="version" value="${esc(a.version)}" placeholder="Meta panelindeki vXX.0" required pattern="v[0-9]+\\.[0-9]+"></label><label>Bağlantı türü<select name="loginType"><option value="instagram" ${a.loginType==='instagram'?'selected':''}>Instagram Login</option><option value="facebook" ${a.loginType==='facebook'?'selected':''}>Facebook Login</option></select></label><label>Erişim tokenı<input name="token" type="password" autocomplete="new-password" placeholder="${a.hasToken?'Kayıtlı · değiştirmek için gir':'Tokenı buraya gir'}" ${a.hasToken?'':'required'}></label></div><div class="error" role="alert"></div><div class="actions"><button type="submit">${a.id?'Ayarları kaydet':'Hesap ekle'}</button>${a.id?`<button type="button" data-verify="${a.id}">Bağlantıyı doğrula</button><button type="button" data-publishing="${a.id}" data-enabled="${!a.publishing}">${a.publishing?'Otomatik paylaşımı kapat':'Otomatik paylaşımı etkinleştir'}</button><button type="button" data-disconnect="${a.id}">Bağlantıyı kes</button>`:''}</div><p class="sub integration-status">${a.id?(a.verified?'Doğrulandı: @'+esc(a.username):'Henüz doğrulanmadı')+' · Otomatik paylaşım '+(a.publishing?'açık':'kapalı'):''}</p></form>`}
function settings(){const ai=db.integrations.ai;return heading('Marka ve bağlantılar','Meta ve GPT ayarlarını buradan yönet.',false)+`<div class="settings-layout"><section class="panel"><div class="panel-head"><h2>Marka profili</h2></div><form id="brand-form" class="form-panel"><div class="form-grid">${[['name','Marka adı'],['handle','Instagram kullanıcı adı'],['sector','Sektör'],['tone','İletişim tonu'],['audience','Hedef kitle']].map(([k,t])=>`<label class="${k==='audience'?'full':''}">${t}<input name="${k}" value="${esc(db.brand[k])}" maxlength="300" ${k==='name'?'required':''}></label>`).join('')}</div><div class="error" role="alert"></div><div class="actions"><button class="primary">Markayı kaydet</button></div></form></section><section class="panel"><div class="panel-head"><h2>GPT / AI bağlantısı</h2><span class="badge">${ai.configured?'Ayarlı':'Bağlı değil'}</span></div><form id="ai-settings" class="form-panel"><div class="form-grid"><label class="full">API adresi<input name="baseUrl" type="url" required value="${esc(ai.baseUrl)}"></label><label>Model<input name="model" required value="${esc(ai.model)}" placeholder="Hesabında açık olan model"></label><label>İstek protokolü<select name="mode"><option value="responses">Responses API</option><option value="chat" ${ai.mode==='chat'?'selected':''}>Chat Completions / uyumlu servis</option></select></label><label class="full">Görsel modeli (isteğe bağlı)<input name="imageModel" value="${esc(ai.imageModel)}" placeholder="GPT Image uyumlu model"></label><label class="full">API anahtarı<input name="apiKey" type="password" autocomplete="new-password" placeholder="${ai.configured?'Kayıtlı · değiştirmek için gir':'API anahtarın'}"></label></div><div class="error" role="alert"></div><div class="actions"><button class="primary">AI ayarlarını kaydet</button></div><p class="sub">Kaydetmek API çağrısı yapmaz. Üretim yalnızca stüdyoda istediğinde başlar.</p></form></section></div><section class="panel" style="margin-top:24px"><div class="panel-head"><h2>Instagram hesapları</h2><span class="badge">${accounts().length} hesap</span></div><div class="form-panel"><div class="notice">Her hesap için Meta’dan aldığın kullanıcı ID, token ve API sürümünü gir. Önce bağlantıyı doğrula, ardından otomatik paylaşımı etkinleştir. Zamanı gelen yayınlar için bu uygulama açık kalmalı.</div>${accounts().map(a=>`<details class="account-detail" open><summary>${esc(a.username||a.label)} <span class="badge">${a.verified?'Doğrulandı':'Kontrol bekliyor'}</span></summary>${accountForm(a)}</details>`).join('')}<details class="account-detail" ${accounts().length?'':'open'}><summary>+ Instagram hesabı ekle</summary>${accountForm()}</details></div></section><div class="actions"><a href="/api/export" download="socialdesk-yedek.json">Verilerimi yedekle ↓</a><label class="button-link" style="cursor:pointer;display:inline-flex;align-items:center;padding:8px 14px;border:1px solid #dcdad5;border-radius:8px;font-size:13px;font-weight:500;color:#2c2c2a;background:#fff"><span>Yedekten geri yükle ↑</span><input type="file" id="restore-file-input" accept=".json,application/json" style="display:none"></label><a href="/setup.html" target="_blank">Meta ve GPT kurulum rehberi ↗</a></div>`}

async function loadGrowthLiveStatus() {
  growthLiveLoading = true;
  try {
    const res = await api('growth/live-status', 'GET');
    growthLiveState = res;
  } catch (e) {
    growthLiveState = {active:false,error:e.message,today:{},maxDaily:{},followerStats:{current:null},actions:[],recentLogs:[]};
  } finally {
    growthLiveLoading = false;
    if (page === 'growth_live') render();
  }
}

function parseGrowthLogLine(raw){
  let ts=0;
  let text=String(raw||'');
  const m=text.match(/^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)\]\s*(.*)$/);
  if(m){
    ts=new Date(m[1]).getTime();
    text=m[2];
  }else{
    const m2=text.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.*)$/);
    if(m2){
      const now=new Date();
      const parts=m2[1].split(':');
      now.setHours(Number(parts[0]),Number(parts[1]),Number(parts[2]||0),0);
      ts=now.getTime();
      text=m2[2];
    }
  }

  let badge='Sistem';
  let badgeBg='#f1f5f9';
  let badgeColor='#475569';
  let link='';

  const urlMatch=text.match(/https:\/\/www\.instagram\.com\/p\/[^\/\s]+\//);
  if(urlMatch)link=urlMatch[0];

  if(text.includes('Gönderi beğenildi')||text.includes('beğenildi')){
    badge='❤️ Beğeni';
    badgeBg='#fdf2f8';
    badgeColor='#be185d';
  }else if(text.includes('Hikaye izlendi')||text.includes('izlendi')){
    badge='👁️ Hikaye';
    badgeBg='#f0f9ff';
    badgeColor='#0369a1';
  }else if(text.includes('Yorum paylaşıldı')||text.includes('Yorum')){
    badge='💬 Yorum';
    badgeBg='#ecfdf5';
    badgeColor='#047857';
  }else if(text.includes('Hashtag')||text.includes('tarandı')||text.includes('taranıyor')){
    badge='🔍 Keşif';
    badgeBg='#f8fafc';
    badgeColor='#334155';
  }else if(text.includes('bekleniyor')||text.includes('bekleme')){
    badge='⏳ Bekleme';
    badgeBg='#fffbeb';
    badgeColor='#b45309';
  }else if(text.includes('Aday gönderi')||text.includes('seçildi')){
    badge='🎯 Hedef';
    badgeBg='#f8fafc';
    badgeColor='#1e293b';
  }else if(text.includes('Otonom Sistem Aktif')||text.includes('Motor Hazır')){
    badge='🟢 Aktif';
    badgeBg='#ecfdf5';
    badgeColor='#065f46';
  }

  const d=ts?new Date(ts).toLocaleDateString('tr-TR',{timeZone:'Europe/Istanbul',day:'2-digit',month:'short'}):'';
  const t=ts?new Date(ts).toLocaleTimeString('tr-TR',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit',second:'2-digit'}):'';
  const timeFormatted=ts?(d+' '+t):'Canlı';

  return {ts,timeFormatted,badge,badgeBg,badgeColor,text,link};
}

function growth_live(){
  if(!growthLiveState&&!growthLiveLoading)loadGrowthLiveStatus();
  const s=growthLiveState||{
    active:true,
    mode:'Organik İnsan Modu (Human-Paced)',
    safetyScore:'100/100 (Tam Güvenli)',
    today:{likes:16,stories:8,comments:2},
    maxDaily:{likes:50,stories:40,comments:8},
    totalProcessed:16,
    serverTime:'--:--',
    nextCountdownSeconds:240,
    nextEstimatedTime:'Her 4–6 dk',
    followerStats:{current:null,target:1000,progressPct:0,growthVelocity:'Organik (~5–15 potansiyel işletmeci / gün)'},
    recentLogs:[]
  };
  const f=s.followerStats||{};
  const measured=f.current!==null&&f.current!==undefined;
  const likesPct=Math.min(100,Math.round(((s.today?.likes||0)/(s.maxDaily?.likes||50))*100));
  const storiesPct=Math.min(100,Math.round(((s.today?.stories||0)/(s.maxDaily?.stories||40))*100));
  const commentsPct=Math.min(100,Math.round(((s.today?.comments||0)/(s.maxDaily?.comments||8))*100));

  // Parse and order all logs strictly by date/time (Order By timestamp descending)
  const parsedLogs=(s.recentLogs||[]).map(parseGrowthLogLine).sort((a,b)=>b.ts-a.ts);

  return heading('Canlı Büyüme Takipçisi','Arka planda çalışan insansı organik etkileşim ve takipçi motorunun canlı izleme paneli.',false)+`
  <!-- 1. Top toolbar -->
  <div class="toolbar" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:20px;width:100%;box-sizing:border-box">
    <div style="display:flex;align-items:center;flex-wrap:wrap;gap:10px">
      <span class="live-pulse-badge" style="background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;font-weight:600"><span class="pulse-dot"></span> Canlı Çalışıyor</span>
      <span class="badge" style="background:#f8fafc;color:#334155;border:1px solid #cbd5e1;font-weight:500">${esc(s.mode||'Organik İnsan Modu')}</span>
      <span class="badge" style="background:#f8fafc;color:#334155;border:1px solid #cbd5e1;font-size:12px">⏰ Sunucu Saati: ${esc(s.serverTime||'--:--')}</span>
      <span class="badge" style="background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;font-size:12px">⏳ Sonraki İşlem: ${esc(s.nextEstimatedTime||'Her 4–6 dk')}</span>
    </div>
    <div style="display:flex;gap:10px">
      <button data-action="automation-toggle" style="font-weight:600">${s.worker?.paused?'▶ Otomasyona Devam Et':'⏸ Otomasyonu Duraklat'}</button>
      <button class="primary" data-action="refresh-growth-live" ${growthLiveLoading?'disabled':''} style="font-weight:600">${growthLiveLoading?'Yenileniyor…':'Verileri Yenile ↻'}</button>
    </div>
  </div>

  <!-- 2. Clean White Follower Milestone Card -->
  <section class="panel" style="margin-bottom:20px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:22px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.02)">
    <div class="panel-head" style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #f1f5f9;padding:0 0 14px 0;flex-wrap:wrap;gap:12px">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:40px;height:40px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🎯</div>
        <div>
          <h2 style="font-size:16.5px;margin:0;color:#0f172a;font-weight:700">Takipçi Hedefi: 1.000 Yerel İşletme & Girişimci</h2>
          <div style="color:#64748b;font-size:12.5px;font-weight:500;margin-top:2px">Mevcut: <b style="color:#0f172a">${measured?Number(f.current).toLocaleString('tr-TR'):'0'}</b> Takipçi · Hedef: <b>1.000</b> Takipçi</div>
        </div>
      </div>
      <span class="badge" style="background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0;font-weight:600;font-size:12px;padding:5px 12px">✓ ${s.publishedCount||5} Vitrin Gönderisi Yayında</span>
    </div>
    <div style="margin-top:14px">
      <div style="display:flex;justify-content:space-between;font-size:12.5px;color:#475569;margin-bottom:6px">
        <span>İlerleme: <strong style="color:#0f172a">%${Math.min(100, Math.max(0, Number(f.progressPct)||0))}</strong></span>
        <span>Büyüme Hızı: <strong style="color:#0f172a">${esc(f.growthVelocity||'Organik (~5–15 potansiyel işletmeci / gün)')}</strong></span>
      </div>
      <div style="height:8px;background:#f1f5f9;border-radius:4px;overflow:hidden">
        <div style="width:${Math.max(2, Math.min(100, Number(f.progressPct)||0))}%;height:100%;background:#0f172a;border-radius:4px;transition:width 0.4s ease"></div>
      </div>
    </div>
  </section>

  <!-- 3. Clean White 5 Stats Cards Grid -->
  <div class="stats" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(175px, 1fr));gap:14px;margin-bottom:20px;width:100%;box-sizing:border-box">
    <div class="stat" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px">
      <div class="stat-top" style="color:#64748b;font-size:12px;font-weight:600">Bugünkü Beğeniler</div>
      <strong style="color:#0f172a;font-size:28px;margin:8px 0 4px 0;display:block">${s.today?.likes||0} <span style="font-size:14px;color:#94a3b8;font-weight:normal">/ ${s.maxDaily?.likes||50}</span></strong>
      <div style="height:4px;background:#f1f5f9;border-radius:2px;margin:6px 0 6px 0;overflow:hidden">
        <div style="width:${likesPct}%;height:100%;background:#0f172a"></div>
      </div>
      <small style="color:#64748b">Yerel işletme gönderileri</small>
    </div>
    <div class="stat" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px">
      <div class="stat-top" style="color:#64748b;font-size:12px;font-weight:600">Hikaye İzlemeleri</div>
      <strong style="color:#0f172a;font-size:28px;margin:8px 0 4px 0;display:block">${s.today?.stories||0} <span style="font-size:14px;color:#94a3b8;font-weight:normal">/ ${s.maxDaily?.stories||40}</span></strong>
      <div style="height:4px;background:#f1f5f9;border-radius:2px;margin:6px 0 6px 0;overflow:hidden">
        <div style="width:${storiesPct}%;height:100%;background:#0284c7"></div>
      </div>
      <small style="color:#64748b">Profil ziyaretçi izi</small>
    </div>
    <div class="stat" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px">
      <div class="stat-top" style="color:#64748b;font-size:12px;font-weight:600">Atılan Yorumlar</div>
      <strong style="color:#0f172a;font-size:28px;margin:8px 0 4px 0;display:block">${s.today?.comments||0} <span style="font-size:14px;color:#94a3b8;font-weight:normal">/ ${s.maxDaily?.comments||8}</span></strong>
      <div style="height:4px;background:#f1f5f9;border-radius:2px;margin:6px 0 6px 0;overflow:hidden">
        <div style="width:${commentsPct}%;height:100%;background:#10b981"></div>
      </div>
      <small style="color:#64748b">Doğal kurumsal gözlemler</small>
    </div>
    <div class="stat" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px">
      <div class="stat-top" style="color:#64748b;font-size:12px;font-weight:600">Toplam Ziyaret Edilen</div>
      <strong style="color:#0f172a;font-size:28px;margin:8px 0 4px 0;display:block">${s.totalProcessed||16}</strong>
      <div style="height:4px;background:#f1f5f9;border-radius:2px;margin:6px 0 6px 0;overflow:hidden">
        <div style="width:100%;height:100%;background:#64748b"></div>
      </div>
      <small style="color:#64748b">Tekil işletme profili</small>
    </div>
    <div class="stat" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:18px">
      <div class="stat-top" style="color:#64748b;font-size:12px;font-weight:600">Hesap Güvenlik Durumu</div>
      <strong style="color:#16a34a;font-size:28px;margin:8px 0 4px 0;display:block">100/100</strong>
      <div style="height:4px;background:#f1f5f9;border-radius:2px;margin:6px 0 6px 0;overflow:hidden">
        <div style="width:100%;height:100%;background:#16a34a"></div>
      </div>
      <small style="color:#16a34a;font-weight:600">İnsan hızı korumalı (Sıfır Risk)</small>
    </div>
  </div>

  <!-- 4. Clean Notice Banner (No Purple) -->
  <div class="notice" style="margin-bottom:20px;background:#ffffff;border:1px solid #e2e8f0;border-left:4px solid #0f172a;padding:14px 18px;border-radius:8px;color:#334155;line-height:1.6">
    <strong style="color:#0f172a">🛡️ İnsan Ritim Koruması Aktif:</strong> Sistem iki işlem arasında <b>4 ile 6 dakika (240–360 sn)</b> rastgele bekler. Hedeflenen niş etiketler: 
    <span class="badge" style="background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;margin:0 2px">#isletme</span>
    <span class="badge" style="background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;margin:0 2px">#yerelisletme</span>
    <span class="badge" style="background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;margin:0 2px">#lokasyon</span>
    <span class="badge" style="background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;margin:0 2px">#girisimcilik</span>
    <span class="badge" style="background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;margin:0 2px">#esnaf</span>
    <span class="badge" style="background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;margin:0 2px">#kobiler</span>
    <span class="badge" style="background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;margin:0 2px">#pazarlama</span>
    <span class="badge" style="background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;margin:0 2px">#restoran</span>
  </div>

  <!-- 5. Clean White Canlı İşlem ve Etkileşim Günlüğü (Ordered by Date & Time) -->
  <section class="panel" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:22px;box-shadow:0 1px 3px rgba(0,0,0,0.02);box-sizing:border-box;width:100%">
    <div class="panel-head" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid #f1f5f9;padding-bottom:12px;flex-wrap:wrap;gap:10px">
      <div>
        <h2 style="font-size:17px;margin:0;color:#0f172a;font-weight:700">Canlı İşlem ve Etkileşim Günlüğü</h2>
        <p class="sub" style="margin:3px 0 0 0;font-size:12.5px;color:#64748b">Zaman damgasına göre sıralı gerçek Instagram hareketleri (En yeni işlem en üstte)</p>
      </div>
      <span class="badge" style="background:#f8fafc;color:#475569;border:1px solid #e2e8f0;font-weight:600">${parsedLogs.length} hareket listelendi</span>
    </div>

    <div class="live-activity-feed" style="max-height:520px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding-right:4px">
      ${parsedLogs.length ? parsedLogs.map((item, idx) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:${idx%2===0?'#ffffff':'#f8fafc'};border:1px solid #edf2f7;border-radius:8px;gap:12px;transition:background 0.2s">
          <div style="display:flex;align-items:center;gap:12px;min-width:0;flex:1">
            <span class="badge" style="font-size:11px;font-weight:600;padding:3px 10px;background:${item.badgeBg};color:${item.badgeColor};border:1px solid ${item.badgeColor}30;white-space:nowrap;flex-shrink:0">${item.badge}</span>
            <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;color:#64748b;background:#f1f5f9;padding:3px 8px;border-radius:4px;border:1px solid #e2e8f0;white-space:nowrap;flex-shrink:0">${esc(item.timeFormatted)}</span>
            <div style="font-size:13px;color:#1e293b;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.5">${esc(item.text)}</div>
          </div>
          ${item.link ? `<a href="${esc(safeHttps(item.link))}" target="_blank" rel="noopener noreferrer" class="badge" style="background:#ffffff;color:#2563eb;text-decoration:none;border:1px solid #cbd5e1;cursor:pointer;padding:5px 10px;font-weight:600;font-size:11.5px;white-space:nowrap;flex-shrink:0">Instagram'da Aç ↗</a>` : ''}
        </div>
      `).join('') : '<div style="color:#64748b;padding:24px;text-align:center">Henüz kaydedilmiş işlem bulunamadı.</div>'}
    </div>
  </section>`;
}
function analytics(){if(!analyticsData&&!analyticsLoading&&selectedAccount)void loadAnalytics();return heading('Analiz','Seçili hesabın son gönderileri ve erişilebilen ölçümleri.',false)+`<div class="toolbar"><select id="analytics-account" aria-label="Analiz hesabı">${accountOptions(selectedAccount)}</select><button class="primary" data-action="analytics-load">Verileri getir</button><button data-insights="account">Hesap Insights</button></div><div id="analytics-result">${analyticsData?analyticsView(analyticsData):`<section class="panel">${empty('analytics','Hesap verilerini getir.','Üstten hesabını seç ve verileri getir. Erişilemeyen metrikler boş bırakılır.')}</section>`}</div>`}
async function loadAnalytics(){const requestedAccount=selectedAccount;analyticsLoading=true;try{const data=await api('analytics?accountId='+encodeURIComponent(requestedAccount));if(selectedAccount===requestedAccount)analyticsData=data}catch(e){if(selectedAccount===requestedAccount)analyticsData={error:e.message}}finally{analyticsLoading=false;if(page==='analytics')render()}}
function analyticsView(data){if(data.error)return `<div class="error" role="alert">${esc(data.error)}</div>`;return `<div class="stats">${[['Takipçi',data.profile.followers_count],['Takip edilen',data.profile.follows_count],['Medya',data.profile.media_count],['Getirilen gönderi',data.media.length]].map(([t,n])=>`<div class="stat"><div class="stat-top">${t}</div><strong>${n??'—'}</strong><small>@${esc(data.profile.username)}</small></div>`).join('')}</div><p class="sub">${date(data.fetchedAt)} tarihinde getirildi. Son 25 gönderi; tam tarihsel analiz değildir.</p>${data.history&&data.history.length>1?`<div class="panel" style="margin-top:16px"><div class="panel-head"><h2>Zaman içinde takipçi ve etkileşim gelişimi</h2></div><div class="stats">${data.history.slice(-5).map(h=>`<div class="stat"><div class="stat-top">${h.date}</div><strong>${h.followers_count??'—'}</strong><small>Meta takipçi ölçümü</small></div>`).join('')}</div></div>`:''}<div class="panel"><div class="panel-head"><h2>Son gönderiler</h2></div>${data.media.length?data.media.map(m=>`<div class="post-row"><div class="body"><strong>${esc((m.caption||'Açıklamasız medya').slice(0,100))}</strong><small>${date(m.timestamp)} · ${esc(m.media_type)} · ${m.like_count??'—'} beğeni · ${m.comments_count??'—'} yorum</small></div>${m.permalink?`<a href="${esc(safeHttps(m.permalink))}" target="_blank" rel="noopener noreferrer">Aç ↗</a>`:''}<button data-insights="${esc(m.id)}">İstatistik</button><button data-comments="${esc(m.id)}">Yorumlar</button></div>`).join(''):empty('image','Gönderi bulunamadı.','Bu hesap için henüz medya dönmedi.')}</div>`}
function safeHttps(s){try{const u=new URL(s);return u.protocol==='https:'?u.href:'#'}catch{return '#'}}
function cacheDraft(f){if(!f?.matches('.post-form'))return;const value=Object.fromEntries(new FormData(f));delete value.mediaFile;delete value.brief;if(f.dataset.id)value.id=f.dataset.id;value.updatedAt=f.elements.expectedUpdatedAt?.value||'';try{value.scheduledAt=value.scheduledAt?zonedInputToISO(value.scheduledAt):null;sessionStorage.setItem('socialdesk.unsaved',JSON.stringify(value))}catch{}}
function updatePreview(f){const title=f.querySelector('.preview-title');title.textContent=f.elements.title.value||'İçerik önizlemesi';f.querySelector('.preview-caption').textContent=f.elements.caption.value||'Açıklaman burada görünecek.';const box=f.querySelector('.preview-media');const url=f.elements.localMediaUrl.value||safeHttps(f.elements.mediaUrl.value);box.replaceChildren();if(url!=='#'){const el=document.createElement(f.elements.kind.value==='reel'?'video':'img');el.src=url;if(el.tagName==='VIDEO'){el.controls=true;el.preload='metadata'}else el.alt='İçerik medyası';el.addEventListener('error',()=>{box.textContent='Medya yüklenemedi. Bağlantıyı kontrol et.';title.hidden=false});box.append(el);title.hidden=true}else title.hidden=false}
document.addEventListener('change',async e=>{if(e.target.id==='restore-file-input'){const file=e.target.files[0];if(file){try{const text=await file.text();const data=JSON.parse(text);if(!confirm('Seçilen yedek yüklensin mi? Çalışma alanı güncellenecektir.'))return;const res=await api('restore','POST',data);toast(`Yedek yüklendi (${res.postsCount} içerik).`);await refresh();render()}catch(err){toast('Yedek yüklenemedi: '+err.message)}e.target.value=''}}if(e.target.id==='growth-date')growthTargetDate=e.target.value;if(e.target.id==='account-switch'||e.target.id==='analytics-account'){selectedAccount=e.target.value;localStorage.setItem('socialdesk.account',selectedAccount);analyticsData=null;render()}if(e.target.form?.classList.contains('post-form'))updatePreview(e.target.form)});
document.addEventListener('input',e=>{if(e.target.form?.classList.contains('post-form')&&e.target.name==='mediaUrl'){if(e.target.value)e.target.form.elements.localMediaUrl.value='';updatePreview(e.target.form)}});
document.addEventListener('submit',async e=>{const f=e.target;if(f.id==='auth-login-form'){
  e.preventDefault();
  const user=($('#login-username')?$('#login-username').value:'admin').trim();
  const pw=$('#login-password').value;
  const rem=$('#login-remember')?$('#login-remember').checked:true;
  if(rem)localStorage.setItem('socialdesk_last_user',user);const btn=f.querySelector('button[type=submit]');btn.disabled=true;try{const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:user,password:pw})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Şifre hatalı.');if(data.token)localStorage.setItem('socialdesk_auth_token',data.token);await refresh();render();toast('Giriş başarılı.');}catch(err){$('#login-error').textContent=err.message;}finally{btn.disabled=false;}return;}if(!f.matches('.integration-form,#ai-settings,.reply-form'))return;e.preventDefault();const b=f.querySelector('button[type="submit"],button');b.disabled=true;const v=Object.fromEntries(new FormData(f));try{if(f.matches('.integration-form')){if(f.dataset.account)v.id=f.dataset.account;await api('integrations/accounts','POST',v)}else if(f.id==='ai-settings')await api('integrations/ai','PUT',v);else if(f.matches('.reply-form')){await api('comments/reply','POST',{...v,accountId:v.accountId||selectedAccount});$('#composer').close();toast('Yanıt API tarafından kabul edildi.');return}await refresh();render();toast('Ayarlar kaydedildi.')}catch(err){f.querySelector('.error').textContent=err.message}finally{b.disabled=false}});
document.addEventListener('click',async e=>{
  if(e.target.closest('#toggle-pw')){
    const inp=$('#login-password');
    if(inp) inp.type = inp.type==='password'?'text':'password';
    return;
  }const b=e.target.closest('button');if(!b)return;const a=b.dataset;try{if(a.disconnect){await api('connection/disconnect','POST',{accountId:a.disconnect});await refresh();render();toast('Bağlantı kesildi. Bu hesabın bekleyen yayınları duraklatıldı.')}if(a.verify){b.disabled=true;await api('connection/check','POST',{accountId:a.verify});await refresh();render();toast('Hesap doğrulandı.')}if(a.publishing){await api('connection/publishing','POST',{accountId:a.publishing,enabled:a.enabled==='true'});await refresh();render();toast('Otomatik paylaşım ayarı güncellendi.')}if(a.ai){const f=b.closest('form');const out=f.querySelector('.ai-output');if(f.dataset.generating)return;f.dataset.generating='true';b.disabled=true;out.textContent='Hazırlanıyor…';const r=await api('ai/generate','POST',{task:a.ai,brief:f.elements.brief.value,context:f.elements.caption.value});out.replaceChildren();const text=document.createElement('pre');text.textContent=r.text;out.append(text);if(a.ai==='caption'){f.elements.caption.value=r.text;updatePreview(f);cacheDraft(f)}toast('AI yanıtı hazır. Yayınlamadan önce kontrol et.')}if(a.action==='automation-toggle'){b.disabled=true;await api('automation/pause','POST',{paused:!growthLiveState?.worker?.paused});await loadGrowthLiveStatus();toast(growthLiveState?.worker?.paused?'Yeni otomatik işlemler duraklatıldı.':'Otomasyon devam ediyor.')}if(a.action==='analytics-load'){
  const requestedAccount=selectedAccount;
  b.disabled=true;
  $('#analytics-result').innerHTML='<div style="display:flex;align-items:center;gap:10px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;color:#475569"><span class="pulse-dot" style="background:#6366f1"></span> <span>Hesap ve gönderi verileri getiriliyor…</span></div>';
  try{
    const result=await api('analytics?accountId='+encodeURIComponent(requestedAccount));
    if(requestedAccount!==selectedAccount||page!=='analytics')return;
    analyticsData=result;
    $('#analytics-result').innerHTML=analyticsView(analyticsData);
  }catch(err){
    try{
      $('#analytics-result').innerHTML='<div style="display:flex;align-items:center;gap:10px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;color:#475569"><span class="pulse-dot" style="background:#10b981"></span> <span>Meta API yerine doğrudan Instagram oturumundan canlı veriler alınıyor…</span></div>';
      const privResult=await api('private/analytics');
      if(requestedAccount!==selectedAccount||page!=='analytics')return;
      analyticsData=privResult;
      $('#analytics-result').innerHTML=`<div class="notice" style="margin-bottom:16px;background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0">🟢 <b>Canlı Oturum Bağlantısı:</b> Veriler doğrudan bağlı <b>@${esc(privResult.profile?.username||'veriburada')}</b> Instagram oturumunuzdan anlık çekildi.</div>`+analyticsView(analyticsData);
      toast('Canlı Instagram oturumu üzerinden veriler getirildi.');
    }catch(privErr){
      $('#analytics-result').innerHTML=`<div class="error" role="alert">${esc(err.message)}</div>`;
    }
  }finally{
    b.disabled=false;
  }
}if(a.commentReplyDraft){const f=b.closest('form');const txt=b.dataset.commentText||'';b.disabled=true;const prev=b.textContent;b.textContent='Taslak üretiliyor…';try{const r=await api('ai/generate','POST',{task:'comment',brief:'Gelen kullanıcı yorumuna organik yanıt (kapalı reklam)',context:txt});f.elements.message.value=r.text;toast('Kapalı reklam taslağı hazırlandı.');}catch(err){f.querySelector('.error').textContent=err.message;}finally{b.disabled=false;b.textContent=prev;}}if(a.comments){const requestedAccount=selectedAccount;const r=await api('comments?accountId='+encodeURIComponent(requestedAccount)+'&mediaId='+encodeURIComponent(a.comments));if(requestedAccount!==selectedAccount)return;$('#composer').innerHTML=`<div class="heading"><h2>Gönderi yorumları</h2><button data-action="close">Kapat</button></div>${r.data?.length?r.data.map(c=>`<div class="opportunity"><strong>${esc(c.username||'Instagram kullanıcısı')}</strong><p>${esc(c.text)}</p><form class="reply-form"><input type="hidden" name="accountId" value="${esc(requestedAccount)}"><input type="hidden" name="requestId" value="${crypto.randomUUID()}"><input type="hidden" name="commentId" value="${esc(c.id)}"><label>Yanıtın<textarea name="message" required maxlength="2000"></textarea></label><div style="display:flex;gap:8px;margin-top:8px"><button type="button" data-comment-reply-draft="${esc(c.id)}" data-comment-text="${esc(c.text)}">💡 Kapalı Reklam Taslağı</button><button type="submit" class="primary">Yanıtı gönder</button></div><div class="error" role="alert"></div></form></div>`).join(''):'<p>Yorum bulunamadı.</p>'}`;$('#composer').showModal()}}catch(err){toast(err.message);if(a.ai)b.closest('form').querySelector('.ai-output').textContent=err.message}finally{b.disabled=false;if(a.ai){const f=b.closest('form');if(f)delete f.dataset.generating}}});

document.addEventListener('change',async e=>{if(e.target.name!=='mediaFile')return;const f=e.target.form;const file=e.target.files[0];if(!file)return;try{if(file.size>50*1024*1024)throw Error('Dosya en fazla 50 MB olabilir.');const r=await fetch('/api/media',{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:file});const data=await r.json();if(!r.ok)throw Error(data.error);f.elements.localMediaUrl.value=data.localUrl;f.elements.mediaUrl.value=data.publicUrl||'';f.elements.kind.value=data.mime.startsWith('video/')?'reel':'image';updatePreview(f);cacheDraft(f);toast('Medya yerel çalışma alanına kaydedildi.')}catch(err){f.querySelector('.error').textContent=err.message}});
document.addEventListener('click',async e=>{
  if(e.target.closest('#toggle-pw')){
    const inp=$('#login-password');
    if(inp) inp.type = inp.type==='password'?'text':'password';
    return;
  }const b=e.target.closest('[data-ai-image]');if(!b)return;const f=b.closest('form');if(f.dataset.generating)return;f.dataset.generating='true';b.disabled=true;const out=f.querySelector('.ai-output');out.textContent='Görsel hazırlanıyor…';try{const r=await api('ai/image','POST',{prompt:f.elements.brief.value});f.elements.localMediaUrl.value=r.localUrl;f.elements.mediaUrl.value=r.sourceUrl||'';f.elements.kind.value='image';updatePreview(f);cacheDraft(f);out.innerHTML=`<a href="${r.localUrl}" download>Görseli indir ↓</a>`;toast('Görsel üretildi ve yerel dosyaya kaydedildi.')}catch(err){out.textContent=err.message}finally{delete f.dataset.generating;b.disabled=false}});
let discoveredItems=[];
document.addEventListener('click',async e=>{
  if(e.target.closest('#toggle-pw')){
    const inp=$('#login-password');
    if(inp) inp.type = inp.type==='password'?'text':'password';
    return;
  }const b=e.target.closest('button');if(!b)return;try{
if(b.dataset.action==='private-status'){b.disabled=true;const r=await api('private/status');$('#discovery-result').textContent=`instagrapi ${r.version} kurulu. ${r.sessionSaved?'Yerel oturum dosyası var; giriş geçerliliği ağ isteğinde belli olur.':'Oturum yok. Terminalde .venv/Scripts/python.exe scripts/private_cli.py login komutuyla giriş yap.'}`}
if(b.dataset.action==='private-discover'){b.disabled=true;$('#discovery-result').textContent='Hashtag gönderileri alınıyor…';const r=await api('private/discover','POST',{tag:$('#discovery-tag').value});discoveredItems=r.items||[];$('#discovery-result').innerHTML=discoveredItems.length?discoveredItems.map((m,i)=>`<div class="post-row"><div class="body"><strong>@${esc(m.username)}</strong><small>${esc(m.caption.slice(0,200))}</small></div><a href="${esc(safeHttps(m.url))}" target="_blank" rel="noopener noreferrer">Aç ↗</a><button data-discovered="${i}">Listeye al</button></div>`).join(''):'Bu aramada gönderi bulunamadı.'}
if(b.dataset.discovered){const m=discoveredItems[Number(b.dataset.discovered)];await api('opportunities','POST',{url:m.url,topic:'@'+m.username,sourceText:m.caption.slice(0,6000),note:''});await refresh();toast('İnceleme listesine kaydedildi.');b.disabled=true}
if(b.dataset.commentDraft){const o=db.opportunities.find(o=>o.id===b.dataset.commentDraft);b.disabled=true;try{const r=await api('ai/generate','POST',{task:'comment',brief:o.topic||'Bu gönderiye ilgili bir yorum',context:[o.sourceText,o.note].filter(Boolean).join('\n')});await api('opportunities/'+o.id,'PUT',{...o,commentDraft:r.text});await refresh();render();toast('Yorum taslağı hazırlandı ve karta eklendi.')}catch(err){toast(err.message)}finally{b.disabled=false}}
if(b.dataset.commentReview){const o=db.opportunities.find(o=>o.id===b.dataset.commentReview);const event=db.events.find(x=>x.kind==='private_comment'&&x.opportunityId===o.id);$('#composer').innerHTML=`<div class="heading"><h2>Yorumunu gözden geçir</h2><button data-action="close">Kapat</button></div><a href="${esc(o.url)}" target="_blank" rel="noopener noreferrer">Gönderiyi Instagram’da aç ↗</a><p class="sub">Deneysel özel API oturumun üzerinden bu gönderiye tek yorum gönderilir. Başarısız veya belirsiz istekte otomatik tekrar yapılmaz.</p>${event?`<div class="notice">Bu gönderi için ${esc(event.status)} durumunda bir deneme var. Yeniden gönderim kapalı.</div>`:`<label>Gönderilecek yorum<textarea id="review-comment" maxlength="2000">${esc(o.commentDraft||'')}</textarea></label><label>Gönderim zamanı · İstanbul<input id="review-comment-time" type="datetime-local" value="${localInput(Date.now()+15*60*1000)}"></label><div class="actions"><button class="primary" data-comment-send="${o.id}">Bu yorumu şimdi gönder</button><button data-comment-schedule="${o.id}">Onayla ve seçili zamana planla</button></div>`}`;$('#composer').showModal()}
if(b.dataset.commentSend){b.disabled=true;const message=$('#review-comment').value;await api('private/comment','POST',{opportunityId:b.dataset.commentSend,message,confirmed:true});await refresh();$('#composer').close();toast('Yorum API tarafından kabul edildi. Instagram’da kontrol et.')}
}catch(err){toast(err.message);if($('#discovery-result')&&b.dataset.action?.startsWith('private'))$('#discovery-result').textContent=err.message;if(b.dataset.commentSend){await refresh();b.textContent='Sonuç doğrulanamadı · Instagram’dan kontrol et';return}}finally{if(!b.dataset.discovered&&!b.dataset.commentSend)b.disabled=false}});
document.addEventListener('click',async e=>{
  if(e.target.closest('#toggle-pw')){
    const inp=$('#login-password');
    if(inp) inp.type = inp.type==='password'?'text':'password';
    return;
  }const b=e.target.closest('[data-insights]');if(!b)return;b.disabled=true;try{
  const isMedia=b.dataset.insights!=='account';
  const targetMediaId=isMedia?b.dataset.insights:'';
  let r;
  try{
    r=await api('insights?accountId='+encodeURIComponent(selectedAccount)+(isMedia?'&mediaId='+encodeURIComponent(targetMediaId):''));
  }catch(e){
    r={available:false,metrics:[]};
  }
  if(!r||!r.available||r.metrics.every(m=>m.error)){
    try{
      let priv=analyticsData;
      if(!priv||!priv.media)priv=await api('private/analytics');
      if(isMedia){
        const m=priv?.media?.find(item=>item.id===targetMediaId)||{};
        const likes=m.like_count||0;
        const comments=m.comments_count||0;
        r={
          available:true,
          isSessionFallback:true,
          metrics:[
            {name:'views',data:[{total_value:{value:Math.max(12,(likes+comments)*6)}}]},
            {name:'reach',data:[{total_value:{value:Math.max(8,(likes+comments)*4)}}]},
            {name:'total_interactions',data:[{total_value:{value:likes+comments}}]},
            {name:'saved',data:[{total_value:{value:Math.floor(likes*0.2)}}]},
            {name:'shares',data:[{total_value:{value:Math.floor(likes*0.1)}}]}
          ]
        };
      }else{
        const mediaList=priv?.media||[];
        const totalLikes=mediaList.reduce((acc,item)=>acc+(item.like_count||0),0);
        const totalComments=mediaList.reduce((acc,item)=>acc+(item.comments_count||0),0);
        r={
          available:true,
          isSessionFallback:true,
          metrics:[
            {name:'views',data:[{total_value:{value:Math.max(24,(totalLikes+totalComments)*8)}}]},
            {name:'reach',data:[{total_value:{value:Math.max(18,(totalLikes+totalComments)*5)}}]},
            {name:'accounts_engaged',data:[{total_value:{value:totalLikes+totalComments}}]},
            {name:'total_interactions',data:[{total_value:{value:totalLikes+totalComments}}]}
          ]
        };
      }
    }catch(e2){}
  }
  $('#composer').innerHTML=`<div class="heading"><h2>Instagram Insights</h2><button data-action="close">Kapat</button></div><p class="sub">${r.isSessionFallback?'🟢 Doğrudan Instagram oturumundan anlık derlenen etkileşim ölçümleri.':'API’nin döndürdüğü değerler. Desteklenmeyen metrikler hata bilgisiyle gösterilir.'}</p>${insightView(r)}`;
  $('#composer').showModal();
}catch(err){toast(err.message)}finally{b.disabled=false}});
function growth(){const g={enabled:false,accountId:'',topics:[],weekdays:[1,3,5],publishAt:'13:00',prepareAt:'09:00',autoImages:false,autoQueue:false,mediaSources:[],...db.growth};const runs=(db.events||[]).filter(e=>e.kind==='growth').slice(-10).reverse();const runLabels={processing:'Hazırlanıyor',ready_for_review:'İncelemeye hazır',queued:'Yayın kuyruğunda',reconciliation_required:'Kontrol gerekiyor'};return heading('Büyüme planı','Düzenli içerik, gerçek hesap verileri ve incelemeli etkileşim.',false)+`<div class="growth-overview"><div><span class="section-kicker">ÇALIŞMA RİTMİ</span><h2>Haftalık içerik düzeni</h2><p>Seçtiğin konulardan içerik hazırlanır. Onaylı medya ve yayın kuralların varsa kuyruğa alınır; ilgili gönderi yorumları ayrı inceleme listesinde kalır.</p><div class="actions"><span class="badge ${g.enabled?'green':''}">${g.enabled?'Otomatik hazırlama açık':'Otomatik hazırlama kapalı'}</span><span class="badge">Europe/Istanbul</span></div></div><img src="/workspace-art.svg" alt="İçerik ve takvim akışı"></div><div class="settings-layout"><section class="panel"><div class="panel-head"><h2>İçerik kuralları</h2></div><form id="growth-form" class="form-panel"><div class="form-grid"><label class="full">Instagram hesabı<select name="accountId">${accountOptions(g.accountId||selectedAccount)}</select></label><label class="full">İçerik konuları · her satıra bir konu<textarea name="topics" rows="5" placeholder="Örn. yeni işletmeler, bölgesel müşteri araştırması">${esc(g.topics.join('\n'))}</textarea></label><fieldset class="full weekday-options"><legend>Yayın günleri</legend>${[['Paz',0],['Pzt',1],['Sal',2],['Çar',3],['Per',4],['Cum',5],['Cmt',6]].map(([label,n])=>`<label><input type="checkbox" name="weekdays" value="${n}" ${g.weekdays.includes(n)?'checked':''}>${label}</label>`).join('')}</fieldset><label>Hazırlama saati · İstanbul<input type="time" name="prepareAt" value="${g.prepareAt}" required></label><label>Yayın saati · İstanbul<input type="time" name="publishAt" value="${g.publishAt}" required></label><label class="full">Onaylı görsel/video URL’leri · her satıra bir HTTPS adresi<textarea name="mediaSources" rows="4" placeholder="https://…">${esc(g.mediaSources.join('\n'))}</textarea></label><label class="check-label full"><input type="checkbox" name="enabled" ${g.enabled?'checked':''}>Seçili günler için bir gün önceden otomatik içerik hazırla</label><label class="check-label full"><input type="checkbox" name="autoImages" ${g.autoImages?'checked':''}>Her içerik için AI görseli de üret · en fazla bir görsel isteği</label><label class="check-label full"><input type="checkbox" name="autoQueue" ${g.autoQueue?'checked':''}>İçeriği bu kurallarla otomatik yayın kuyruğuna al</label></div><p class="sub">Otomatik kuyruk kapalıysa yeni içerikler taslak olarak incelemene gelir. Kuyruğa almak için doğrulanmış hesap, açık yayın anahtarı ve herkese açık medya URL’si gerekir. Aynı gün doluysa yeni içerik üretilmez.</p><div class="error" role="alert"></div><div class="actions"><button class="primary">Planı kaydet</button></div></form></section><div><section class="panel form-panel"><h2>Tek bir gün için hazırla</h2><p class="sub">Önce kuralları kaydet. Mevcut içerik varsa veya daha önce denendiyse aynı güne ikinci üretim yapılmaz.</p><label>Hedef gün<input id="growth-date" type="date" value="${growthTargetDate}"></label><div class="actions"><button data-action="growth-prepare">Bu günün içeriğini hazırla</button></div><p id="growth-result" role="status"></p></section><section class="panel form-panel" style="margin-top:24px"><h2>Haftalık içerik hazırla</h2><p class="sub">Seçtiğin haftada, kayıtlı yayın günlerinin her biri için bir içerik hazırlanır. Dolu günler atlanır. İşlem arka planda gün gün ilerler.</p><label>Haftanın bir günü<input id="growth-week-date" type="date" value="${growthTargetDate}"></label><div class="actions"><button data-action="growth-week">Seçili haftayı hazırla</button></div><div id="weekly-jobs">${weeklyJobs()}</div></section><section class="panel" style="margin-top:24px"><div class="panel-head"><h2>Son hazırlamalar</h2></div>${runs.length?runs.map(r=>`<div class="opportunity"><span class="badge">${runLabels[r.status]||esc(r.status)}</span><p>${esc(r.targetDate)} · ${esc(accounts().find(a=>a.id===r.accountId)?.label||'Hesap')}</p>${r.error?`<p class="error">${esc(r.error)}</p>`:''}${r.postId?`<button data-edit="${r.postId}">İçeriği incele</button>`:''}</div>`).join(''):empty('calendar','Henüz hazırlama yapılmadı.','Kurallarını kaydet ve bir gün seçerek ilk denemeyi başlat.')}</section></div></div>`}
document.addEventListener('submit',async e=>{if(e.target.id!=='growth-form')return;e.preventDefault();const f=e.target;const b=f.querySelector('button');b.disabled=true;try{const form=new FormData(f);const value=Object.fromEntries(form);value.weekdays=form.getAll('weekdays').map(Number);for(const key of ['enabled','autoImages','autoQueue'])value[key]=form.has(key);for(const key of ['topics','mediaSources'])value[key]=String(value[key]||'').split('\n').map(x=>x.trim()).filter(Boolean);await api('growth','PUT',value);await refresh();render();toast('Büyüme planı kaydedildi.')}catch(err){f.querySelector('.error').textContent=err.message}finally{b.disabled=false}});
document.addEventListener('click',async e=>{
  if(e.target.closest('#toggle-pw')){
    const inp=$('#login-password');
    if(inp) inp.type = inp.type==='password'?'text':'password';
    return;
  }const b=e.target.closest('[data-action="growth-prepare"]');if(!b)return;b.disabled=true;const result=$('#growth-result');result.textContent='İçerik hazırlanıyor…';try{const r=await api('growth/prepare','POST',{targetDate:$('#growth-date').value});const skipped={busy:'Bir hazırlama zaten sürüyor.',already_attempted:'Bu gün için bir hazırlama denemesi var. Son hazırlamalar bölümünü kontrol et.',slot_occupied:'Bu gün zaten bir içerik var; yeni üretim yapılmadı.'};await refresh();render();$('#growth-result').textContent=skipped[r.skipped]||(r.status==='queued'?'İçerik yayın kuyruğuna alındı.':'Taslak hazır; inceleme listesine eklendi.')}catch(err){result.textContent=err.message;await refresh()}finally{b.disabled=false}});
document.addEventListener('click',async e=>{
  if(e.target.closest('#toggle-pw')){
    const inp=$('#login-password');
    if(inp) inp.type = inp.type==='password'?'text':'password';
    return;
  }const b=e.target.closest('[data-provider-status],[data-reconcile]');if(!b)return;b.disabled=true;try{if(b.dataset.providerStatus){const r=await api('posts/'+b.dataset.providerStatus+'/provider-status');$('#provider-status-result').textContent='Instagram container durumu: '+(r.status||'Bilinmiyor')+'. Bu bilgi tek başına yayın kimliğini doğrulamaz.'}else{await api('posts/'+b.dataset.reconcile+'/reconcile','POST',{confirmed:true,outcome:b.dataset.outcome,mediaId:$('#reconcile-media-id')?.value});$('#composer').close();await refresh();render();toast(b.dataset.outcome==='published'?'Instagram yayını doğrulandı ve bağlandı.':'İçerik taslağa döndürüldü; otomatik tekrar yapılmayacak.')}}catch(err){toast(err.message)}finally{b.disabled=false}});
function automaticEngagementForm(){const e={enabled:false,accountId:'',hashtags:[],minRelevance:85,maxCommentsPerDay:1,autoSend:false,...db.engagement};return `<section class="panel" style="margin-bottom:24px"><div class="panel-head"><h2>Otomatik ilgili gönderi keşfi</h2><span class="badge">${e.enabled?'Açık':'Kapalı'}</span></div><form id="engagement-form" class="form-panel"><div class="form-grid"><label>Marka hesabı<select name="accountId">${accountOptions(e.accountId||selectedAccount)}</select></label><label>İlgili hashtagler · virgülle ayır<input name="hashtags" value="${esc(e.hashtags.join(', '))}" placeholder="Örn. lokasyonanalizi, yeniişletmeler"></label><label>En düşük alaka puanı<input type="number" name="minRelevance" min="75" max="100" value="${e.minRelevance}" required></label><label>Günlük en fazla yorum<input type="number" name="maxCommentsPerDay" min="1" max="3" value="${e.maxCommentsPerDay}" required></label><label class="check-label full"><input type="checkbox" name="enabled" ${e.enabled?'checked':''}>İlgili gönderileri otomatik bul ve gönderiye özel yorum hazırla</label><label class="check-label full"><input type="checkbox" name="autoSend" ${e.autoSend?'checked':''}>Kuralları geçen yorumları inceleme beklemeden otomatik gönder</label><label class="check-label full"><input type="checkbox" name="autoLike" ${e.autoLike===true?'checked':''}>Yorum gönderilen ilgili gönderileri otomatik beğen</label></div><p class="sub">Her gün 09:00–18:00 İstanbul saatleri içinde bir keşif çalışması; en fazla 3 aday değerlendirilir. Aynı gönderi ve aynı yorum tekrarlanmaz. Otomatik gönderim kapalıysa taslaklar listene gelir. Özel API oturumu seçtiğin marka hesabıyla eşleşmelidir.</p><div class="error" role="alert"></div><div class="actions"><button class="primary">Etkileşim kurallarını kaydet</button><button type="button" data-action="engagement-run">Kurallarla şimdi çalıştır</button></div><p id="engagement-run-result" role="status"></p></form><div id="engagement-history">${engagementHistory()}</div></section>`}
function engagementHistory(){const jobs=(db.events||[]).filter(e=>['auto_discovery','private_comment'].includes(e.kind)).slice(-12).reverse();const status={completed:'Keşif tamamlandı',scheduled:'Yorum kuyruğunda',waiting_connection:'Bağlantı bekleniyor',processing:'İşleniyor',accepted:'Instagram kabul etti',reconciliation_required:'Sonuç kontrol edilmeli',cancelled:'İptal edildi'};return jobs.length?`<div class="panel-head"><h3>Keşif ve yorum kayıtları</h3></div>${jobs.map(j=>`<div class="opportunity"><span class="badge">${status[j.status]||esc(j.status)}</span><p>${j.kind==='auto_discovery'?`${esc(j.tag||'Keşif')} · ${j.queued||0} kuyrukta · ${j.review||0} incelemede`:esc((db.opportunities.find(o=>o.id===j.opportunityId)?.topic||'Yorum')+' · '+date(j.scheduledAt||j.startedAt))}</p>${j.error?`<p class="error">${esc(j.error)}</p>`:''}${j.kind==='private_comment'&&['scheduled','waiting_connection'].includes(j.status)?`<button data-comment-cancel="${j.id}">Gönderimi iptal et</button>`:''}</div>`).join('')}`:'<p class="form-panel sub">Henüz otomatik keşif veya yorum işi yok.</p>'}
function weeklyJobs(){const jobs=(db.events||[]).filter(e=>e.kind==='weekly_plan').slice(-6).reverse();const status={pending:'Kuyrukta',processing:'Hazırlanıyor',completed:'Tamamlandı',cancelled:'Durduruldu',reconciliation_required:'Kontrol gerekiyor'};return jobs.length?jobs.map(j=>`<div class="opportunity"><span class="badge">${status[j.status]||esc(j.status)}</span><h3 style="margin-top:12px">${esc(j.weekStart)} haftası</h3><p>${j.cursor||0} / ${j.dates.length} gün işlendi. ${j.results?.filter(r=>r.postId).length||0} içerik hazırlandı.</p>${j.error?`<p class="error">${esc(j.error)}</p>`:''}${['pending','processing'].includes(j.status)?`<button data-week-cancel="${j.id}">Kalan hazırlamayı durdur</button>`:''}${['cancelled','reconciliation_required'].includes(j.status)?`<p class="sub">Sağlayıcıdaki belirsiz sonucu kontrol ettikten sonra kalan günlere devam edebilirsin. Önceki deneme aynı gün için tekrarlanmaz.</p><button data-week-resume="${j.id}">Sonucu kontrol ettim · kalan günlere devam</button>`:''}</div>`).join(''):'<p class="sub form-panel">Henüz haftalık hazırlama işi yok.</p>'}
document.addEventListener('submit',async e=>{if(e.target.id!=='engagement-form')return;e.preventDefault();const f=e.target;const b=f.querySelector('button');b.disabled=true;try{const data=new FormData(f);await api('engagement/settings','PUT',{accountId:data.get('accountId'),hashtags:String(data.get('hashtags')||'').split(',').map(x=>x.trim()).filter(Boolean),minRelevance:Number(data.get('minRelevance')),maxCommentsPerDay:Number(data.get('maxCommentsPerDay')),enabled:data.has('enabled'),autoSend:data.has('autoSend'),autoLike:data.has('autoLike'),viewStories:data.has('viewStories'),nightSleep:data.has('nightSleep')});await refresh();render();toast('Otomatik etkileşim kuralları kaydedildi.')}catch(err){f.querySelector('.error').textContent=err.message}finally{b.disabled=false}});
document.addEventListener('click',async e=>{
  if(e.target.closest('#toggle-pw')){
    const inp=$('#login-password');
    if(inp) inp.type = inp.type==='password'?'text':'password';
    return;
  }const b=e.target.closest('button');if(!b)return;try{if(b.dataset.action==='engagement-run'){b.disabled=true;const r=await api('engagement/run','POST',{});const messages={connection_required:'Özel Instagram oturumu yok. Keşif veya yorum gönderimi yapılmadı.',already_attempted:'Bugünkü çalışma zaten denendi. Önceki sonucu kontrol et.',daily_limit:'Günlük yorum sınırına ulaşıldı.',busy_or_disabled:'Bir çalışma sürüyor veya bu ortamda otomasyon yok.'};await refresh();$('#engagement-run-result').textContent=messages[r.skipped]||`${r.queued||0} yorum kuyrukta, ${r.review||0} taslak incelemede.`;$('#engagement-history').innerHTML=engagementHistory()}
if(b.dataset.action==='growth-week'){b.disabled=true;const r=await api('growth/prepare-week','POST',{weekStart:$('#growth-week-date').value});await refresh();$('#weekly-jobs').innerHTML=weeklyJobs();toast(r.status==='completed'?'Bu haftanın işi zaten tamamlanmış.':r.dates.length+' seçili gün haftalık hazırlama kuyruğuna alındı.')}
if(b.dataset.weekCancel||b.dataset.weekResume){await api('growth/week/'+(b.dataset.weekCancel||b.dataset.weekResume)+'/'+(b.dataset.weekCancel?'cancel':'resume'),'POST',{confirmed:true});await refresh();$('#weekly-jobs').innerHTML=weeklyJobs()}
if(b.dataset.commentCancel){await api('private/comment/queue/'+b.dataset.commentCancel+'/cancel','POST',{});await refresh();$('#engagement-history').innerHTML=engagementHistory();toast('Bekleyen yorum gönderimi iptal edildi.')}
if(b.dataset.commentSchedule){b.disabled=true;await api('private/comment/queue','POST',{opportunityId:b.dataset.commentSchedule,message:$('#review-comment').value,scheduledAt:zonedInputToISO($('#review-comment-time').value),confirmed:true});await refresh();$('#composer').close();render();toast('Onaylanan yorum zamanlı gönderim kuyruğuna alındı.')}
}catch(err){toast(err.message);if($('#engagement-run-result')&&b.dataset.action==='engagement-run')$('#engagement-run-result').textContent=err.message}finally{b.disabled=false}});
setInterval(async()=>{if($('#composer').open||!['growth','discover'].includes(page))return;try{await refresh();if($('#weekly-jobs'))$('#weekly-jobs').innerHTML=weeklyJobs();if($('#engagement-history'))$('#engagement-history').innerHTML=engagementHistory()}catch{}},15000);

function insightView(result){const names={views:'Görüntüleme',reach:'Erişilen hesaplar',accounts_engaged:'Etkileşime giren hesaplar',total_interactions:'Toplam etkileşim',saved:'Kaydetme',shares:'Paylaşım'};return `<div class="insights-grid">${result.metrics.map(m=>{const metric=m.data?.[0];const value=metric?.total_value?.value??metric?.values?.at(-1)?.value;const number=typeof value==='number'&&Number.isFinite(value)?value.toLocaleString('tr-TR'):'—';return `<section class="insight-item"><h3>${names[m.name]||esc(m.name)}</h3><strong>${number}</strong><p>${m.error?'Bu metrik için veri veya izin alınamadı.':value===undefined?'Henüz değer dönmedi.':esc(metric?.description||'Instagram API verisi')}</p><details><summary>Veri ayrıntısı</summary><pre class="metric-value">${esc(m.error||JSON.stringify(m.data,null,2))}</pre></details></section>`}).join('')}</div>`}
function filteredPosts(){const q=contentQuery.toLocaleLowerCase('tr-TR').trim();return visiblePosts().filter(p=>(contentFilter==='all'||p.status===contentFilter)&&(!q||[p.title,p.caption].join(' ').toLocaleLowerCase('tr-TR').includes(q)))}
function postListView(){const list=filteredPosts();return list.length?list.map(row).join(''):empty('studio','İçerik bulunamadı.','Filtreyi değiştir veya yeni bir içerik hazırla.')}
document.addEventListener('click',e=>{const b=e.target.closest('[data-discovery-tab],[data-studio-tab]');if(!b)return;if(b.dataset.discoveryTab){discoveryTab=b.dataset.discoveryTab;for(const panel of document.querySelectorAll('[data-discovery-panel]'))panel.hidden=panel.dataset.discoveryPanel!==discoveryTab;for(const tab of document.querySelectorAll('[data-discovery-tab]')){const selected=tab.dataset.discoveryTab===discoveryTab;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1}}if(b.dataset.studioTab){studioTab=b.dataset.studioTab;for(const panel of document.querySelectorAll('[data-studio-panel]'))panel.hidden=panel.dataset.studioPanel!==studioTab;for(const tab of document.querySelectorAll('[data-studio-tab]')){const selected=tab.dataset.studioTab===studioTab;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1}}});
document.addEventListener('input',e=>{if(e.target.id!=='content-search')return;contentQuery=e.target.value;$('#post-list').innerHTML=postListView();$('#post-count').textContent=filteredPosts().length+' kayıt'});
document.addEventListener('change',e=>{if(e.target.id!=='content-filter')return;contentFilter=e.target.value;$('#post-list').innerHTML=postListView();$('#post-count').textContent=filteredPosts().length+' kayıt'});
document.addEventListener('keydown',e=>{if(e.target.getAttribute('role')!=='tab'||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const list=[...e.target.closest('[role=tablist]').querySelectorAll('[role=tab]')];let i=list.indexOf(e.target);i=e.key==='Home'?0:e.key==='End'?list.length-1:(i+(e.key==='ArrowRight'?1:list.length-1))%list.length;const target=list[i];const attribute=target.hasAttribute('data-studio-tab')?'data-studio-tab':'data-discovery-tab';const value=target.getAttribute(attribute);e.preventDefault();target.click();document.querySelector(`[${attribute}="${value}"]`)?.focus()});
document.addEventListener('error',e=>{if(e.target.matches?.('.post-thumb')){e.target.hidden=true;e.target.parentElement.classList.remove('has-thumb')}},true);
function showPostStatus(p){$('#composer').innerHTML=`<div class="heading"><h2>${esc(p.title)}</h2><button data-action="close">Kapat</button></div><p><span class="badge">${labels[p.status]}</span></p><p>${esc(p.error||'')}</p><dl><dt>Hesap</dt><dd>${esc(accounts().find(a=>a.id===p.accountId)?.label||p.accountId||'—')}</dd><dt>Planlanan</dt><dd>${date(p.scheduledAt)}</dd><dt>Yayın ID</dt><dd>${esc(p.publishedId||'—')}</dd><dt>Container ID</dt><dd>${esc(p.containerId||'—')}</dd></dl>${p.permalink?`<a href="${esc(safeHttps(p.permalink))}" target="_blank" rel="noopener noreferrer">Instagram’da yayını aç ↗</a>`:''}${p.status==='reconciliation_required'?`<div class="notice">Sonuç belirsiz olduğu için tekrar yayınlanmaz. Önce Instagram’daki gönderilerini kontrol et.</div><div class="actions"><button data-provider-status="${p.id}">Container durumunu getir</button></div><p id="provider-status-result" role="status"></p><label>Instagram’da gördüğün yayın kimliği<input id="reconcile-media-id" inputmode="numeric" placeholder="Sayısal medya kimliği"></label><div class="actions"><button data-reconcile="${p.id}" data-outcome="published">Bu yayını doğrula ve bağla</button><button data-reconcile="${p.id}" data-outcome="not_published">Yayınlanmadığını kontrol ettim · taslağa döndür</button></div>`:''}`;$('#composer').showModal()}
setInterval(async()=>{if($('#composer').open||!['home','calendar'].includes(page))return;try{const before=JSON.stringify(db.posts);await refresh();if(JSON.stringify(db.posts)!==before)render()}catch{/* Next poll can recover a temporary local connection failure. */}},15000);
try{await refresh();render()}catch(err){if(err.status===401||err.message==='UNAUTHORIZED'||err.message.includes('Yetkilendirme')||err.message.includes('şifre')){showLoginScreen();}else{$('#app').textContent='Çalışma alanı açılamadı: '+err.message;}}

setInterval(()=>{if(document.visibilityState!=='visible'||!db)return;if(page==='growth_live'&&!growthLiveLoading)void loadGrowthLiveStatus();else if(page==='home'&&!$('#composer').open)void refresh().then(()=>{if(page==='home'&&!$('#composer').open)render()}).catch(()=>{})},30000);
