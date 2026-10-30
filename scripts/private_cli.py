"""Optional Instagram private API. No fallback data and no simulated success."""
import argparse, getpass, json, os, sys
from pathlib import Path
from importlib.metadata import version
ROOT=Path(__file__).resolve().parent.parent
DATA=Path(os.environ.get('SOCIALDESK_DATA_DIR',str(ROOT/'data')))
SESSION=DATA/'private-session.json'
def run():
 parser=argparse.ArgumentParser();parser.add_argument('action',choices=['check','login','discover','comment','identity']);parser.add_argument('--tag',default='');parser.add_argument('--url',default='');args=parser.parse_args()
 from instagrapi import Client
 if args.action=='check':
  return {'installed':True,'version':version('instagrapi'),'sessionSaved':SESSION.is_file(),'available':SESSION.is_file(),'mode':'private-api'}
 client=Client()
 if args.action=='login':
  username=input('Instagram username: ').strip();password=getpass.getpass('Instagram password (not saved): ')
  if SESSION.is_file():client.load_settings(SESSION)
  try:client.login(username,password)
  except Exception as e:
   from instagrapi.exceptions import TwoFactorRequired
   if not isinstance(e,TwoFactorRequired):raise
   code=getpass.getpass('Instagram 2FA code: ');client.login(username,password,verification_code=code)
  DATA.mkdir(parents=True,exist_ok=True);client.dump_settings(SESSION)
  return {'sessionSaved':True,'verified':True}
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
 from urllib.parse import urlparse
 u=urlparse(args.url)
 if u.scheme!='https' or u.hostname not in ('instagram.com','www.instagram.com') or not u.path.startswith(('/p/','/reel/')):raise ValueError('Geçerli Instagram gönderi adresi gerekli.')
 message=str(json.loads(sys.stdin.read()).get('message','')).strip()
 if not message or len(message)>2000:raise ValueError('Yorum 1–2000 karakter olmalı.')
 media_id=client.media_pk_from_url(args.url)
 result=client.media_comment(media_id,message)
 if not getattr(result,'pk',None):raise ValueError('Instagram yorum kimliği dönmedi. Sonuç belirsiz; tekrar göndermeden önce kontrol edin.')
 return {'id':str(result.pk),'accepted':True,'source':'instagram-private-api'}
if __name__=='__main__':
 try:print(json.dumps(run(),ensure_ascii=False))
 except Exception as e:
  message=str(e) if isinstance(e,ValueError) else 'Instagram özel API isteği tamamlanamadı. Oturum ve doğrulama durumunu kontrol edin. Otomatik tekrar yapılmadı.'
  print(json.dumps({'error':message},ensure_ascii=False));sys.exit(1)
