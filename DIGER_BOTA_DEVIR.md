> GÜNCEL: 1 Kasım 2026 canlı kurulum ve kabul raporu `docs/SON_DURUM_2026-11-01.md` dosyasındadır. Aşağıdaki eski notlar tarihsel bağlamdır.

# Socialdesk — Diğer bota devir

Tarih: 31 Ekim 2026. Çalışma klasörü: `C:\Users\TP2\Documents\socialdesk`.

## Kullanıcının hedefi

Kendi Instagram hesabını organik büyütmeye çalışan araç: markaya uygun görsel/metin üretimi, günlük/haftalık hazırlama, düzenli otomatik yayın, ilgili gerçek gönderileri kendi bulma, bağlam/alaka değerlendirmesi, doğal ve gönderiye özel yorum hazırlayıp kurallara göre otomatik gönderme, gerçek performansı izleme. Ücretli reklam bu aşamada istenmiyor. Kopya yorum, uydurma kişisel deneyim, alakasız seri tanıtım ve sahte başarı istenmiyor. Görsel dil kullanıcı logosu ve mor/fuşya/turuncu palet; özgün SVG çizimler korunmalı.

Yalnızca plan verip bırakma: aşağıdaki bağlantı ve canlı kabul adımlarını tamamla. Ancak hiçbir canlı kanıt olmadan yüzde 100 / tam otonom / başarılı büyüme iddiası verme.

## Önce mevcut değişiklikleri koru

- Git çalışma ağacı **kirli**; bu sohbetin çok sayıda henüz commit edilmemiş düzeltmesi var. `git status --short` ve `git diff --stat` ile başla. Reset/checkout ile geri alma.
- Başlangıç commit’i `ddef9f1`. Eşzamanlı diğer çalışma `493ecc9` ile **61 açıklamaya veriburada.com ekledi ve takvimi bugünden başlattı**. Bu commit’i geri alma. İlk başlangıç yedeği ile caption/scheduledAt farkı bu nedenle var.
- 61 içerik silinmedi. Son okunan ilk plan `2026-10-31T09:00:00.000Z` = **31 Ekim 12:00 İstanbul**. Tarihleri canlı dosyadan tekrar kontrol et; bu not zamanla eskir.
- `artifacts/audit-backup-*` başlangıç yedeğidir; özel bağlantı dosyası da içerir. Paylaşma, publish etme. Yeni 61 kayıt güncellemelerinin üzerine eski yedeği körlemesine yazma.
- Gerçek `.env`, `data/integrations.json`, özel oturum, parolalar ve tokenlar çıktı/log/chat/Git’e konulmayacak. Değerleri süreç içinde kullan, yalnızca varlık/durum bilgisi raporla.
- WhatsApp/Mesajify ve Veriburada projelerinin kaynaklarını değiştirme. Ortak AI sağlayıcısına müdahale gerekiyorsa mevcut yetki ve servis etkisini ayrıca değerlendir. Bu sohbet deploy/push yapmadı.

## Gerçekte doğrulanan son durum

| Alan | Kanıt | Sonuç |
|---|---|---|
| Yerel/taklit sağlayıcı testleri | `artifacts/test-results.tap` | **38 test, 38 geçiş, 0 hata**; yaklaşık 63 saniye |
| Gerçek Meta profil/medya/reach okuması | `artifacts/live-readonly-audit.json` | Önceki aşamada başarılıydı; hesap `veriburada`, medya listesi 0 |
| Tek gerçek görsel container’ı | `artifacts/live-meta-container.json` | `FINISHED`; **media_publish çağrılmadı**, herkese açık yayın olmadı |
| Güncel Meta bağlantısı | `artifacts/local-runtime-audit.json` | **190 token hatası**; önceki başarıyı güncel bağlantı kanıtı sayma |
| Gerçek AI metin isteği | `artifacts/live-text-audit.json` | Tek istek sonuç vermedi; otomatik tekrar yapılmadı |
| AI sağlık/model isteği | `artifacts/local-runtime-audit.json` | Servis bilgisi alınamadı; HTTP 400 uygulama hatası |
| instagrapi | `scripts/private_cli.py check` | 3.2.2 kurulu; **özel oturum yok** |
| Hazır yerel görseller | `artifacts/media-audit.json` | 60 görsel dosyası açılıp doğrulandı |
| Responsive kontrol | `artifacts/responsive-audit.json` | 7 ekran × 320/390/1440 px; belge yatay taşması yok |
| Tarayıcı akışları | QA ortamı ve ekran görüntüleri | Giriş, yükleme/önizleme, plan, düzenle/sil, taslak kurtarma, taklit AI metni/görseli, kütüphane arama, analiz/Insights, otomasyon kuralları ve oturum yok uyarısı doğrulandı |

**Güncel bağlantı durumu:** Gerçek 190 hatası tespit edilince hesabın verified/publishing bayrakları iptal ediliyor. Bekleyen 61 gönderi korunuyor. Bu bayrakları elle true yapma; gerçek doğrulama ve kullanıcının yayın ayarı üzerinden aç.

## Hazırlanan kod

- `auth.mjs`: sabit varsayılan parola kaldırıldı; süreli rastgele nonce’lu oturum, HttpOnly/SameSite cookie, yanlış token reddi, çıkış. Login deneme sınırı server’da. Test ortamı için auth bypass yok.
- `data-lease.mjs`: aynı kalıcı veri klasörünü iki Node sürecinin sahiplenmesini engeller.
- `integrations.mjs`: sıkı hesap kimliği, token değişince doğrulamanın iptali, bağlantıyı kesme; env ayarı artık sahte doğrulama veya otomatik yayın açmıyor. Farklı servis origin’i için eski AI anahtarı sessizce taşınmaz.
- `scheduler.mjs`: kalıcı yayın niyeti, tek iş claim’i, container/publish ID kaydı, yanlış/kapalı hesabın diğerlerini bloke etmemesi, belirsiz sonuçta karantina; Meta 190’da hesabı durdurma.
- `growth.mjs`: tek gün veya seçili haftanın günleri için metin/görsel hazırlama, dolu güne ikinci üretim yapmama, günlük anahtar, haftalık arka plan işi/durdurma/devam, hata sonrası kör tekrar yapmama. Taslak veya açık kullanıcı kuralıyla otomatik yayın kuyruğu.
- `engagement.mjs`: gerçek keşif → en fazla 3 adayın AI alaka kontrolü → gönderiye özel yorum → inceleme veya otomatik kuyruk. Özel oturum kullanıcı adını marka hesabıyla eşleştirme; tekrar URL/metin engeli; günlük uygulama sınırı; otomatik yorumlar arasında 30 dakika; bağlantı yokken gönderilmiş saymama; belirsiz sonucu yeniden göndermeme.
- `private.mjs` ve `scripts/private_cli.py`: **uydurma sektörel keşif ve sahte kabul yanıtları kaldırıldı**. Gerçek instagrapi adapteri; login kullanıcı terminalinde interaktif. Resmi Meta yayınlama buna bağımlı değil.
- `ai.mjs`: mevcut OmniStudio ve standart GPT görsel sözleşmesi ayrıldı; standart istekte model gönderiliyor, sağlayıcıya özel alanlar standart API’ye sızmıyor; ham sağlayıcı hata gövdesi gösterilmiyor.
- `media.mjs` / server: dosya tür/boyut/yol kontrolü, yerel medya auth, video Range/HEAD, sağlayıcı çıktısını yerel dosyaya kaydetme.
- UI: 7 ekran; stüdyo/kütüphane ve keşif/otomasyon/hashtag sekmeleri; arama/filtre; İstanbul saat dilimi; kaydedilmemiş içerik kurtarma; kaynak metni ile gönderilecek yorumu ayırma; ham JSON yerine okunabilir Insights; gerçek kurulum durumları.
- Sunucusuz Vercel’de JSON depolamaya kalıcılık/sürekli worker varmış gibi davranılmıyor. Bu ortamda mutasyonlar ve worker kapalıdır; sessiz veri kaybı kabul edilmiyor.

## Kalan bağlantılar: önerilen sıra

### 1. Meta tokenını düzelt

1. Güncel dosya/config ve seçilen giriş türünü tespit et. `data/integrations.json` kaydı env’den öncelikli olabilir; eski tokenı kullanıp kullanmadığını sırları yazdırmadan karşılaştır.
2. 190’ın alt kodu ve Meta panelindeki token geçerliliğini incele. Tek başına 190’dan kesin kök neden üretme.
3. Kullanıcı Meta panelinden doğru hesap/izinlerle tokenı yenilesin veya geçerli uzun ömürlü token akışını kur. Instagram Login ile Facebook Login kimlik/token/scope ailelerini karıştırma.
4. Aynı kayıt için doğru tokenı kaydet; kullanıcı ID’si farklıysa mevcut kaydı başka hesaba dönüştürme, yeni hesap kaydı aç.
5. `/api/connection/check` ile gerçek kullanıcı adını doğrula, ardından `/api/connection/publishing` üzerinden yayın anahtarını aç. Geçersiz hesabı yeşil göstermek için flag yazma.
6. Profil, medya, hesap ve medya Insights, kendi gönderi yorumlarını ayrı ayrı doğrula. HTTP 200 içinde tüm metrikler hata dönüyorsa PASS değildir.

### 2. AI servisini çalışır hale getir

1. `.env` ve kayıtlı AI config’ini süreç içinde incele. Gerçek endpoint, protokol, model ve anahtarı doğrula; sırları raporlama.
2. Önce sağlık/model okuması ve yerel taklit testleri. Sağlık yanıtı gerçek üretim kanıtı değildir.
3. `artifacts/live-text-audit.json` içindeki sonuç alınamayan isteği sağlayıcıda/iş kuyruğunda uzlaştır. Ücret/kredi/iş durumu belirsizken kör yeni üretim yapma.
4. Sonra bir kısa gerçek metin, bir gerçek görsel üret. İş/çıktı kimliği varsa kaydet, doğru dosyanın editörde açıldığını ve indirilebildiğini doğrula. Veri biçimini uydurarak uyumlu ilan etme.
5. Standart GPT API kullanılıyorsa erişilebilir model adı ve görsel modelini açıkça seç; rastgele yeni model varsayma. Mevcut servis aboneliğini gereksiz ücretli yeni sağlayıcıyla değiştirme.

### 3. Gerçek keşif ve dış gönderiye yorum için özel oturum

Kurulu Python ortamı `.venv`. Komut proje klasöründe:

```powershell
.venv/Scripts/python.exe scripts/private_cli.py check
.venv/Scripts/python.exe scripts/private_cli.py login
```

Login’de kullanıcı kendi kullanıcı adı/parola/2FA bilgisini interaktif girer. Sırları chatte isteme ve loglama. `data/private-session.json` özel dosyadır. Özel oturum hesabının `identity` yanıtı seçili markanın doğrulanmış kullanıcı adıyla aynı olmalı.

Gerçek bir hashtag araması yap, dönen URL’nin gerçek gönderi olduğunu açıp doğrula. Gerçek içerikle alaka puanı ve yorum kalitesini incele. Tek bir ilgili hedefte gerçek yorum kimliğini ve Instagram görünürlüğünü doğrulamadan otomatik modu başarılı sayma. Gönderim zaman aşımında aynı yorumu tekrar gönderme; önce platform sonucunu incele.

**Eski veri temizliği:** Mevcut iki opportunity kaydının URL’leri kaldırılan örnek havuzdaki kodlarla eşleşiyor. Bunlar gerçek keşif kanıtı değildir. Kullanıcı verisini silmeden önce yedekle; örnek olarak işaretle/karantinaya al veya gerçek URL’lerle kullanıcı kontrolünde değiştir. Bu kayıtlara otomatik yorum gönderme.

### 4. Kesintisiz çalışmayı sağla

Yerel uygulama `http://127.0.0.1:4317`, kalıcı `data/` ve tek süreçle çalışıyor. Bilgisayar kapalıysa otomasyon durur. Tam otonom günlük çalışma için kullanıcı tarafından seçilen sürekli açık bir makinede kalıcı disk ve süreç yöneticisi/watchdog gerekir.

Vercel serverless’in `/tmp` dosyaları ve process içi interval’i sürekli backend değildir. Ya kalıcı Node backend’e güvenli proxy kur ya dayanıklı veri/queue/worker mimarisine geçir. Sadece deploy READY/HTTP 200 ile otomasyon çalışıyor deme. Aynı data klasöründe ikinci süreç açma; `.server.lock` dosyasını çalışan süreç varken silme.

## Tam otonom kabul öncesi kod/ürün boşlukları

Bunları yalnızca ayar işi diye geçme:

1. **Kaçırılan yayın politikası:** Mevcut worker vadesi geçen işleri sırayla alabilir. Uzun kesintiden sonra birikmiş gönderileri art arda yayımlamayı önleyen gecikme toleransı / yeniden planlama politikasını ekle ve test et.
2. **Zaman içinde büyüme ölçümü:** Analiz şu anda API okuması ve Insights gösterir. Günlük takipçi/erişim/etkileşim snapshot’ları ve tarihsel karşılaştırma henüz yok. Gerçek veriyle ekle; tek bir yorumun takipçi kazandırdığını nedensel veri olmadan iddia etme.
3. **Performansa göre planı yenileme:** İçerik konuları ve tekrar önleme var, ancak iyi sonuç veren içeriklere göre ölçülmüş adaptif strateji döngüsü henüz tamamlanmadı. Önce yeterli gerçek ölçüm, sonra öneri/plan güncellemesi ekle.
4. **Canlı geri kazanım:** Bağlantı yenileme, restart, kesinti ve tek belirsiz gerçek işten sonra kontrollü toparlanma kanıtını al. Mock testi canlı kapasite olarak sunma.
5. **Yedek geri yükleme:** JSON export var; tam geri yükleme/medya kurtarma akışını gerçek kopya veri üzerinde prova et.

## Komutlar ve tekrar test

```powershell
Set-Location C:\Users\TP2\Documents\socialdesk
npm.cmd ci
npm.cmd test
.venv/Scripts/python.exe scripts/private_cli.py check
node --env-file-if-exists=.env scripts/audit-live-readonly.mjs
node --env-file-if-exists=.env scripts/audit-local-runtime.mjs
```

`audit-local-runtime` yerel giriş ve gerçek OKUMA çağrıları yapar; parola/tokenı çıktı vermez. Sunucu önce çalışıyor olmalı. `test-live-text.mjs --run-one` gerçek üretimdir; önce önceki başarısız/suspect isteği uzlaştır. `test-meta-container.mjs --prepare-one` gerçek container oluşturur, yayınlamaz; önceki artifact varsa tekrar başlatmayı reddeder. O dosyayı silerek kör tekrar yaptırma.

`scripts/serve-qa.mjs` ayrı data klasörü/port 14319 ve taklit sağlayıcılar kullanır. Gerçek API çağrıları test preloader’ı ile bloke edilir. QA verisini gerçek çalışma alanına seed etme; testteki sahte profil/yorum kimlikleri canlı sonuç değildir.

## Son kabul matrisi

- [ ] Yeni Meta tokenıyla doğru hesap kimliği ve yetkiler.
- [ ] Tek gerçek yayın: gerçek yayın ID + permalink + Instagram’da görüntüleme.
- [ ] Gerçek AI metni + görseli: doğru dosya/önizleme/indirme, kredi/iş uzlaştırması.
- [ ] Tek gerçek ilgili keşif sonucu ve kaynağının açılması.
- [ ] Tek gerçek yorum: doğru hesap, doğru hedef, gerçek yorum ID ve görünürlük.
- [ ] Haftalık hazırlama; dolu gün, yarım hata, iptal/devam ve çift istek koruması.
- [ ] Otomatik modun seçili saatlerde/günlük sınırla çalışması; yanlış oturumda hiç yazmaması.
- [ ] Sürekli makine restart’ı sonrası kalıcılık; eski işlerin kopyalanmaması ve toplu gecikmiş yayın olmaması.
- [ ] 320/390/1440 px, auth/logout, dosya yükleme, yanlış veri, edit/sil, taslak kurtarma.
- [ ] Sıfır sahte keşif/gönderim; test, canlı, görsel kabul ve büyüme sonucu ayrı raporlanmış.

Bunlar gerçek kanıtla geçmeden “tam otonom tamamlandı” yazma. Kullanıcıya en sonunda hangi ayarı kendisinin girmesi gerektiğini kısa ve somut anlat.
