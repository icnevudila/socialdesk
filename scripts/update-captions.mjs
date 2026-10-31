import { readFile, writeFile } from 'node:fs/promises';

const customData = [
  {
    index: 0,
    caption: `Bir şehirde ticari başarı, sokak sokak veriyi okumaktan geçer. Veriburada, binlerce işletmenin konumunu, sektörünü ve doğrulanmış iletişim bilgisini tek bir interaktif haritada birleştiriyor. Bölgenizdeki fırsatları ve rekabet boşluklarını keşfetmek için haritayı veriburada.com'da açın.\n\n#lokasyonanalitiği #veriburada #harita #işletmeanalizi #şehirverisi`
  },
  {
    index: 1,
    caption: `İnternetteki eski rehberlerle veya kapanmış dükkan adresleriyle zaman kaybetmeyin. İlçe, mahalle ve kategori bazında filtrelenmiş güncel işletme listeleriyle satış hedeflerinize doğrudan odaklanın. Kendi listenizi oluşturmak için: veriburada.com\n\n#işletmelistesi #b2bpazarlama #doğrulanmışveri #veriburada #satışhedefi`
  },
  {
    index: 2,
    caption: `Bölgenizde kapılarını yeni açan işletmeler; POS cihazı, tabela, tedarik, toptan ürün ve dijital pazarlama arayışındadır. Rakiplerinizden önce sahadaki yeni işletmeleri tespit etmek ve ilk teklifi vermek için veriburada.com üzerinden güncel kayıtları takip edin.\n\n#yeniaçılanişletmeler #tedarikçi #b2bsatış #fırsattakibi #veriburada`
  },
  {
    index: 3,
    caption: `Saha satış ekibinizi rastgele sokaklara göndermek yüksek maliyet ve zaman kaybı demektir. Hedef kitlenizin hangi caddelerde yoğunlaştığını önceden haritada görün, rotanızı veriye göre çizin. Saha verimliliğinizi katlamak için veriburada.com yanınızda.\n\n#sahasatışı #rotaplanlama #b2bstrateji #veriodaklı #veriburada`
  },
  {
    index: 4,
    caption: `1. Sektörünüzü belirleyin. 2. Şehir veya ilçe sınırınızı çizin. 3. Doğrulanmış firma listesini saniyeler içinde ekrana getirin. İş geliştirme sürecinizi hızlandırmak bu kadar kolay. Şimdi veriburada.com adresinde deneyin.\n\n#işgeliştirme #verianalizi #kolayerişim #pazararaştırması #veriburada`
  },
  {
    index: 5,
    caption: `Ulaşılamayan telefonlar ve yanlış konumlar satış funnel'ınızı tıkar. Veriburada, işletmelerin güncel telefon, web sitesi ve açık adres verilerini sürekli denetleyerek sunar. Güvenilir veri altyapısıyla çalışmak için: veriburada.com\n\n#iletişimverisi #müşteriveritabanı #doğruluk #verikalitesi #veriburada`
  },
  {
    index: 6,
    caption: `Kafenizi nereye açmalısınız? Eczane veya klinik için hangi cadde daha uygun? Şehir içindeki sektörel kümelenmeleri ısı haritalarıyla analiz edin, doğru lokasyon kararını veriburada.com ile verin.\n\n#ısıharitası #kümelenme #lokasyonseçimi #rekabetanalizi #veriburada`
  },
  {
    index: 7,
    caption: `Müşterilerinize yerel pazar analizi sunarken ya da yeni müşteri portföyü oluştururken kulaktan dolma bilgilere değil, sahadan doğrulanmış kentsel verilere dayanın. Ajanslar için kurumsal veri çözümleri veriburada.com'da.\n\n#ajanslar #pazararaştırması #kurumsalveri #b2baltyapı #veriburada`
  },
  {
    index: 8,
    caption: `Pazarınızı tanıyın, potansiyel müşterilerinizi nokta atışı listeleyin ve doğrudan karar vericilere ulaşın. Satış döngünüzü kısaltmanın en kestirme yolu veriburada.com rehberliğinde.\n\n#satışdöngüsü #doğrudaniletişim #b2bbüyüme #müşteribulma #veriburada`
  },
  {
    index: 9,
    caption: `Doğru lokasyon ve müşteri analitiği artık büyük holdinglerin tekelinde değil. KOBİ'lerden girişimcilere herkes için erişilebilir, güncel ve harita tabanlı veri ekosistemi veriburada.com adresinde sizi bekliyor.\n\n#veriburada #kentselanaliz #yerelişletme #büyümestratejisi #lokasyon`
  },
  {
    index: 10,
    caption: `Aradığınız işletmeleri il, ilçe ve sektöre göre harita üzerinde saniyeler içinde filtreleyin. Şehrin ticari nabzını tutan yeni nesil lokasyon zekâsı platformuyla tanışmak için videoyu izleyin, detaylar için veriburada.com'u ziyaret edin.\n\n#veriburadaplatformu #tanıtım #lokasyonverisi #şehiranaliği #keşfet`
  },
  {
    index: 11,
    caption: `Moda, Caferağa ve Rıhtım aksında kafe ve restoran yoğunluğu nerede toplanıyor? Kadıköy'de yeme-içme sektöründeki rekabeti ve yaya trafiğine açık boşlukları incelemek için haritanızı veriburada.com üzerinde filtreleyin.\n\n#kadıköy #kadıköymoda #gastronomi #kaferestoran #veriburada`
  },
  {
    index: 12,
    caption: `Barbaros Bulvarı ve çarşı çevresindeki kurumsal ofis, danışmanlık ve acente dağılımı B2B hizmet sağlayıcılar için zengin bir ekosistem sunuyor. Beşiktaş'taki işletme haritasına veriburada.com üzerinden göz atın.\n\n#beşiktaş #kurumsalofis #b2bhizmet #lokasyonharitası #veriburada`
  },
  {
    index: 13,
    caption: `Halaskargazi'den Mecidiyeköy'e uzanan perakende omurgasında hangi sektörler öne çıkıyor? Toptan ve perakende mağaza dağılımını sahadan gelen güncel verilerle analiz etmek için veriburada.com yanınızda.\n\n#şişli #mecidiyeköy #perakende #ticaretharitası #veriburada`
  },
  {
    index: 14,
    caption: `Tunalı Hilmi, Gaziosmanpaşa ve Çukurambar aksında kamu, hukuk, danışmanlık ve gastronomi işletmelerinin kümelenmesini inceleyin. Başkentin ticari kalbini veriburada.com ile analiz edin.\n\n#ankara #çankaya #ticaretanalitiği #yerelveri #veriburada`
  },
  {
    index: 15,
    caption: `Kordon boyunca uzanan hizmet ve yeme-içme sektörü ile Alsancak iç sokaklarındaki butik işletmelerin yoğunluk dağılımını haritada görün. İzmir pazarını incelemek için: veriburada.com\n\n#izmir #alsancak #kordon #işletmeverisi #veriburada`
  },
  {
    index: 16,
    caption: `Bursa'nın en hızlı büyüyen ticaret ve yaşam aksı Nilüfer'de yeni açılan işletmeler ve sektörel dağılım yatırımcılar için büyük fırsatlar barındırıyor. Nilüfer veritabanını veriburada.com'da filtreleyin.\n\n#bursa #nilüfer #yatırımfırsatları #bursaişletmeleri #veriburada`
  },
  {
    index: 17,
    caption: `Turistik tesislerin yanı sıra yıl boyunca aktif yerel hizmet sektörünün Muratpaşa'daki yoğunluğu. Sezonluk değil, 12 ay süren pazar dinamiklerini veriburada.com ile takip edin.\n\n#antalya #muratpaşa #turizmvetcaret #esnafharitası #veriburada`
  },
  {
    index: 18,
    caption: `Yeni bir proje geliştirirken çevredeki donatı alanlarını, ticaret fonksiyonlarını ve işletme yoğunluğunu varsayımlarla değil, sahadan doğrulanmış verilerle modelleyin. Kentsel analitik araçlarımız veriburada.com'da.\n\n#mimarlık #kentseltasarım #şehirplanlama #donatıanalizi #veriburada`
  },
  {
    index: 19,
    caption: `İkinci veya üçüncü şubenizi açarken doğru lokasyonu seçmek hayati önem taşır. Benzer konseptlerin kümelendiği noktaları ve doymamış bölgeleri veriburada.com harita filtreleriyle dakikalar içinde tespit edin.\n\n#şubeleşme #gastronomistratejisi #restoranlokasyonu #doğruyer #veriburada`
  },
  {
    index: 20,
    caption: `Bir dükkanın ya da plazanın değeri yalnızca metrekaresiyle değil, çevresindeki işletme ekosistemi ve sektörel çekim gücüyle belirlenir. Portföyünüze veri gücü katmak için veriburada.com'u keşfedin.\n\n#ticarigayrimenkul #gayrimenkuldeğerleme #lokasyondeğeri #veriburada #emlakverisi`
  },
  {
    index: 21,
    caption: `Pazarlama bütçenizi ve satış temsilcilerinizin mesaisini en doğru adaylara yönlendirin. Şehir ve sektör bazlı doğrulanmış müşteri adaylarına veriburada.com ile doğrudan ulaşın.\n\n#b2bmüşteri #satışekibi #leadgeneration #hedefkitle #veriburada`
  },
  {
    index: 22,
    caption: `Yeni açılan bir restoran gıda toptancısına, yeni bir klinik tıbbi sarf malzemelerine ihtiyaç duyar. İhtiyaç anında orada olmak için şehrinizdeki yeni kayıtları veriburada.com'dan izleyin.\n\n#tedarikçiağı #toptansatış #sıcakfırsatlar #işgeliştirme #veriburada`
  },
  {
    index: 23,
    caption: `Diş klinikleri, fizik tedavi merkezleri ve eczanelerin bölgesel dağılımı, yeni açılacak sağlık tesisleri için kritik göstergedir. Sağlık sektöründeki rekabet haritasını veriburada.com üzerinden inceleyin.\n\n#sağlıksektörü #klinikaçılışı #eczaneharitası #lokasyonanalizi #veriburada`
  },
  {
    index: 24,
    caption: `Yetkili servisler, oto ekspertizler ve yedek parça satıcılarının sanayi siteleri ve ana arterlerdeki dağılımını haritada görün. Otomotiv veri tabanına veriburada.com ile erişin.\n\n#otomotiv #otoservis #sanayisitesi #sektörelharita #veriburada`
  },
  {
    index: 25,
    caption: `Depolama ve lojistik tesislerinin tedarik noktalarına olan mesafesi ve çevredeki ticari alıcı yoğunluğu maliyetleri doğrudan etkiler. Ulaşım ve lokasyon ilişkisini veriburada.com verisiyle optimize edin.\n\n#lojistik #depolama #dağıtımağı #maliyetoptimizasyonu #veriburada`
  },
  {
    index: 26,
    caption: `Dil kursları, etüt merkezleri ve özel eğitim kurumları için doğru yaş ve demografik hedef kitlenin bulunduğu aksları belirleyin. Eğitim işletmeleri haritasını veriburada.com'da açın.\n\n#eğitimkurumları #kursmerkezi #lokasyonstratejisi #bölgeanalizi #veriburada`
  },
  {
    index: 27,
    caption: `KOBİ yoğunluğunun yüksek olduğu ticaret merkezleri ve sanayi bölgeleri, sigorta ve mali müşavirlik acenteleri için doğal potansiyel müşteri havuzudur. Bölgenizi veriburada.com ile tarayın.\n\n#sigortaacentesi #finansalveri #kobipazarı #müşteribulma #veriburada`
  },
  {
    index: 28,
    caption: `Kuaför, güzellik salonu ve estetik merkezlerinin mahalle bazlı doygunluk seviyelerini analiz edin. Yüksek talep gören fakat rekabetin düşük kaldığı noktaları veriburada.com ile yakalayın.\n\n#güzellikmerkezi #kişiselbakım #pazardoygunluğu #lokasyonzekası #veriburada`
  },
  {
    index: 29,
    caption: `Beyaz yakalı çalışan nüfusunun yoğun olduğu ofis bölgeleri ve gelişen konut projeleri fitness yatırımları için ideal çekim merkezleridir. Lokasyon analitiğini veriburada.com üzerinden gerçekleştirin.\n\n#fitnesssalonu #sporyatırımı #lokasyonseçimi #hedefkitleanalizi #veriburada`
  },
  {
    index: 30,
    caption: `OSB'lerde faaliyet gösteren üretim, metal, tekstil ve kimya firmalarının güncel iletişim ve adres verileri. Sanayi tedarikçileri için doğrudan B2B liste kaynağı: veriburada.com\n\n#osb #sanayifirmaları #üretimsektörü #b2btedarik #veriburada`
  },
  {
    index: 31,
    caption: `Tabela görünürlüğü ve ayak trafiğinin yüksek olduğu caddelerdeki işletme karması perakendeciler için yol göstericidir. Kentsel ticari hareketliliği veriburada.com ile haritada okuyun.\n\n#yayatrafigi #perakendecilik #caddetopluluğu #kentselanaliz #veriburada`
  },
  {
    index: 32,
    caption: `Rakiplerinizin olduğu ama sizin henüz bulunmadığınız potansiyel mahalleleri tek tek haritada belirleyin. Pazar payınızı artıracak beyaz boşlukları veriburada.com ile tespit edin.\n\n#whitespace #perakendezinciri #pazarpayı #bölgeselbüyüme #veriburada`
  },
  {
    index: 33,
    caption: `Bayilerinizin birbirinin cirosunu kırmasını önlemek için doğru franchise sınırları çizin. Şube dağılımını ve etki alanlarını veriburada.com'un harita tabanlı analitiğiyle yönetin.\n\n#franchise #bayiağı #bölgekoruma #şubeyönetimi #veriburada`
  },
  {
    index: 34,
    caption: `Ürünlerinizi pazara sunarken toptancılar ve son noktadaki perakendecilerin bölgesel dengesini gözetin. Ticaret zincirinin her halkasını veriburada.com ile haritalandırın.\n\n#toptanticaret #perakendeağı #tedarikzinciri #ticariharita #veriburada`
  },
  {
    index: 35,
    caption: `Hızlı teslimat için şehir içi mikro dağıtım merkezlerini müşteri kümelenmesinin tam ortasına konumlandırın. Dağıtım sürelerinizi kısaltmak için gereken lokasyon verisi veriburada.com'da.\n\n#eticaret #mikrodağıtım #kuryeteslimat #hızlıticaret #veriburada`
  },
  {
    index: 36,
    caption: `Yaz aylarında açılıp kışın form değiştiren kıyı şeridi işletmelerini anlık sahadan güncellenen verilerle izleyin. Turizm pazarının güncel nabzını veriburada.com üzerinden yakalayın.\n\n#turizm #sezonlukticaret #kıyıişletmeleri #dinamikveri #veriburada`
  },
  {
    index: 37,
    caption: `Yenilenen mahallelerde değişen demografi, yeni nesil kafelere, butik marketlere ve hizmet noktalarına kapı aralar. Dönüşen bölgelerin ticari potansiyelini veriburada.com ile önceden fark edin.\n\n#kentseldönüşüm #mahallereti #perakendedönüşümü #fırsattakibi #veriburada`
  },
  {
    index: 38,
    caption: `İşletmenizin harita kayıtlarının, telefon numarasının ve web adresinin güncel olması yerel müşteriyi çekmenin ilk kuralıdır. Bölgenizdeki işletmelerin dijital varlık durumunu veriburada.com ile inceleyin.\n\n#kobi #dijitalvarlık #yerelseo #haritadoğrulama #veriburada`
  },
  {
    index: 39,
    caption: `Eski anketler ve masa başı tahminler sahaya indiğinizde yanıltır. Gerçek işletmelerden toplanan güncel veriyle karar verin, yatırımlarınızı garantiye alın. Doğrulanmış veriler veriburada.com'da.\n\n#pazararaştırması #sahadaveri #doğrubilgi #analitikkarar #veriburada`
  },
  {
    index: 40,
    caption: `Kentsel verilerin anlamlandırılması, belediyelerden özel sektöre kadar herkes için sürdürülebilir büyümenin anahtarıdır. Şehir verilerini görselleştiren modern platform veriburada.com.\n\n#akıllışehir #veriyönetimi #sürdürülebilirlik #kentselzeka #veriburada`
  },
  {
    index: 41,
    caption: `İşletmenizi büyütürken "bence bu cadde tutar" demek yerine bölgedeki aktif işletme sayısına ve sektörel yoğunluğa bakın. Riskleri minimize etmek için veriburada.com analitiğinden faydalanın.\n\n#veriodaklıbüyüme #riskazaltma #stratejikkarar #işletmeanalitiği #veriburada`
  },
  {
    index: 42,
    caption: `Tüm şehre aynı mesajı vermek yerine ilçe ilçe, cadde cadde farklılaşan işletme profillerine özel teklifler sunun. Bölgesel segmentasyonun en pratik yolu: veriburada.com\n\n#segmentasyon #bölgeselpazarlama #müşteriprofili #hedefleme #veriburada`
  },
  {
    index: 43,
    caption: `Temsilcinizin bir günde ziyaret edebileceği potansiyel müşteri sayısını ikiye katlayın. Birbirine yakın işletmeleri kümeleyerek akıllı rotalar oluşturmak için veriburada.com listelerini kullanın.\n\n#rotaplanlama #sahaverimliliği #satışyönetimi #akıllırota #veriburada`
  },
  {
    index: 44,
    caption: `Yanlış lokasyonda açılan bir şubenin maliyeti aylar süren zarara yol açar. Açılış öncesi çevredeki rakip ve tamamlayıcı işletmeleri harita üzerinde veriburada.com ile denetleyin.\n\n#şubeaçılışı #fizibilite #lokasyonriski #güvenliyatırım #veriburada`
  },
  {
    index: 45,
    caption: `Soğuk aramalarda telesekretere değil, doğrudan işletme sahibine ve yetkilisine ulaşın. Güncel telefon ve web adresleriyle zaman kazanmak için veriburada.com veritabanına bağlanın.\n\n#b2biletişim #doğrudanerişim #zamanverimliliği #yetkilibilgisi #veriburada`
  },
  {
    index: 46,
    caption: `Rakipleriniz hangi mahallelerde güçlü, hangi bölgeleri boş bırakmış? Şehir dokusundaki pazar payı dağılımını renkli haritalarla görmek için veriburada.com'u ziyaret edin.\n\n#rakipanalizi #pazardokusu #pazarpayı #haritaanalizi #veriburada`
  },
  {
    index: 47,
    caption: `Her cadde aynı ciroyu üretmez. Yaya akslarındaki işletme sıralaması ve çekim merkezleri ticari başarının belirleyicisidir. Cadde bazlı işletme dökümünü veriburada.com üzerinden inceleyin.\n\n#caddedekor #yayaaksları #perakendedeğerleme #lokasyontakibi #veriburada`
  },
  {
    index: 48,
    caption: `Hizmetlerinizi tamamlayacak yerel iş ortaklarını aynı bölgede faaliyet gösteren işletmeler arasından seçin. Bölgenizdeki potansiyel partnerleri veriburada.com ile listeleyin.\n\n#işortaklığı #b2bpartner #yerelişbirliği #ekosistem #veriburada`
  },
  {
    index: 49,
    caption: `Meta veya Google reklamlarınızı rastgele şehirlere değil, potansiyel müşterilerinizin kümelendiği özel yarıçaplara yayınlayın. Reklam bütçenizi veriburada.com lokasyon haritasıyla optimize edin.\n\n#lokasyonreklamı #hedefkitle #reklamoptimizasyonu #dijitalpazarlama #veriburada`
  },
  {
    index: 50,
    caption: `Binlerce farklı kaynaktan süzülen, temizlenen ve haritaya işlenen verilerle Türkiye'nin kentsel ticaret atlasını oluşturuyoruz. Ayrıntılı sektör raporları ve veri sorgulama veriburada.com'da.\n\n#ticaretatlası #kentselveri #türkiyeverisi #veristandardı #veriburada`
  },
  {
    index: 51,
    caption: `Yerel esnaftan büyük ölçekli işletmelere kadar dijital dönüşüm ihtiyacı duyan potansiyel müşterileri bölge bölge tarayın. Ajansınız için sıcak müşteri listeleri veriburada.com'da.\n\n#dijitalajans #müşteriportföyü #ajansbüyüme #leads #veriburada`
  },
  {
    index: 52,
    caption: `Kuryelerinizin maksimum sipariş teslim edebileceği en karlı servis yarıçapını belirleyin. Çevredeki konut ve ofis yoğunluğu ilişkisini veriburada.com ile haritada kurgulayın.\n\n#paketservis #restoranlojistiği #kuryehizmeti #teslimatrotası #veriburada`
  },
  {
    index: 53,
    caption: `Hangi sektör büyüyor, hangi bölge doygunluğa ulaştı? Şirketinizin geleceğini belirleyen stratejik kararlarda en büyük destekçiniz sahadan doğrulanmış verilerdir. veriburada.com ile hemen başlayın.\n\n#ticariöngörü #stratejikyönetim #büyümeplanı #verigücü #veriburada`
  },
  {
    index: 54,
    caption: `Yurt dışından gelen hastalara hizmet veren acenteler ve anlaşmalı kliniklerin bölgesel haritası. Sağlık turizminin merkez üslerini veriburada.com ile keşfedin.\n\n#sağlıkturizmi #medikalpazar #klinikharitası #turizmacentesi #veriburada`
  },
  {
    index: 55,
    caption: `Yurt dışına ürün göndermek isteyen ihracatçılar için Türkiye'nin dört bir yanındaki üretici ve imalatçı işletme profilleri. Doğru üreticiye ulaşmak için: veriburada.com\n\n#eihracat #imalatçıverisi #üreticiler #b2bihracat #veriburada`
  },
  {
    index: 56,
    caption: `Yatırımcınıza sunacağınız fizibilite raporunda bölge analizi ve pazar büyüklüğünü kanıtlanmış verilerle destekleyin. Girişiminizin temelini veriburada.com ile sağlam atın.\n\n#girişimcilik #fizibiliteraporu #yatırımcısunumu #pazarbüyüklüğü #veriburada`
  },
  {
    index: 57,
    caption: `Mevsimsel talep dalgalanmalarının sokaklardaki işletme hareketliliğine yansıması. Şehrin dinamik alışveriş alışkanlıklarını veriburada.com üzerinden gözlemleyin.\n\n#sezonluktrend #alışverişaksı #perakendetakibi #tüketicihareketi #veriburada`
  },
  {
    index: 58,
    caption: `Belirli bir ilçe veya semtte sektörünüzün toplam pazar büyüklüğünü ve rakiplerinizin sayısını netleştirin. Pazar payı hedeflerinizi veriburada.com verisiyle belirleyin.\n\n#pazarpayı #bölgeselhedef #rekabetorani #pazaranalizi #veriburada`
  },
  {
    index: 59,
    caption: `Satış temsilcilerinizin zamanını boşa harcayan geçersiz ve kapanmış firma kayıtlarını eleyin. Doğrulanmış ve doğrudan karar vericiye yönlendiren verilerle veriburada.com yanınızda.\n\n#kurumsalsatış #verimlilik #zamanyönetimi #aktifkayıtlar #veriburada`
  },
  {
    index: 60,
    caption: `Tüm Türkiye'deki işletmeler, lokasyon verileri, sektörel kümelenmeler ve akıllı harita analitiği tek bir çatı altında. Siz de kendi bölgenizdeki ticari potansiyeli hemen veriburada.com adresinde keşfedin.\n\n#veriburada #türkiyeişletmeleri #lokasyonzekası #haritatabanlı #işletmekeşfi`
  }
];

const file = 'data/workspace.json';
const db = JSON.parse(await readFile(file, 'utf8'));

for (const item of customData) {
  if (db.posts[item.index]) {
    db.posts[item.index].caption = item.caption;
  }
}

await writeFile(file, JSON.stringify(db, null, 2), 'utf8');
console.log('Updated all 61 post captions with bespoke, topic-specific copy!');
