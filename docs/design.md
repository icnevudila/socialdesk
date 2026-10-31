# Güncel tasarım kilidi

Kullanıcının 30 Ekim'de verdiği logo yeni ana referanstır. Önceki yeşil yön yerini bu palete bırakır. Logo dosyası değiştirilmeden kullanılır.

| Karar | Kaynak | Rol |
|---|---|---|
| #6740c6 | Kullanıcının logosundaki mor | Birincil eylem, aktif menü |
| #29233c | Logodaki koyu mor | Başlık ve gövde |
| #f8f7fb / beyaz | Logonun beyaz zemini | Çalışma yüzeyleri |
| Fuşya ve sıcak turuncu | Logo | Yalnızca logo ve özgün içerik çiziminin şeridi |
| Görev odaklı ana ekran | Kullanıcının AI slop itirazı | Slogan alanı kaldırıldı; gerçek taslak sayısı ve yeni içerik eylemi |
| workspace-art.svg, calendar-art.svg | Bu proje için elde kodlanan SVG | İçerik kartı / takvim işlevlerini anlatan çizimler; sahte analiz yok |

Yoğun arayüzde gradient yüzey, dekoratif parıltı, büyük slogan ve anlamsız KPI grafiği kullanılmaz. LINE Seed ve görev menüsü korunur.

## 31 Ekim — Kullanılabilirlik son düzenlemeleri

- Stüdyo: yeni içerik / içerik kütüphanesi sekmeleri, başlık-açıklama araması ve durum filtresi.
- Keşif: inceleme listesi / otomasyon / hashtag arama sekmeleri. Sekme değişimi alanları yeniden oluşturup metni kaybettirmez.
- Kaynak gönderi bağlamı ve yayınlanacak yorum ayrı alanlar. Aynı hesap/istek kimliği ve geç kalan yanıtlar bağlamı bozamaz.
- İstanbul saatleri, gerçek kurulum durumları, kaydedilmemiş içerik kurtarma; auth ekranında parola veya örnek giriş bilgisi yok.
- Türkçe font aralıkları, okunabilir ikincil metin, klavyeyle sekme geçişi, 320/390/1440 px kontrolleri.
- Insights normal görünümde ölçüm adı/değeri; teknik ayrıntı istenirse açılır.


## 1 Kasım ekran düzeltmeleri: referans kilidi

Birincil kaynak kullanıcının renkli Socialdesk logosu ve mevcut beyaz/mor çalışma alanıdır: beyaz yüzey, okunur koyu metin, aksiyon/seçili durumlarda mor; dekoratif kart ve pazarlama rozeti eklenmez.
İkincil kaynaklar: Buffer Publish (https://buffer.com/publish) içerik/takvim/kuyruk ayrımı; GitHub Primer FormControl (https://primer.style/product/components/form-control/) etiket, açıklama ve hata mesajını aynı kontrol çevresinde tutma.

| Karar | Kaynak | Uygulama |
|---|---|---|
| Renk ve logo korunur | Kullanıcı referansı | Mor yalnızca aksiyon, seçim ve ölçüm çubuğunda |
| Büyüme ekranında tek hiyerarşi | Gerçek mevcut ekranın denetimi | Durum, takipçi ölçümü, günlük kuyruk, son yorumlar |
| Sabit güvenlik puanı kaldırılır | Gerçek veri şartı | Sıfır risk/100 puan yerine işçi durumu ve son ölçüm |
| Formlar dar ekranda tek kolon | Primer kontrol düzeni | Etiketler ve hata metinleri görünür; butonlar taşmaz |
| Takvim ve içerik stüdyosu ayrı kalır | Buffer yayınlama akışı | Planlama ve düzenleme aynı dev karta yığılmaz |

Refero MCP ve becerinin referans dosyaları bu kurulumda yok; kullanıcı referansı ve yukarıdaki birincil ürün kaynakları kullanıldı.
