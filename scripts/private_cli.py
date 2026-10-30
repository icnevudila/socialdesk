"""Optional private-API adapter. Official Meta publishing never depends on it."""
import argparse, getpass, json, sys
from pathlib import Path
from instagrapi import Client
ROOT=Path(__file__).resolve().parent.parent
SESSION=ROOT/'data'/'private-session.json'
def main():
 p=argparse.ArgumentParser();p.add_argument('action',choices=['check','login','discover','comment']);p.add_argument('--tag',default='');p.add_argument('--url',default='');args=p.parse_args()
 if args.action=='check':
  from importlib.metadata import version
  print(json.dumps({'installed':True,'version':version('instagrapi'),'sessionSaved':SESSION.exists()}));return
 client=Client()
 if args.action=='login':
  username=input('Instagram username: ').strip();password=getpass.getpass('Instagram password (not saved): ')
  if SESSION.exists():client.load_settings(SESSION)
  client.login(username,password);SESSION.parent.mkdir(parents=True,exist_ok=True);client.dump_settings(SESSION);print('Session saved locally.');return
 if not SESSION.exists():raise ValueError('Önce terminalde private_cli.py login ile oturum açın.')
 client.load_settings(SESSION)
 if args.action=='discover':
  tag=args.tag.strip().lstrip('#')
  if not tag or len(tag)>80 or not tag.replace('_','').isalnum():raise ValueError('Geçerli bir hashtag yazın.')
  media=client.hashtag_medias_recent(tag,amount=12)
  print(json.dumps({'items':[{'id':str(m.pk),'url':f'https://www.instagram.com/p/{m.code}/','caption':m.caption_text,'username':m.user.username} for m in media]},ensure_ascii=False));return
 if args.action=='comment':
  # One explicit reviewed comment only. No batch, retries or automatic account changes.
  from urllib.parse import urlparse
  u=urlparse(args.url)
  if u.scheme!='https' or u.hostname not in ('instagram.com','www.instagram.com'):raise ValueError('Geçerli Instagram adresi gerekli.')
  message=json.loads(sys.stdin.read()).get('message','').strip()
  if not message or len(message)>2000:raise ValueError('Yorum 1–2000 karakter olmalı.')
  media_id=client.media_pk_from_url(args.url);result=client.media_comment(media_id,message)
  print(json.dumps({'id':str(result.pk),'accepted':True}));return
if __name__=='__main__':
 try:main()
 except Exception as e:
  # Never expose provider diagnostics, credentials or session contents over HTTP.
  if isinstance(e,ValueError):message=str(e)
  else:message='Instagram özel API işlemi tamamlanamadı. Oturum / doğrulama / erişim durumunu kontrol edin. Otomatik tekrar yapılmadı.'
  print(json.dumps({'error':message},ensure_ascii=False));sys.exit(1)
