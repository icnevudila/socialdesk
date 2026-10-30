# Socialdesk

Kişisel Instagram çalışma alanı. Node 22.9+ gerekir.

```powershell
npm.cmd ci
npm.cmd test
npm.cmd start
```

Önizleme: http://127.0.0.1:4317 · [Kurulum rehberi](http://127.0.0.1:4317/setup.html)

## İşlevler

- Taslak/yerel plan oluşturma, düzenleme, silme; ay/hafta takvimi.
- Çoklu Instagram hesabı, hesap ID/token doğrulama ve hesap bazında yayınlama anahtarı.
- Kalıcı tek süreçli kuyruk: container oluşturma, işleme kontrolü, yayın ID/permalink kaydı. Belirsiz sonuçta otomatik tekrar yok.
- Yerel PNG/JPEG/WebP/MP4 yükleme, medya önizleme; otomatik yayın için ayrıca herkese açık HTTPS medya URL’si gerekir.
- GPT metin/başlık fikri/açıklama/yorum taslağı/görsel brief/Reels senaryosu; görsel üretim adapteri.
- Hesap profili, son 25 medya, desteklenen hesap/medya Insights ve kendi medya yorumlarına yanıt.
- Manuel keşif listesi; ayrı, isteğe bağlı instagrapi hashtag keşfi ve kullanıcı incelemesinden sonra tekil yorum gönderimi.
- Marka profili, JSON yedekleme, sunucuda saklanan bağlantı sırları.

## Python / isteğe bağlı adapter

Kurulu ortam `.venv` içindedir. Tekrar kurulum:

```powershell
py -3 -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements-private.lock.txt
.venv/Scripts/python.exe scripts/private_cli.py check
```

Kullanıcı kendi girişi için `scripts/private_cli.py login` komutunu interaktif çalıştırır. Resmi yayınlama bu özel API’ye bağımlı değildir.

## Kanıt ve sınırlar

`npm test` yerel HTTP, kalıcılık ve sağlayıcı yanıtlarını taklit eden kontrolleri çalıştırır. Gerçek hesap/API anahtarı olmadan canlı bağlantı/yayın başarısı iddia edilmez. Insights desteği/izinleri hesap ve medya türüne göre değişir; arayüz erişilemeyen metrikleri hata olarak gösterir. Video üretimi yok; Reels dosyası yüklenir veya senaryo hazırlanır.

Uygulama kapalıyken zamanlayıcı çalışmaz. Aynı veri klasöründe tek süreç kullanın. `data/` özel dosyalar içerir; paylaşmayın. Export sırları ve medya dosyalarını içermez. AI bağlantısı başka bir sohbet tarafından düzenleniyorsa onun değişikliklerini koruyun.
