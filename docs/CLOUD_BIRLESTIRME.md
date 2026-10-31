> Güncel canlı durum: [1 Kasım raporu](SON_DURUM_2026-11-01.md). Aşağıdaki metin geçişin önceki aşamalarını da içerir.

# Oracle üzerinde tek uygulamaya geçiş

Bu değişiklikler yereldir. Eski cloud daemon hâlâ eski sürümde çalışabilir. Canlı başarı iddiası değildir.

## Son davranış

- `scripts/organic_growth_daemon.mjs`, ayrı rastgele etkileşim döngüsü yerine ana `server.mjs` uygulamasını 4318 portunda başlatır. Yayın, haftalık üretim, ilgili gönderi keşfi ve yorum işleri aynı kalıcı store ve süreç kilidini kullanır.
- `scripts/turbo_growth.mjs` ayrı ve kayıtsız işlem yapmayı reddeder. Eski çalışan süreçler dosya değişince durmaz; geçişte ayrıca kontrol edilmelidir.
- Vercel bütün `/api/` ve `/media/` isteklerini HTTPS kalıcı backend'e iletir. Cloud erişilemiyorsa yerel veya örnek veriyle başarı göstermez.
- Otomatik keşif Meta ile doğrulanmış marka ve aynı özel Instagram kimliği gerektirir. AI değerlendirmesi/yorum üretimi başarısızsa hazır metne düşmez. İnceleme sırasında beğeni/takip/hikaye işlemi yapmaz.
- Otomatik yorumlar ortak kuyruğa kaydedilir; kurallar kapatılınca gönderim durur. Sonucu belirsiz işler otomatik yeniden gönderilmez.
- Günlük Meta takipçi ölçümü hesap kimliği ve gözlem tarihiyle saklanır. Veri yoksa takipçi sayısı bilinmiyor gösterilir. Yerel yayın kaydı dışında yayın sayısı uydurulmaz.

## Geçiş sırası

1. Oracle çalışma klasörü, mevcut servis tanımları, `.env`, integrations, workspace, private-session ve medya dosyalarını erişimi kısıtlı bir yedeğe alın. Eski daemon ve varsa turbo sürecin son işini kontrol edin; sonucu belirsiz işlemleri tekrar başlatmayın.
2. Node 22+ doğrulayın. Yerel kaynak değişikliklerini inceleyip Oracle'a aktarın; Oracle `data/` ve `.env` dosyalarını yerel dosyalarla ezmeyin. `npm ci --omit=dev` çalıştırın. Python ortamında `requirements-private.lock.txt` kullanın.
3. Oracle `.env`: mevcut AI ve Meta ayarlarını koruyun; `ADMIN_PASSWORD`, `AUTH_SECRET`, rastgele en az 32 karakter `SOCIALDESK_BRIDGE_TOKEN`, `ALLOWED_ORIGINS=https://socialdesk-sage.vercel.app`, `COOKIE_SECURE=true`, kalıcı `SOCIALDESK_DATA_DIR` ayarlayın. Yerleşik yönetici şifresi kaldırıldı. Özel oturum dosyası Meta doğrulaması yerine geçmez.
4. Eski daemon/turbo süreçlerini durdurun. Güncellenmiş `socialdesk-growth.service` tanımını uygulayın; tek ana uygulama başlatın. Aynı data klasöründe ikinci süreç kilit hatası vermelidir. Veri veya kuyruk durumunu sıfırlamayın.
5. Kalıcı adlandırılmış HTTPS tünelini 127.0.0.1:4318'e yönlendirin. Geçici trycloudflare adresi servis yeniden başladığında değişebilir; sabit adres tercih edin.
6. Vercel'de `SOCIALDESK_BACKEND_URL` bu HTTPS adresi, `SOCIALDESK_BRIDGE_TOKEN` Oracle ile aynı olsun. Gizli değeri URL parametresine koymayın. Sonra frontend'i yeniden yayınlayın.

## Canlı kabul

- Panelde yeniden giriş yapın; çıkıştan sonra workspace 401 dönsün. Eski `?secret=socialdesk_live_bridge` ifadesi erişim sağlamasın.
- Aynı içerik Oracle ve Vercel panelinde görünsün; servis restartından sonra kayıt ve medya korunsun.
- Bağlantı kesilince panel hata göstersin, motor aktif veya takipçi 0 diye tahmin yapmasın.
- Doğru Instagram kimliği ve Meta izinleriyle bir takipçi ölçümü alın; hesap eşleşmesini doğrulayın.
- Mevcut içeriklerin zamanlarını kontrol edin. Gecikmiş işler aniden topluca yayınlanmasın. Kuyruktaki tek canary yayının gerçek Instagram permalink'ini kontrol edin.
- Gerçek ilgili bir gönderinin kaynak metni, AI alaka değerlendirmesi ve taslak yorumunu inceleyin. Onaylanan tek yorumun kimliğini ve Instagram'da görünmesini kontrol edin. Aynı gönderi tekrar kuyruğa alınmasın.
- AI sağlayıcı hata/429 durumunda üretim başarılı sayılmasın, hazır yorum gönderilmesin.

Bu aşamada otomatik beğeni/takip/hikaye yan etkileri kaldırılmıştır; kalıcı iş kaydı ve ortak limitleri olmadan tekrar açmayın. Müşteri dönüşüm sayısı için site analitiği/lead bağlantısı ayrıca gereklidir; takipçi kazanımı garanti edilmez.

## 1 Kasım 2026 cloud kontrolü

- Oracle'da `/home/opc/socialdesk-candidate-20261101` aday kurulumu hazırlandı; mevcut ana daemon dizini korunmuştur.
- Doğrulanmış resmi Node dağıtımından ARM64 Node 22.23.4 ayrı `/usr/local/bin/socialdesk-node22` olarak kuruldu. Sistem Node 20 ve OmniStudio değiştirilmedi.
- Aday servis: `socialdesk-candidate-v2.service`, yalnızca 127.0.0.1:14328. Zamanlayıcı kapalıdır; otomatik yayın/yorum yapmaz. Bu geçici systemd test birimidir, canlı servis değildir.
- Adayda 67 içerik korundu. Özel oturum kimliği gerçekten `veriburada`. Meta doğrulaması gerçek çağrıda 190 hatası verdi; aday kaydında resmi yayınlama kapatıldı. AI health yalnızca erişilebilirlik kanıtıdır; gerçek yeni üretim yapılmadı.
- Vercel bağlantısı aynı mesajify takımını görüyor fakat Socialdesk proje sorgusu 404 ve proje listesi boş dönüyor. CLI oturumu başlatıldı; kullanıcı cihaz girişini tamamlamalı.
- Eski `socialdesk-growth.service`, tünel ve OmniStudio çalışmaya devam ediyor. Bunlar aday koda geçirilmedi. Kullanıcının eski hazır yorum motoru bu yüzden cloud'da hâlâ çalışıyor olabilir.
