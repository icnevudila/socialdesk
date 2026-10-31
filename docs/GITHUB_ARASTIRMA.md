# Instagram büyüme aracı: kütüphane değerlendirmesi

1 Kasım 2026; kaynaklar doğrudan proje sahipleri ve Meta koleksiyonudur. Bütün GitHub kütüphanelerinin eksiksiz tarandığı iddia edilmez.

| Kaynak | İşlev | Karar |
|---|---|---|
| https://github.com/meta/facebook-nodejs-business-sdk | Meta Business/Marketing API SDK | Resmi API işlemleri için incelendi. Mevcut küçük Graph istemcisini aynı endpointler için ikinci bir SDK ile çoğaltmaya gerek yok. |
| https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api | Meta Instagram API sözleşmesi | Kendi profesyonel hesabının yayınları, yorum yönetimi ve ölçümleri için ana kaynak. Başkalarının gönderilerine beğeni/takip otomasyonunun resmi API'de desteklendiği varsayılmadı. |
| https://github.com/subzeroid/instagrapi | Resmi olmayan özel Instagram API istemcisi | Zaten kurulu; tek özel API adaptöründe tutuldu. Yorum ve beğeni için kalıcı iş kaydı, kimlik eşleşmesi, tekrar kontrolü ve durdurma eklendi. Kütüphane hesap kısıtlanması riskini sıfırlamaz. |
| https://github.com/taskforcesh/bullmq | Kalıcı dağıtık iş kuyruğu | Çok işçili kurulum için uygun aday. Şimdiki tek hesap/tek süreç kurulumuna ek Redis işletme yükü getirmemek için kurulmadı; mevcut atomik dosya kuyruğu ve süreç kilidi korundu. |

## Uygulanan sınırlar

- Hazır reklam yorumları ve AI hatasında başarı taklidi kaldırıldı.
- Alaka filtresi ve kaynak gönderi metni olmadan otomatik yorum üretilmez.
- Beğeni yalnızca kurallarla gönderilmiş bir yorumdan sonra ayrı iş olarak kaydedilir; kapatılabilir, günlük sayaç ve ortak aralık kontrolünden geçer.
- Sonucu belirsiz dış işlem otomatik tekrarlanmaz. Aynı URL tekrar gönderilmez.
- Ayrı turbo motoru ve kayıtsız takip/hikaye yan etkileri devre dışıdır. Hesap kısıtlamasını aşmak için kimlik/IP değiştirme veya engel atlatma eklenmedi.
- Platformun izinleri, uygulama incelemesi ve hesap sınırlamaları geçerlidir. Sabit gecikme veya sayı banlanmama garantisi değildir.

## Büyümeyi ölçme

Takipçi sayısı günlük gerçek Meta gözlemiyle kaydedilir; ilk gün büyüme karşılaştırması yapılamaz. Takipçi artışı ve müşteri dönüşümü vaat edilmez. İçerik performansı ve site/lead dönüşüm ölçümü ayrı kabul gerektirir.
