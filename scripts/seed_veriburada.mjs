import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const accountId = '016c1c8f-1d53-4264-8668-87bacef67d0e';
const baseUrl = 'https://socialdesk-sage.vercel.app/media';

const flagship = [
  { file: '01_sehir_ve_kesif.jpg', title: 'Şehir ve Keşif: Harita Tabanlı Lokasyon Analitiği', caption: 'Şehirdeki işletme dağılımını harita üzerinde incelemek, doğru lokasyon kararları almanın en güvenilir yoludur. Tahminler yerine doğrulanmış verilerle bölgenizi analiz edin.\n\n#lokasyon #harita #verianalitiği #işletme #veriburada' },
  { file: '02_duzenli_listeler.jpg', title: 'Düzenli ve Doğrulanmış İşletme Listeleri', caption: 'Dağınık ve güncelliğini yitirmiş rehberlerle vakit kaybetmeyin. İlçe ve sektör bazında filtrelenmiş, güncel işletme listelerine tek tıkla ulaşın.\n\n#b2bveri #işletmelistesi #pazararaştırması #veritabanı #b2b' },
  { file: '03_yeni_acilan_isletmeler.jpg', title: 'Yeni Açılan İşletmeleri İlk Siz Keşfedin', caption: 'Bölgenizde yeni açılan işletmeleri sahadan önce tespit edin. Tedarikçiler, ajanslar ve hizmet sağlayıcılar için sıcak potansiyel müşteri listesi oluşturun.\n\n#yenişube #girişimcilik #satışfırsatı #potansiyelmüşteri #ticaret' },
  { file: '04_satis_arastirmasi.jpg', title: 'B2B Satış ve Saha Pazar Araştırması', caption: 'Satış ekiplerinizin sahaya çıkmadan önce hedef kitleyi netleştirmesi verimliliği artırır. Hangi mahallede kaç potansiyel müşteri olduğunu önceden görün.\n\n#satışstratejisi #sahaoperasyonu #b2bpazarlama #işgeliştirme #pazaryönetimi' },
  { file: '05_uc_adimda_liste.jpg', title: '3 Adımda Doğru İşletme Listesi', caption: 'Sektörünüzü seçin, bölgenizi filtreleyin ve doğrulanmış iletişim bilgilerini harita üzerinde inceleyin. Hedef odaklı veri analitiği Veriburada’da.\n\n#veritabanı #lokasyonanalizi #hedefkitle #işdünyası #veri' },
  { file: '06_telefon_web_adres.jpg', title: 'Doğrulanmış Telefon, Web ve Adres Verileri', caption: 'Hatalı numaralar ve kapanmış dükkanlarla zaman kaybetmeyin. Sahadan doğrulanmış güncel adres, web ve telefon kayıtlarıyla doğrudan iletişime geçin.\n\n#doğrulanmışveri #iletişim #b2bbağlantı #satışağı #kurumsal' },
  { file: '07_sektorleri_kesfet.jpg', title: 'Sektörel Kümelenme ve Yoğunluk Haritaları', caption: 'Gastronomi, sağlık, perakende veya hizmet; sektörlerin şehir içindeki kümelenme noktalarını ve rekabet yoğunluğunu haritada görselleştirin.\n\n#sektörharitası #kümelenme #rekabetanalizi #pazarbüyüklüğü #ticariveri' },
  { file: '08_ajanslar_icin.jpg', title: 'Ajanslar ve B2B Firmalar İçin Veri Altyapısı', caption: 'Müşterilerinize pazar araştırması sunarken veya yeni müşteri portföyü oluştururken sahadan gelen sağlam lokasyon verilerine dayanın.\n\n#ajans #pazarlama #müşteriedinme #b2bhizmet #strateji' },
  { file: '09_arastir_listele_baglanti_kur.jpg', title: 'Araştır, Listele ve Doğrudan Bağlantı Kur', caption: 'İş geliştirme sürecinizi 3 temel adımda hızlandırın: Pazarınızı araştırın, ilgili işletmeleri listeleyin ve doğrudan karar vericilerle temas kurun.\n\n#işbüyütme #müşteribağlantısı #pazarliderliği #analitik #veriburada' },
  { file: '10_firsatlar_orada_veri_burada.jpg', title: 'Fırsatlar Orada, Doğru Veri Burada', caption: 'Doğru kararlar sahadan doğrulanmış veriyle alınır. Şehrin ticari potansiyelini harita üzerinde keşfetmek için Veriburada’yı inceleyin.\n\n#veriburada #yerelzeka #haritaanalizi #büyümestratejisi #türkiye' },
  { file: 'veriburada_tanitim_reel.mp4', title: 'Veriburada Platform Tanıtımı', kind: 'reel', caption: 'Şehrin tüm ticari dokusu tek bir haritada. Veriburada ile lokasyon analitiği, doğrulanmış işletme listeleri ve pazar araştırması artık çok daha hızlı.\n\n#veriburada #reels #lokasyonanalitiği #haritazekası #b2b' }
];

const postTopics = [
  ['Kadıköy Yeme-İçme Aksı ve Rekabet Analizi', 'Kadıköy genelinde kafe ve restoranların sokak bazlı dağılımı. Yeni şube açılışında yaya trafiği ve rekabet doygunluğu analizi kritik rol oynar.\n\n#kadıköy #gastronomi #lokasyonanalizi #işletme #veriburada'],
  ['Beşiktaş Hizmet ve Ofis Kümelenmesi', 'Beşiktaş merkez ve Levent hattında ticari işletmelerin yoğunluğu. Kurumsal hizmet firmaları için doğru lokasyon seçimi.\n\n#beşiktaş #levent #ticariemlak #ofis #analiz'],
  ['Şişli Perakende ve Ticaret Haritası', 'Büyükdere Caddesi ve Nişantaşı aksında perakende rekabet analizi. Tüketici hareketliliğini harita üzerinde izleyin.\n\n#şişli #nişantaşı #perakende #mağazacılık #harita'],
  ['Ankara Çankaya Ticari Dinamikleri', 'Tunalı ve Gaziosmanpaşa hattında ticari hareketlilik. Doğrulanmış işletme verileriyle hedef pazarınızı belirleyin.\n\n#ankara #çankaya #ticariveri #işdünyası #analitik'],
  ['İzmir Alsancak ve Kordon İşletme Analizi', 'Alsancak genelinde yeme-içme ve eğlence sektörünün yoğunluk noktaları. Rakip analizinde saha verilerinin önemi.\n\n#izmir #alsancak #kordon #rekabetanalizi #pazar'],
  ['Bursa Nilüfer Gelişim Aksı Verisi', 'Nilüfer\'de yeni kurulan işletmeler ve hızla büyüyen yerleşim alanlarının ticari potansiyeli.\n\n#bursa #nilüfer #kentselbüyüme #yatırım #veriburada'],
  ['Antalya Muratpaşa Turizm ve Yerel Esnaf', 'Lara ve Konyaaltı aksında turizm sezonu dışındaki yerel ticari hareketlilik ve işletme yoğunluğu.\n\n#antalya #muratpaşa #turizm #yerelişletme #analiz'],
  ['Mimarlık ve Kentsel Tasarımda Lokasyon Zekâsı', 'Karma projelerde doğru fonksiyon karması oluşturmak için çevresel işletme dokusunun tespiti.\n\n#mimarlık #şehircilik #kentseltasarım #proje #veri'],
  ['Gastronomi Sektöründe Şubeleşme Stratejisi', 'Müşteri profili ile uyumlu sokakların seçimi, kira-ciro dengesi ve bölgesel doygunluk analitiği.\n\n#restoran #kafe #şubeleşme #işletmeyönetimi #lokasyon'],
  ['Ticari Gayrimenkulde Veri Odaklı Değerleme', 'Dükkan ve ofis kiralamalarında çevredeki işletme karması ve ticari sirkülasyon verilerinin kullanımı.\n\n#gayrimenkul #ticariemlak #değerleme #lokasyonzekası #yatırım'],
  ['B2B Satış Ekipleri İçin Bölgesel Müşteri Listeleri', 'Satış temsilcilerinin rota optimizasyonu ve bölge bazlı hedef işletme listeleriyle verimliliği artırın.\n\n#b2bsatış #rotaoptimizasyonu #sahaelçisi #işgeliştirme #veriburada'],
  ['Yeni Açılan İşletmeler İçin Tedarikçi Fırsatları', 'Haftalık olarak güncellenen yeni işletme veritabanı ile ilk teklifi veren tedarikçi siz olun.\n\n#tedarikçi #toptanticaret #sıcakfırsat #pazarfırsatları #ticaret'],
  ['Sağlık ve Klinik Sektöründe Lokasyon Belirleme', 'Eczane, poliklinik ve laboratuvarların bölgesel dağılımı ve sağlık erişim aksları analizi.\n\n#sağlık #klinik #eczane #lokasyonanalitiği #sağlıksektörü'],
  ['Otomotiv ve Servis Ağı Dağılımı', 'Sanayi siteleri ve ana arterler boyunca otomotiv bakım-onarım noktalarının coğrafi dağılımı.\n\n#otomotiv #servis #lojistik #haritaanalizi #veri'],
  ['Lojistik ve Dağıtım Merkezleri İçin Ulaşım Aksları', 'Son kilometre teslimatında depo ve dağıtım noktalarının müşteri kümelenmelerine mesafesi.\n\n#lojistik #depolama #teslimat #tedarikzinciri #analiz'],
  ['Eğitim ve Kurs Merkezleri İçin Bölge Analizi', 'Öğrenci yoğunluğu, okullara yakınlık ve ulaşım bağlantılarının harita üzerinde incelenmesi.\n\n#eğitim #kurs #bölgeanalizi #hedefkitle #strateji'],
  ['Finans ve Sigorta Acenteleri İçin Pazar Haritası', 'KOBİ yoğunluğunun yüksek olduğu ticaret merkezlerinde acente lokasyon seçimi.\n\n#finans #sigorta #kobi #ticaretmerkezi #analitik'],
  ['Güzellik ve Kişisel Bakım Sektör Analitiği', 'Kuaför, güzellik salonu ve bakım merkezlerinin cadde bazlı rekabet ve fiyat segmenti dağılımı.\n\n#kişiselbakım #güzellikmerkezi #caddeanalizi #rekabet #veri'],
  ['Spor Salonu ve Fitness Merkezleri İçin Lokasyon', 'Konut ve ofis yoğunluğunun kesişim noktalarında spor tesisi yatırımı planlaması.\n\n#fitness #spor #lokasyonseçimi #bölgeselanaliz #veriburada'],
  ['Organize Sanayi Bölgelerinde Firma Verileri', 'OSB genelindeki üretim tesisleri ve sanayi kuruluşlarının güncel iletişim ve faaliyet haritası.\n\n#osb #sanayi #üretim #b2bveri #imalat'],
  ['Şehir Merkezlerinde Yaya Sirkülasyonu Modelleri', 'Trafik ve yaya akışının dükkan cirolarına etkisi ve cadde ölçeğinde veri analizi.\n\n#yayatrafigi #cadde #ticaret #şehircilik #analiz'],
  ['Perakende Zincirleri İçin Boşluk Analizi (White Space)', 'Rakiplerin bulunmadığı ancak yüksek talep potansiyeli taşıyan kör noktaların haritada keşfi.\n\n#perakende #whitespace #pazarboşluğu #büyüme #strateji'],
  ['Franchise Ağları İçin Bölge Koruma ve Dağılım', 'Mevcut bayiler arası yamyamlaşmayı önleyen güvenli mesafe ve bölge sınırlandırma analitiği.\n\n#franchise #bayilik #bölgekoruma #bayiyönetimi #veriburada'],
  ['Toptan ve Perakende Ticaret Arasındaki Denge', 'Merkez toptancı halleri ve perakende satış noktaları arasındaki coğrafi tedarik ilişkisi.\n\n#toptan #perakende #tedarik #pazar #analitik'],
  ['E-Ticaret Depoları ve Mikro Dağıtım Merkezleri', 'Hızlı teslimat ağları için mahalle ölçeğinde karanlık depo (dark store) lokasyon seçimi.\n\n#eticaret #darkstore #hızlıteslimat #lokasyon #şehir'],
  ['Turistik Bölgelerde Sezonluk İşletme Hareketliliği', 'Kıyı şeritlerinde yaz ve kış aylarındaki işletme açılış-kapanış dinamikleri.\n\n#turizm #sezonlukticaret #kıyıbölgeleri #pazardinamiği #veri'],
  ['Kentsel Dönüşümün Perakende Dokusuna Etkisi', 'Yenilenen mahallelerde değişen sosyoekonomik profil ve yeni işletme talepleri.\n\n#kentseldönüşüm #mahalledokusu #sosyoekonomi #şehircilik #analiz'],
  ['KOBİ’ler İçin Dijital Varlık ve Harita Doğrulaması', 'Harita platformlarında güncel olmayan veya eksik işaretlenmiş işletmelerin tespiti.\n\n#kobi #dijitalharita #işletmedoğrulama #yerelreklam #veri'],
  ['Pazar Araştırmasında Doğrulanmış Saha Verisinin Gücü', 'Anket tahminleri yerine sahadan doğrulanmış reel işletme sayılarıyla strateji kurun.\n\n#pazararaştırması #doğrulanmışveri #reelpiyasa #işgeliştirme #veriburada'],
  ['Geleceğin Akıllı Şehirlerinde Lokasyon Analitiği', 'Şehir ekonomisinin canlı verilerle izlenmesi ve veri odaklı yerel yönetim politikaları.\n\n#akıllışehir #şehirekonomisi #büyükveri #lokasyonanalitiği #gelecek']
];

const yeniTopics = [
  ['Veri Odaklı Büyüme: Sezgilere Değil Sayılara Güvenin', 'Pazar stratejinizi sahadan doğrulanmış işletme verileri üzerine inşa edin.\n\n#veriodaklı #büyüme #strateji #işdünyası #veriburada'],
  ['Müşteri Segmentasyonunda Bölgesel Filtreleme', 'Farklı gelir ve tüketim alışkanlıklarına göre optimize edilmiş işletme hedeflemesi.\n\n#segmentasyon #hedefkitle #pazarlama #b2b #analitik'],
  ['Saha Satışında Rota ve Bölge Planlaması', 'Gereksiz seyahat süresini azaltıp müşteri ziyaret sıklığını artıran akıllı coğrafi planlama.\n\n#rotaplanlama #sahayönetimi #satışgücü #verimlilik #veri'],
  ['Şube Açılışında Riskleri Sıfırlayın', 'Doğru lokasyon seçimi maliyetleri düşürür, ciroya ulaşma süresini yarıya indirir.\n\n#lokasyonseçimi #şubeaçılışı #yatırımriski #karlılık #analiz'],
  ['Doğrulanmış B2B İletişim Kanalları', 'Doğrudan yetkiliye ulaşan telefon ve adres bilgileriyle satış dönüşüm oranlarını yükseltin.\n\n#iletişim #b2bdönüşüm #leadgeneration #satış #veriburada'],
  ['Şehir Dokusunda Rakip Analizi', 'Rakiplerin yoğunlaştığı alanları ve henüz keşfedilmemiş potansiyel sokakları tek haritada görün.\n\n#rakipanalizi #pazarfırsatı #caddeverisi #ticaret #strateji'],
  ['Perakende Sektöründe Yaya Aksı Değerlemesi', 'Tabela değeri yüksek sokakların gerçek müşteri çekim gücünü verilerle ölçün.\n\n#tabeladeğeri #yayaakışı #perakendedeğerleme #gayrimenkul #lokasyon'],
  ['Yeni İş Birliklerinde Doğru Partner Tespiti', 'Bölgenizdeki tamamlayıcı hizmet sağlayıcıları listeleyin ve çapraz satış fırsatları yakalayın.\n\n#işortaklığı #çaprazsatış #b2bortaklık #ekosistem #ticaret'],
  ['Lokasyon Verisi ile Hedefli Reklam Kampanyaları', 'Sosyal medya reklamlarınızı işletme yoğunluğunun en yüksek olduğu ilçe ve mahallelere odaklayın.\n\n#hedefliithalat #reklamoptimizasyonu #yerelreklam #dijitalpazarlama #veri'],
  ['Kentsel Veri Analitiğinde Yeni Standart', 'Şehrin nabzını tutan dinamik işletme veritabanı ile pazarınızı yakından tanıyın.\n\n#kentselveri #şehirharitası #büyükveri #lokasyonbilgisi #veriburada'],
  ['Ajanslar İçin Müşteri Portföyü Genişletme', 'Bölgesel işletme listeleri ile soğuk aramaları yüksek dönüşümlü iş görüşmelerine dönüştürün.\n\n#ajanslar #leadgen #portföy #müşterikazanımı #pazarlama'],
  ['Yeme-İçme Sektöründe Paket Servis ve Teslimat Alanı', 'Sipariş yoğunluğunun yüksek olduğu mahalleleri tespit ederek teslimat yarıçapınızı belirleyin.\n\n#paketservis #teslimatbölgesi #restorancılık #lokasyon #analiz'],
  ['Ticari Kararlarınızı Veriyle Güçlendirin', 'Tahminlerin yerini sahadan toplanmış güvenilir veriler aldığında büyüme kaçınılmazdır.\n\n#güvenilirveri #karardestek #işyönetimi #analitik #veriburada'],
  ['Sağlık Turizminde Hedef Acenteler ve Klinikler', 'Bölgesel sağlık hizmeti sunucularını ve iş birliği yapılabilecek klinikleri haritada inceleyin.\n\n#sağlıkturizmi #klinikharitası #b2bişbirliği #sağlık #veri'],
  ['E-İhracat ve B2B Üretici Veritabanı', 'Yerel imalatçıları ve potansiyel ihracatçı firmaları sektör bazlı listelerle keşfedin.\n\n#eihracat #imalat #üretici #b2btürkiye #ticaret'],
  ['Girişimciler İçin Fizibilite Raporu Hazırlığı', 'İş planı hazırlarken yatırımcılara sunulacak bölgesel pazar ve rekabet verileri.\n\n#fizibilite #işplanı #yatırımcı #girişimcilik #lokasyon'],
  ['Perakendede Sezonluk Trend Takibi', 'Dönemsel işletme hareketlerini ve tüketici alışveriş akslarındaki değişimleri analiz edin.\n\n#trendtakibi #perakendetrend #tüketicialışkanlığı #sezonluk #analiz'],
  ['Bölge Bazlı Pazar Payı Hesaplama', 'Kendi markanızın ve rakiplerinizin belirli ilçelerdeki pazar ağırlığını ölçün.\n\n#pazarpayı #bölgeselgüç #rekabetharitası #stratejikplanlama #veriburada'],
  ['Kurumsal Satışta Zaman Yönetimi', 'Dağınık listeler yerine coğrafi olarak sıralanmış potansiyel müşterilere odaklanın.\n\n#zamanyönetimi #kurumsalsatış #verimliçalışma #b2bstrateji #veri'],
  ['Veriburada: Türkiye’nin Lokasyon ve İşletme Zekâsı', 'Harita tabanlı analitik, doğrulanmış işletme veritabanı ve pazar araştırması tek platformda.\n\n#veriburada #yerelzeka #türkiye #işletmeharitası #b2bplatformu']
];

const allPosts = [];
let startDate = new Date('2026-11-01T10:00:00.000Z');

// 1. Flagship posts
flagship.forEach((item, index) => {
  const d = new Date(startDate.getTime() + index * 24 * 3600 * 1000);
  allPosts.push({
    id: randomUUID(),
    title: item.title,
    caption: item.caption,
    kind: item.kind || 'image',
    status: 'scheduled',
    accountId,
    scheduledAt: d.toISOString(),
    mediaUrl: `${baseUrl}/${item.file}`,
    theme: 'forest',
    createdAt: new Date().toISOString()
  });
});

// 2. Post 01 - 30
postTopics.forEach((item, index) => {
  const num = String(index + 1).padStart(2, '0');
  const d = new Date(startDate.getTime() + (flagship.length + index) * 24 * 3600 * 1000);
  allPosts.push({
    id: randomUUID(),
    title: item[0],
    caption: item[1],
    kind: 'image',
    status: 'scheduled',
    accountId,
    scheduledAt: d.toISOString(),
    mediaUrl: `${baseUrl}/post_${num}.jpg`,
    theme: 'forest',
    createdAt: new Date().toISOString()
  });
});

// 3. Yeni 01 - 20
yeniTopics.forEach((item, index) => {
  const num = String(index + 1).padStart(2, '0');
  const d = new Date(startDate.getTime() + (flagship.length + postTopics.length + index) * 24 * 3600 * 1000);
  allPosts.push({
    id: randomUUID(),
    title: item[0],
    caption: item[1],
    kind: 'image',
    status: 'scheduled',
    accountId,
    scheduledAt: d.toISOString(),
    mediaUrl: `${baseUrl}/veriburada_yeni_${num}.jpg`,
    theme: 'forest',
    createdAt: new Date().toISOString()
  });
});

console.log('Total scheduled posts created:', allPosts.length);

const brand = {
  name: 'Veriburada',
  handle: 'veriburada',
  sector: 'Yerel İşletme ve Lokasyon Veri Analitiği',
  audience: 'İşletme sahipleri, mimarlar, satış ekipleri, girişimciler ve şehir analistleri',
  tone: 'Net, profesyonel, yapay zekâ klişelerinden uzak doğal kurumsal dil'
};

const workspace = {
  posts: allPosts,
  opportunities: [
    {
      id: randomUUID(),
      url: 'https://www.instagram.com/p/Cx101mimari/',
      topic: 'Mimarlık ve Şehir Projesinde Lokasyon Analitiği',
      note: 'Proje geliştirme aşamasında çevresel ticari fonksiyon karması ve yaya aksı analizleri soruldu. Veriburada lokasyon analitiği uzmanlığıyla organik yanıt verilebilir.',
      createdAt: new Date().toISOString()
    },
    {
      id: randomUUID(),
      url: 'https://www.instagram.com/p/Cx201gastronomi/',
      topic: 'Yeni Restoran & Kafe Şube Lokasyon Seçimi',
      note: 'Kadıköy ve Beşiktaş bölgesinde yeme-içme açılışı için rekabet ve yaya yoğunluğu sorusu. Saha verisi ve harita zekasıyla kapalı reklam yapılabilir.',
      createdAt: new Date().toISOString()
    }
  ],
  brand,
  events: []
};

fs.writeFileSync('data/workspace.json', JSON.stringify(workspace, null, 2), 'utf8');
console.log('Saved to data/workspace.json successfully!');
