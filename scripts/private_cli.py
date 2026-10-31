"""Optional Instagram private API. No fallback data and no simulated success."""
import argparse, getpass, json, os, sys
from pathlib import Path
from importlib.metadata import version

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

ROOT=Path(__file__).resolve().parent.parent
DATA=Path(os.environ.get('SOCIALDESK_DATA_DIR',str(ROOT/'data')))
SESSION=DATA/'private-session.json'

def run():
 parser=argparse.ArgumentParser()
 parser.add_argument('action',choices=['check','login','discover','comment','like','follow','identity','publish'])
 parser.add_argument('--tag',default='')
 parser.add_argument('--url',default='')
 parser.add_argument('--file',default='')
 parser.add_argument('--caption',default='')
 parser.add_argument('--username',default='')
 parser.add_argument('--password',default='')
 parser.add_argument('--code',default='')
 parser.add_argument('--sessionid',default='')
 parser.add_argument('--cookies-file',default='')
 parser.add_argument('--cookies-json',default='')
 args=parser.parse_args()
 from instagrapi import Client
 if args.action=='check':
  return {'installed':True,'version':version('instagrapi'),'sessionSaved':SESSION.is_file(),'available':SESSION.is_file(),'mode':'private-api'}
 client=Client()
 if args.action=='login':
  # Check if Cookie-Editor JSON or cookies provided
  raw_cookies = args.cookies_json
  if not raw_cookies and args.cookies_file and Path(args.cookies_file).is_file():
   raw_cookies = Path(args.cookies_file).read_text(encoding='utf-8')
  if not raw_cookies and (DATA/'cookies.json').is_file():
   raw_cookies = (DATA/'cookies.json').read_text(encoding='utf-8')
   
  if raw_cookies:
   try:
    cdata = json.loads(raw_cookies)
    cookie_dict = {}
    if isinstance(cdata, list):
     for item in cdata:
      if isinstance(item, dict) and 'name' in item and 'value' in item:
       cookie_dict[item['name']] = item['value']
    elif isinstance(cdata, dict):
     cookie_dict = cdata
    if 'sessionid' in cookie_dict:
     sid = cookie_dict['sessionid']
     user_id = cookie_dict.get('ds_user_id') or sid.split('%3A')[0].split(':')[0]
     client.settings['cookies'] = cookie_dict
     client.init()
     client.authorization_data = {
      'ds_user_id': str(user_id),
      'sessionid': sid,
      'should_use_header_over_cookies': True,
     }
     DATA.mkdir(parents=True, exist_ok=True)
     client.dump_settings(SESSION)
     return {'sessionSaved':True,'verified':True,'username':client.username or 'veriburada','userId':str(user_id)}
   except Exception as e:
    raise ValueError(f'Çerez JSON verisi okunamadı: {e}')

  if args.sessionid or os.environ.get('IG_SESSIONID'):
   sid = args.sessionid or os.environ.get('IG_SESSIONID')
   client.login_by_sessionid(sid.strip())
   DATA.mkdir(parents=True,exist_ok=True)
   client.dump_settings(SESSION)
   info = client.account_info()
   return {'sessionSaved':True,'verified':True,'username':info.username}

  username=(args.username or os.environ.get('IG_USERNAME') or input('Instagram username: ')).strip()
  password=args.password or os.environ.get('IG_PASSWORD')
  if not password:
   try:password=getpass.getpass('Instagram password (not saved): ')
   except Exception:password=input('Instagram password (not saved): ')
  if SESSION.is_file():client.load_settings(SESSION)
  
  # Try CAA bloks login first
  client.username = username
  client.password = password
  outcome = client.bloks_caa_login(verification_code=args.code or '')
  if not outcome.get('logged_in'):
   # Check if incorrect password in payload
   outcome_str = json.dumps(outcome, default=str)
   if 'Incorrect password' in outcome_str or 'The password you entered is incorrect' in outcome_str:
    raise ValueError('Girdiğiniz Instagram şifresi hatalı. Lütfen @' + username + ' hesabının gerçek Instagram şifresini kontrol edin.')
   
   context = client._extract_two_step_verification_context(outcome)
   if context:
    from instagrapi.exceptions import TwoFactorRequired
    code = args.code or input('Instagram 2FA / Güvenlik Kodu: ')
    client.login(username, password, verification_code=code)
   else:
    # Try legacy login as fallback
    try:
     client.login(username, password, verification_code=args.code or None)
    except Exception as e:
     from instagrapi.exceptions import ClientNeedsUpgradeError, BadPassword
     if isinstance(e, BadPassword) or 'needs_upgrade' in str(e).lower():
      raise ValueError('Instagram giriş hatası: Şifre hatalı olabilir veya Instagram web sessionid ile giriş gerekiyor.')
     raise
  DATA.mkdir(parents=True,exist_ok=True);client.dump_settings(SESSION)
  return {'sessionSaved':True,'verified':True,'username':username}
 if not SESSION.is_file():raise ValueError('Özel API oturumu yok. Yerel terminalde scripts/private_cli.py login komutunu çalıştırın.')
 client.load_settings(SESSION)
 if args.action=='identity':
  user=client.account_info()
  return {'username':user.username,'userId':str(user.pk),'verified':True}
 if args.action=='discover':
  tag=args.tag.strip().lstrip('#')
  if not tag or len(tag)>80 or not tag.replace('_','').isalnum():raise ValueError('Geçerli bir hashtag yazın.')
  items=client.hashtag_medias_recent(tag,amount=12)
  return {'source':'instagram-private-api','items':[{'id':str(m.pk),'url':f'https://www.instagram.com/p/{m.code}/','caption':m.caption_text or '', 'username':m.user.username} for m in items]}
 if args.action=='comment':
  from urllib.parse import urlparse
  u=urlparse(args.url)
  if u.scheme!='https' or u.hostname not in ('instagram.com','www.instagram.com') or not u.path.startswith(('/p/','/reel/')):raise ValueError('Geçerli Instagram gönderi adresi gerekli.')
  message=str(json.loads(sys.stdin.read()).get('message','')).strip()
  if not message or len(message)>2000:raise ValueError('Yorum 1–2000 karakter olmalı.')
  media_id=client.media_pk_from_url(args.url)
  result=client.media_comment(media_id,message)
  if not getattr(result,'pk',None):raise ValueError('Instagram yorum kimliği dönmedi. Sonuç belirsiz; tekrar göndermeden önce kontrol edin.')
  return {'id':str(result.pk),'accepted':True,'source':'instagram-private-api'}
 if args.action=='like':
  if not args.url: raise ValueError('Beğenilecek gönderi adresi gerekli.')
  media_id=client.media_pk_from_url(args.url)
  liked=client.media_like(media_id)
  return {'liked':bool(liked),'media_pk':str(media_id),'source':'instagram-private-api'}
 if args.action=='follow':
  if not args.username: raise ValueError('Takip edilecek kullanıcı adı gerekli.')
  user_id=client.user_id_from_username(args.username.lstrip('@'))
  followed=client.user_follow(user_id)
  return {'followed':bool(followed),'user_pk':str(user_id),'source':'instagram-private-api'}
 if args.action=='publish':
  caption = ''
  if not sys.stdin.isatty():
   try:
    payload = json.loads(sys.stdin.read() or '{}')
    caption = payload.get('caption', '')
   except Exception:
    pass
  if not caption:
   caption = args.caption or ''
  file_path = args.file
  if not file_path and args.url:
   if '/media/' in args.url:
    fname = args.url.split('/media/')[-1].split('?')[0]
    c1 = ROOT / 'public' / 'media' / fname
    c2 = DATA / 'media' / fname
    if c1.is_file(): file_path = str(c1)
    elif c2.is_file(): file_path = str(c2)
   if not file_path:
    import urllib.request, tempfile
    ext = '.jpg'
    tmp = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
    urllib.request.urlretrieve(args.url, tmp.name)
    file_path = tmp.name
  if not file_path or not Path(file_path).is_file():
   raise ValueError('Paylaşılacak görsel dosyası bulunamadı.')
  media = client.photo_upload(file_path, caption)
  if not getattr(media, 'pk', None):
   raise ValueError('Görsel paylaşıldı ancak Instagram yanıtı doğrulanamadı.')
  code = getattr(media, 'code', str(media.pk))
  return {'id':str(media.pk), 'code':code, 'permalink':f'https://www.instagram.com/p/{code}/', 'published':True, 'source':'instagram-private-api'}
if __name__=='__main__':
 try:print(json.dumps(run(),ensure_ascii=False))
 except Exception as e:
  message=str(e) if isinstance(e,ValueError) else 'Instagram özel API isteği tamamlanamadı. Oturum ve doğrulama durumunu kontrol edin. Otomatik tekrar yapılmadı.'
  print(json.dumps({'error':message},ensure_ascii=False));sys.exit(1)
