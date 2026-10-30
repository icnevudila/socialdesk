# Socialdesk — Yeni sohbette devam dosyası

## İlk talimat

Bu dosyayı tamamen oku. Çalışma klasörü **C:\Users\TP2\Documents\socialdesk**. Kullanıcı bu projeyi ayrı bir sohbette ve ayrı klasörde sürdürmek istiyor. Araştırmayı tamamlayıp uygulamayı geliştir; yalnızca plan sunup bırakma. Aşağıdaki mevcut durumu doğrula, ardından eksik uygulamayı tamamla.

**WhatsApp / Mesajify projesinde çalışma.** `C:\Users\TP2\Documents\whatsapp` içine dosya yazma, oradan komut çalıştırma, servislerini başlatma veya değiştirme. Bu proje hiçbir mevcut projenin altına kurulmayacak. Veriburada yalnızca kullanıcı tarafından istenen görsel referans; onun kaynaklarını da değiştirme.

## Kullanıcının istediği ürün

Yalnızca kendi Instagram hesaplarını yöneteceği, dışarıya satılmayacak bağımsız bir uygulama:

1. Bir veya birden fazla kendi profesyonel Instagram hesabını bağlama.
2. Markaya ve hedef kitleye uygun gönderi fikirleri, açıklamalar, görseller ve ileride Reels hazırlama.
3. Gönderileri önceden takvime koyma, zamanı gelince otomatik paylaşma.
4. Hesap ve içerik performansını API'nin verdiği gerçek verilerle analiz etme.
5. İlgili sayfa / hashtag / gönderileri keşfetme, bağlama uygun yorum hazırlama ve etkileşim fırsatlarını yönetme.
6. Kullanıcı otomatik yorum gönderme olanağını da araştırmamızı istedi. Resmi API ile özel API'nin yeteneklerini birbirine karıştırma; aşağıdaki kararları oku.

**Maliyet temel koşul:** Olabildiğince ücretsiz. Kullanıcının zaten kendi AI servisleri var. Ücretli AI sağlayıcısı zorunluluğu, yeni abonelik, ücretli proxy veya SaaS ekleme. AI bağlantısını kullanıcının mevcut servisine adapte et. Servis adresi, kimlik doğrulaması ve istek/yanıt sözleşmesi bu sohbette henüz verilmedi; bunları tahmin etme veya WhatsApp projesinin gizli dosyalarını okuyarak bulmaya çalışma. Gerekli noktada kullanıcıdan endpoint ve sözleşmeyi iste; sırları dosyada/chatte teşhir etme.

## Araştırma ve yöntem kararı — 30 Ekim 2026

Bu bir üretimde doğrulanmış entegrasyon raporu değil. GitHub depoları ve belgeler incelendi; hiçbir Instagram hesabında oturum açılmadı, içerik paylaşılmadı, yorum gönderilmedi.

### Resmi Instagram API: ana yol

- Kendi Business / Creator hesapları için resmi bağlantı, içerik yayınlama ve erişilebilir Insights verileri ana yol olmalı.
- Kendi hesabıyla geliştirme erişimi mümkün olabilir; rol/tester kurulumu, izinler ve seçilen giriş akışının güncel gereklilikleri uygulama sırasında doğrulanmalı. "Kendi hesabınsa her izin incelemesiz çalışır" diye garanti verme.
- Instagram Login ve Facebook Login yollarının izin ve keşif yetenekleri farklı olabilir. Hashtag / Business Discovery ihtiyacını ayrıca doğrula. Bir akışta olanı diğerine otomatik olarak atfetme.
- API bir sunucu zamanlayıcısının yerini tutmaz. Sürekli çalışan süreç vadesi gelen işi alır, medya container oluşturur, hazır oluşunu kontrol eder, yayınlar ve yayın kimliğini kaydeder.
- Bilgisayar kapalıyken yerel zamanlayıcı çalışmaz. Sıfıra yakın maliyetle başlangıç: kullanıcının açık bilgisayarı. Sürekli açık mevcut sunucu varsa ancak açık yetkilendirmeyle değerlendir; ücretsiz hostingin sürekli çalışma garantisini varsayma.
- Resmi API başka hesapların rastgele gönderilerine genel amaçlı otomatik yorum bırakma imkânı sunmaz; kendi medya yorumları ve özel mention akışları ile genel dış gönderiye yorum yazmayı ayır.
- "Bütün hesap analizi" yalnızca erişilebilen metrikleri kapsar. Tarihsel veri boşluklarını ve minimum veri koşullarını açık göster. Hangi yorumun kaç takipçi kazandırdığını kesin olarak bildiğini iddia etme.

Birincil kaynak:
https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api

### instagrapi: ayrı, deneysel değerlendirme

- Repo: https://github.com/subzeroid/instagrapi
- Python ile resmi olmayan web / private mobile API erişimi.
- Hashtag bulma: https://github.com/subzeroid/instagrapi/blob/master/docs/usage-guide/hashtag.md
- Yorum: https://github.com/subzeroid/instagrapi/blob/master/docs/usage-guide/comment.md
- `hashtag_medias_top`, `hashtag_medias_recent`, `media_comment` gibi işlevler belgelenmiş.
- README özel API otomasyonunu kırılgan olarak tanımlıyor; hesap güveni, doğrulama, rate limit ve cihaz durumları sonucu etkiliyor. Yorum yazımı spam/güven kontrollerini tetikleyebilir.
- Bu yüzden resmi yayınlama bağlantısından ayrı adapter / süreç olmalı. Ana hesabın resmi yayınlama yeteneği deneysel keşif adapterine bağımlı olmamalı.
- İlk ürün akışı: ilgili içerikleri inceleme listesine al → içerikle ilgili yorum taslağı hazırla → kullanıcı incelemesi → desteklenen gönderim yolu. Otomatik toplu yorum, engel aşma, sınırsızlık veya güvenli günlük yorum sayısı vaat etme.
- Henüz bağımlılık olarak kurulmadı; gerçek hesapta test edilmedi.

### İncelenen diğer seçenekler

- https://github.com/dilame/instagram-private-api — Node.js / TypeScript özel API istemcisi. Güncel çalışırlık test edilmedi. Sırf uygulama JavaScript diye bunu seçmek zorunlu değil.
- https://github.com/InstaPy/InstaPy — Selenium tabanlı etkileşim otomasyonu; ilk tercih değil, gerçek çalışırlık doğrulanmadı.
- https://github.com/gitroomhq/postiz-app — self-hosted planlama ürünü, AGPL-3.0. Kullanıcıya özel küçük uygulama için bütün sistemi fork etmek yerine mimari ve akış referansı olarak incelendi. Kendi barındırmasında PostgreSQL/Redis/storage ve sağlayıcı uygulama kurulumunu gerektirdiğinden otomatik olarak "en ucuz/en basit" sayılmamalı. Kaynak kodu kopyalanmadı.
- https://buffer.com/publish — ürün akışı referansı: composer, queue, calendar, approval. Kod/tasarım kopyalama değil; ekran görevlerini anlamak için referans.

**Mevcut öneri:** Kullanıcıya özel hafif web uygulaması + yerel kalıcı kayıt + resmi Meta yayınlama adapteri + kullanıcının mevcut AI servisine adapter + ayrı ve isteğe bağlı deneysel keşif modülü. Kullanım büyüdükçe veri katmanı / worker geliştirilebilir. Zorunlu Redis, Docker, bulut DB veya ücretli abonelik yok.

## Veriburada tasarım referansı

Kullanıcı açıkça Veriburada'nın UI tasarım dilini istiyor. Bu yeni bir ürün; Veriburada adı/logo/işletme araştırması işleviyle aynı ürünmüş gibi sunma. **Socialdesk geçici çalışma adı**, kullanıcı tarafından nihai isim seçilmedi.

Salt okunur kaynaklar:

- `C:\Users\TP2\Documents\veriburada\VERIBURADA-MARKA-VE-URUN-KILAVUZU.md` (özellikle 7. görsel kimlik bölümü)
- `C:\Users\TP2\Documents\veriburada\public\index.html`
- `C:\Users\TP2\Documents\veriburada\public\brand-ui.css`
- `C:\Users\TP2\Documents\veriburada\public\landing.css`
- `C:\Users\TP2\Documents\veriburada\public\landing-refinements.css`
- `C:\Users\TP2\Documents\veriburada\research\app-proof\` (mevcut ekran görüntüleri)

Referans kilidi:

| Karar | Kaynak / rol |
| --- | --- |
| Orman yeşili `#153F2B`, alternatif koyu `#0F4C30` | Veriburada: başlık/marka/ana koyu yüzey |
| Aksiyon yeşili `#198754` | Birincil eylem, aktif ve başarı durumu |
| Mint `#20C997` | Ölçülü görsel/motion detayı; bütün panelin zemini değil |
| Beyaz ve açık nötrler `#FAFDFA`, `#F4F8F2`, `#EAF2E5` | Ferah çalışma alanı, kartlar ve ayrım |
| LINE Seed | Yerel font dosyaları kopyalandı, lisansları koru |
| Kısa Türkçe metin, görsel görev anlatımı | Kullanıcı uzun açıklama yığınlarını sevmiyor |
| Takvim + kuyruk + editör akışı | Buffer ürün referansı; özgün uygulama düzeni |

Uygulama için masaüstünde sidebar, üstte hesap seçimi/bağlantı durumu, ana alanda görev odaklı ekranlar uygundur. Mobilde taşma olmadan kullanılmalı. Genel bir landing page değil, gerçekten kullanılan panel tasarla. Sahte büyüme rakamları, sahte bağlı hesaplar ve sahte AI çıktısı gösterme. Örnek veri gerekiyorsa görünür biçimde **Örnek görünüm** diye ayır.

Refero Design becerisi önceki sohbette okundu (`C:\Users\TP2\.agents\skills\refero-design\SKILL.md`); mevcut proje referansı nedeniyle doğrudan uygulama yolu seçildi. Live Refero araçları bulunmadı; bu skill klasöründe atıf yapılan craft reference dosyaları da mevcut görünmüyor. Olmayan dosyaları okumuş gibi davranma. Yeni sohbette uygulanacak skill talimatlarını o sohbetin kurallarına göre oku.

## Bu klasörde GERÇEKTEN yapılanlar

Henüz **tamamlanmış çalışan bir UI yok**. İlk iskelet dosyaları yazıldı, ardından kullanıcı bu devam dosyasını istedi. Klasörü hazır ürün diye raporlama.

- `package.json`: Node 22.9+; üretim bağımlılığı yok. `npm start` ve `npm test` tanımlı.
- `server.mjs`: yalnızca loopback'e bağlanan Node HTTP sunucusu; varsayılan port **4317**.
- `store.mjs`: JSON dosyasında kalıcı kayıt, süreç içi sıralı/atomik yazım, gönderi doğrulama.
- `meta.mjs`: resmi Graph API için küçük istek/container/yayın adapteri. Gerçek Meta hesabında doğrulanmadı.
- `public/index.html`: app/dialog/toast kabuğu. **Atıf yaptığı `public/app.js` ve `public/style.css` HENÜZ YOK.**
- `public/fonts/`: Veriburada'dan yalnızca yerel fontlar ve lisansları kopyalandı.
- `.env.example`: boş Meta ayarları ve `ENABLE_PUBLISHING=false`.
- `.gitignore`: `.env`, `data/`, `node_modules/`, `artifacts/` hariç tutuluyor.
- `tests/` klasörü var; **henüz test dosyası yok**. `npm test` başarılı kabul edilmemeli.
- `docs/` klasörü var; henüz ayrıntılı başka belgeler yok.
- Paket kurulumu, Instagram bağlantısı, AI bağlantısı, gerçek yayınlama, tarayıcı QA, deploy ve Git push yapılmadı.
- WhatsApp ve Veriburada kaynak dosyaları değiştirilmedi.

### İskeletteki API uçları

- `GET /api/workspace`: gönderiler, marka, fırsatlar, bağlantı yapılandırma durumu. `configured` bir bağlantı kanıtı değildir; `verified:false` döner.
- `POST /api/posts`: taslak / yerel plan / etkinse otomatik yayın kuyruğu.
- `PUT /api/posts/:id`, `DELETE /api/posts/:id`.
- `PUT /api/brand`: marka adı, kullanıcı adı, sektör, hedef kitle, dil tonu.
- `POST /api/opportunities`, `DELETE /api/opportunities/:id`: kullanıcının eklediği Instagram post/Reels URL'leri ve notlar. **Otomatik keşif henüz yok.**
- `POST /api/connection/check`: yapılandırılmış token ile gerçek profil okuması. Henüz test edilmedi.
- `GET /api/export`: yerel veriyi JSON olarak indirmeye uygun yanıt.

### Gönderi durumları

- `draft`: taslak.
- `planned`: sadece yerel takvim planı; otomatik yayınlamaya alınmamış.
- `scheduled`: resmi adapter ile otomatik yayın kuyruğunda; şu an yapılandırma yoksa reddedilir.
- `processing`: worker dış işlem yapıyor.
- `published`: API'nin döndürdüğü yayın kimliği kaydedilmiş; uygulama içi görsel doğrulama/Instagram permalink doğrulaması ayrıca gerekir.
- `reconciliation_required`: sonuç belirsiz / yarım kalmış işlem; kör yeniden deneme yapılmaz.

Mevcut worker yaklaşık 15 saniyede bir tek vadesi gelen iş seçiyor. Dış işlem öncesinde durum ve yayın denemesi kaydediliyor. İşlem sırasında süreç kapanırsa başlangıçta kontrol gerektiren duruma alıyor. **Tek süreç varsayımı var**; aynı veri klasörüyle birden fazla sunucu başlatma. Bu iskeletin timeout, container hata sınıflandırması, süreç kapanışı ve veri dayanıklılığı iyileştirilebilir. Gerçek yayınlama öncesinde kodu ve güncel Meta sözleşmesini incele, gerekli anlamlı testleri yaz. `.env` değerlerinin varlığıyla canlı güvenilirlik iddiasında bulunma.

## Öncelikli sonraki işler

1. Bu klasörde durumu doğrula. `server.mjs`, `store.mjs`, `meta.mjs` dosyalarını gözden geçir. Komutlarda `workdir` açıkça bu klasör olsun.
2. Veriburada'nın ilgili ekranlarını ve CSS'ini salt okunur inceleyip tasarım dilini gerçek görsel kaynakla doğrula. Kullanıcı başka projelerde değişiklik istemiyor.
3. `public/style.css` ve `public/app.js` ile tamamlanmış Türkçe panel oluştur:
   - Genel bakış: bağlantı durumu, gerçek yerel kuyruk, sonraki içerikler.
   - İçerik takvimi: hafta/ay gezinme, düzenleme, tarihe plan ekleme.
   - İçerik stüdyosu: başlık, açıklama, tür, medya URL'si, tarih/saat, önizleme, taslak/yerel plan kaydı.
   - Keşif ve etkileşim: manuel URL ekleme, konu/not, yorum taslağı, gönderiyi açma. Otomatik keşif/gönderim bağlanmadıysa açıkça göster.
   - Analiz: bağlı değilse anlamlı boş durum; veri olmadan uydurma grafik gösterme.
   - Marka ve bağlantılar: marka ayarları, bağlantı kontrolü, ücretsiz yerel çalışma, mevcut AI servisi bağlantı durumu.
4. Kayıtlar refresh/restart sonrasında korunsun. Form hatalarını görünür göster; butonlar boş vaat vermesin. XSS ve yetkisiz yerel istek risklerini gözden geçir.
5. Kullanıcının AI servisi sözleşmesini alıp server-side adapter ekle. Servis yokken "AI üretti" mesajı verme. Ücretsiz şablon önerilerini AI diye etiketleme.
6. Resmi Meta girişini çok hesaplı kullanıma uygun tasarla. Mevcut `.env` tek hesaplık geliştirme iskeleti; bitmiş OAuth/çoklu hesap sistemi değil. Tokenları frontend'e, loglara veya export'a koyma.
7. Gerçek testler: CRUD/kalıcılık, geçersiz tarih/medya, bağlantısız yayın engeli, çift gönderim engeli, belirsiz dış işlem sonrası otomatik tekrar yapılmaması. Testleri geçici data klasöründe çalıştır.
8. Tarayıcıda masaüstü ve 390/320px doğrula: konsol hataları, taşma, editör, klavye/dialog odak, kayıt/düzenleme/silme, sayfa yenileme, hata durumları. Ekran görüntülerini `artifacts/` altına kaydet.
9. README: çalıştırma, yerel kullanım sınırları, AI bağlantısı, resmi Meta kurulum adımları, veri yedekleme.

## Komutlar

Önce dosyaların eksik durumunu tamamla. Sonrasında PowerShell:

```powershell
Set-Location C:\Users\TP2\Documents\socialdesk
node --check server.mjs
node --check store.mjs
node --check meta.mjs
npm.cmd test
npm.cmd start
```

Önizleme: `http://127.0.0.1:4317`. Sunucu daha önce başlatılmadı; portun boş olduğunu doğrula. Kullanıcının bilgisayarında görünür terminal açmak zorunda değilsin; arka plan süreçleri gizli çalışmalı.

## Teslim ve doğrulama sınırları

- Kullanıcı geliştirme için yetki verdi; tekrar tekrar genel izin isteme. Eksik AI endpoint / Meta OAuth bilgisi gibi gerçekten gerekli bilgiyi kısa sor ve bağımsız UI işlerine devam et.
- Publish/push/deploy veya mevcut canlı servislere müdahale için bu konuşmada talimat yok; yerel projeyi tamamla.
- Uygulama içindeki "yerel plan" ile gerçekten otomatik yayın kuyruğunu ayır. Sunucu kapalıyken paylaşım garantisi verme.
- Yerel test, mock Meta testi, gerçek hesap bağlantısı ve gerçek yayınlama ayrı kanıtlardır. Kanıt olmayan hiçbir şeyi PASS sayma.
- Yeni sohbette bu dosyanın içeriğini otomatik olarak güncel doğru kabul etme; dosyaları doğrula ve ilerledikçe proje içi notları güncelle. Bu dosya Codex belleği değil, proje devam belgesidir.

## 30 Ekim — Güncel uygulama durumu

İlk iskeletten sonra Türkçe UI, çoklu hesap yapılandırması, GPT/AI adaptörü, medya yükleme/önizleme, kalıcı scheduler, Insights ve yorum uçları, deneysel instagrapi adapteri ve kurulum ekranı eklendi. Kullanıcının verdiği Socialdesk logosu ve mor/fuşya/turuncu paleti yeşil referansın yerini aldı. Özgün SVG çizimler public/workspace-art.svg ve calendar-art.svg içindedir.

Önceki "app.js/style.css yok" maddeleri artık geçerli değil. Güncel işlev ve sınırlar README.md ile public/setup.html içinde. AI bağlantı dosyaları kullanıcı tarafından yetkilendirilmiş başka bir sohbet tarafından eşzamanlı düzenleniyor; onları geri almayın. Gerçek Meta ve GPT işlemleri bu sohbet tarafından yapılmadı.
