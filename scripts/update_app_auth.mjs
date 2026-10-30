import fs from 'node:fs';

let code = fs.readFileSync('public/app.js', 'utf8');

const oldApi = "async function api(path,method='GET',body){const r=await fetch('/api/'+path,{method,headers:body?{'Content-Type':'application/json'}:{},\nbody:body?JSON.stringify(body):undefined});const data=await r.json();if(!r.ok)throw Error(data.error||'İşlem tamamlanamadı.');return data}";

// Match more flexibly:
const apiRegex = /async function api\(path,method='GET',body\)\{[\s\S]*?return data\}/;

const newApiImpl = `function showLoginScreen(error=''){
  $('#app').innerHTML = \`<div class="login-screen" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0d1117;padding:20px;font-family:sans-serif;">
    <div style="max-width:380px;width:100%;background:#161b22;border:1px solid #30363d;border-radius:12px;padding:32px;box-shadow:0 8px 24px rgba(0,0,0,0.5);text-align:center;">
      <img src="/logo.png" style="width:48px;height:48px;margin-bottom:16px;" alt="Socialdesk">
      <h2 style="color:#f0f6fc;margin:0 0 8px;font-size:20px;">Socialdesk Güvenli Giriş</h2>
      <p style="color:#8b949e;margin:0 0 24px;font-size:13px;">Veriburada çalışma alanını ve API ayarlarını korumak için şifrenizi girin.</p>
      <form id="auth-login-form" style="display:flex;flex-direction:column;gap:12px;">
        <input type="password" id="login-password" placeholder="Yönetim Şifresi" required autofocus style="width:100%;padding:10px 14px;border-radius:6px;border:1px solid #30363d;background:#0d1117;color:#f0f6fc;font-size:14px;box-sizing:border-box;">
        <div id="login-error" style="color:#f85149;font-size:13px;min-height:18px;">\${esc(error)}</div>
        <button type="submit" class="primary" style="padding:10px;border-radius:6px;font-weight:600;cursor:pointer;background:#238636;color:#fff;border:none;">Giriş Yap</button>
      </form>
    </div>
  </div>\`;
}
async function api(path,method='GET',body){
  const token=localStorage.getItem('socialdesk_auth_token')||'';
  const headers={...(body?{'Content-Type':'application/json'}:{}),...(token?{'x-socialdesk-auth':token}:{})};
  const r=await fetch('/api/'+path,{method,headers,body:body?JSON.stringify(body):undefined});
  const data=await r.json();
  if(r.status===401){showLoginScreen();throw Error(data.error||'Lütfen şifrenizle giriş yapın.');}
  if(!r.ok)throw Error(data.error||'İşlem tamamlanamadı.');
  return data;
}`;

if (apiRegex.test(code)) {
  code = code.replace(apiRegex, newApiImpl);
  console.log('Successfully replaced api() implementation');
} else {
  console.error('Could not match api() implementation with regex');
}

// Add logout button in header:
const headerPattern = /<button class="badge" data-page="settings">[\s\S]*?<\/button><\/div><\/header>/;
code = code.replace(headerPattern, (match) => {
  return match.replace('</div></header>', '<button data-action="logout" class="badge" title="Oturumu kilitle">🔒 Kitle</button></div></header>');
});

// Add submit handler for auth-login-form:
const submitPattern = /if\(!f\.matches\('\.integration-form,#ai-settings,\.reply-form'\)\)return;/;
if (submitPattern.test(code)) {
  const replacement = `if(f.id==='auth-login-form'){e.preventDefault();const pw=$('#login-password').value;const btn=f.querySelector('button');btn.disabled=true;try{const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Şifre hatalı.');localStorage.setItem('socialdesk_auth_token',data.token);await refresh();render();toast('Giriş başarılı.');}catch(err){$('#login-error').textContent=err.message;}finally{btn.disabled=false;}return;}if(!f.matches('.integration-form,#ai-settings,.reply-form'))return;`;
  code = code.replace(submitPattern, replacement);
  console.log('Successfully added auth-login-form submit handler');
}

// Add click action for logout:
const actionPattern = /const a=b\.dataset\.action;/;
if (actionPattern.test(code)) {
  const replacement = `const a=b.dataset.action;if(a==='logout'){await fetch('/api/auth/logout',{method:'POST'}).catch(()=>{});localStorage.removeItem('socialdesk_auth_token');showLoginScreen();toast('Oturum kilitlendi.');return;}`;
  code = code.replace(actionPattern, replacement);
  console.log('Successfully added logout click handler');
}

// Update status message in private-status:
code = code.replace(
  /\$('#discovery-result')\.textContent=`instagrapi [\s\S]*?`;/,
  `$('#discovery-result').textContent=r.message || (r.version==='cloud-engine'?'✅ Bulut sektörel fırsat motoru devrede.':\`instagrapi \${r.version} kurulu. \${r.sessionSaved?'Yerel oturum dosyası var.':'Oturum yok; bulut motoru devrede.'}\`);`
);

fs.writeFileSync('public/app.js', code, 'utf8');
console.log('Done updating public/app.js!');
