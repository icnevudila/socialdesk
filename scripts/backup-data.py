"""Restricted local backups for the persistent Socialdesk backend."""
import pathlib,tarfile,datetime,os
root=pathlib.Path(__file__).resolve().parent.parent
dest=pathlib.Path('/home/opc/socialdesk-backups');dest.mkdir(mode=0o700,exist_ok=True)
stamp=datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
archive=dest/('daily-data-'+stamp+'.tgz')
with tarfile.open(archive,'w:gz') as t:
 t.add(root/'data',arcname='data',filter=lambda info:None if info.name.endswith('/.server.lock') else info)
 if (root/'.env').exists():t.add(root/'.env',arcname='.env')
os.chmod(archive,0o600)
for old in sorted(dest.glob('daily-data-*.tgz'))[:-7]:
 if old.is_file() and old.parent==dest:old.unlink()
print(str(archive))
