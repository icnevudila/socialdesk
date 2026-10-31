import json

with open('artifacts/media_ocr_extracted.json', 'r', encoding='utf-8') as f:
    ocr_data = json.load(f)

with open('data/workspace.json', 'r', encoding='utf-8') as f:
    ws = json.load(f)

# Define exact, bespoke titles and captions directly matching each image's text and visual theme
media_configs = {
    "01_sehir_ve_kesif.jpg": {
        "title": "Bir Şehir, Binlerce Olasılık",
        "caption": "Bir şehirde binlerce işletme ve keşfedilmeyi bekleyen sayısız ticari fırsat var. İl ve sektör seçerek işletmeleri harita üzerinde araştırabilir, bölgenizdeki pazar yapısını veriburada.com ile saniyeler içinde keşfedebilirsiniz.\n\n#işletmekeşfi #şehiranaliği #lokasyon #veriburada #b2bpazar"
    },
    "02_duzenli_listeler.jpg": {
        "title": "Dağınık Bilgilerden Düzenli Listelere",
        "caption": "İnternetteki parça parça ve güncelliğini yitirmiş rehberlerle vakit kaybetmeyin. İşletme adı, iletişim bilgileri ve konum verilerini tek bir düzenli CSV dosyasında toplayın. Örnek listeleri incelemek için: veriburada.com\n\n#düzenliveri #işletmelistesi #csv #verimodelleme #veriburada"
    },
    "03_yeni_acilan_isletmeler.jpg": {
        "title": "Şehrinizde Yeni Kim Var? Aylık Liste",
        "caption": "Şehrinizde kapılarını yeni açan işletmelerden ilk siz haberdar olun. Tedarikçi, toptancı ve ajanslar için her ay güncellenen yeni açılan işletmeler listesini veriburada.com üzerinden temin edebilirsiniz.\n\n#yeniaçılanişletmeler #sıcakfırsatlar #tedarikçi #b2bsatış #veriburada"
    },
    "04_satis_arastirmasi.jpg": {
        "title": "Bir Sonraki İş Bağlantınız Burada",
        "caption": "Saha satış ve iş geliştirme araştırmalarınıza doğrulanmış işletme listeleriyle başlayın. Hedef müşterilerinizi tek bir tabloda toplayarak satış verimliliğinizi katlamak için veriburada.com'u ziyaret edin.\n\n#satışaraştırması #b2blisteler #sahasatışı #işgeliştirme #veriburada"
    },
    "05_uc_adimda_liste.jpg": {
        "title": "Listenize Giden 3 Kolay Adım",
        "caption": "1. İlinizi seçin. 2. Sektörünüzü belirleyin. 3. İşletme listenizi CSV formatında indirin. Satış ve pazarlama ekiplerinin aradığı hız veriburada.com adresinde.\n\n#üçadımdaveri #kolayfiltre #pazararaştırması #hızlıerişim #veriburada"
    },
    "06_telefon_web_adres.jpg": {
        "title": "Telefon, Web ve Adres Tek Listede",
        "caption": "Hatalı numaralar ve kapanmış adreslerle zaman kaybetmeyin. Doğrulanmış telefon, aktif web sitesi ve açık adres verilerini düzenli sütunlarda incelemek için veriburada.com'daki örnek CSV dökümüne göz atın.\n\n#doğrulanmışveri #telefonadresi #müşteriverisi #b2bveri #veriburada"
    },
    "07_sektorleri_kesfet.jpg": {
        "title": "Sektörünüz Değişir, Araştırma Kolaylığı Kalır",
        "caption": "İster mimarlık ofisleri, ister kafeler veya yerel perakendeciler... Hangi sektörde müşteri arıyorsanız ilçe ve kategori bazında tek tıkla filtreleyin. Sektörünüzü keşfetmek için: veriburada.com\n\n#sektörelarama #mimarlıkofisi #kafelistesi #yerelişletmeler #veriburada"
    },
    "08_ajanslar_icin.jpg": {
        "title": "Ajansınızın Yeni Bağlantı Haritası",
        "caption": "Dijital pazarlama, tasarım ve yazılım ajansları için bölge ve sektöre göre sıcak potansiyel müşteri listesi. Müşteri portföyünüzü yerel işletmelerle büyütmek için veriburada.com altyapısını kullanın.\n\n#ajanslar #leadgeneration #pazarharitası #b2bbüyüme #veriburada"
    },
    "09_arastir_listele_baglanti_kur.jpg": {
        "title": "Araştırın, Listeleyin, Bağlantı Kurun",
        "caption": "Pazar araştırmanızı, işletme listelemenizi ve ilk temasınızı tek bir akışta bir araya getirin. İş geliştirme süreçlerinizi veriye dayandırmak için veriburada.com'u keşfedin.\n\n#araştırmaliste #işbağlantısı #b2bpazarlama #doğrulanmışliste #veriburada"
    },
    "10_firsatlar_orada_veri_burada.jpg": {
        "title": "Fırsatlar Orada, Veri Burada",
        "caption": "Pazardaki fırsatları kaçırmayın. Doğru işletmeleri harita üzerinde keşfedin, karar vericilere doğrudan ulaşın. İhtiyacınız olan güncel veriye veriburada.com ile hemen ulaşabilirsiniz.\n\n#fırsatlarorada #veriburada #yerelharita #işgeliştirme #lokasyonanalitiği"
    },
    "veriburada_tanitim_reel.mp4": {
        "title": "Veriburada Platform Tanıtımı",
        "caption": "Aradığınız işletmeleri il, ilçe ve sektöre göre harita üzerinde saniyeler içinde filtreleyin. Şehrin ticari nabzını tutan yeni nesil lokasyon zekâsı platformuyla tanışmak için videoyu izleyin, detaylar için veriburada.com'u ziyaret edin.\n\n#veriburadaplatformu #tanıtım #lokasyonverisi #şehiranaliği #keşfet"
    },
    "post_01.jpg": {
        "title": "Şehrin İş Haritasını Keşfet",
        "caption": "İl ve sektör seçerek şehrinizdeki işletmeleri sokak sokak araştırın. İş dünyasının nabzını tutan harita tabanlı veri modelini incelemek için: veriburada.com\n\n#işharitası #şehiresnafı #lokasyonanalizi #veriburada #işletmeler"
    },
    "post_02.jpg": {
        "title": "Doğru Bölgeden Başlayın",
        "caption": "Aradığınız işletmeleri doğrudan konuma göre bulun. Satış rotanızı en yoğun ticaret akslarından başlatmak için örnek listeler veriburada.com'da sizi bekliyor.\n\n#doğrubölge #konumtabanlı #sahaaraştırması #lokasyon #veriburada"
    },
    "post_03.jpg": {
        "title": "Yeni Açıldı: Yeni Bir Fırsat",
        "caption": "Şehrinizde bu ay kapılarını açan taze işletmelerin listesini her ay düzenli olarak alın. Rakiplerinizden önce yeni işletmelerle temas kurmak için veriburada.com'u inceleyin.\n\n#yeniaçıldı #aylıkişletmeler #tazefırsatlar #b2bsatış #veriburada"
    },
    "post_04.jpg": {
        "title": "Her İşletme Bir Bağlantı İhtimali",
        "caption": "Yüzlerce işletmenin güncel iletişim bilgilerini tek bir CSV dosyasında toplayın. Satış potansiyelinizi genişletmek için örnek veri listelerine veriburada.com'dan ulaşın.\n\n#işbağlantısı #işletmelistesi #csvdökümü #veriburada #leadbulma"
    },
    "post_05.jpg": {
        "title": "Listeniz İşinize Hazır",
        "caption": "CRM sisteminize ve Excel tablolarınıza doğrudan aktarabileceğiniz temiz CSV formatında işletme verileri. Hazır listeleri incelemek için: veriburada.com\n\n#crmuyumlu #csvformatı #temizveri #işletmebilgileri #veriburada"
    },
    "post_06.jpg": {
        "title": "Kafelerden Başlayalım mı?",
        "caption": "Bölgenizdeki kafeleri, restoranları ve yeme-içme noktalarını tek tıkla listeleyin. Gıda tedarikçileri ve kahve kavurucuları için nokta atışı müşteri kaynağı veriburada.com'da.\n\n#kafeler #yemeiçme #gıdatedarik #restoranlistesi #veriburada"
    },
    "post_07.jpg": {
        "title": "Araştırmaya Bir Yön Verin",
        "caption": "İl ve sektör filtreleriyle işletme araştırmanızı daraltın, yalnızca hedef kitlenize odaklanın. Zamanınızı verimli kullanmak için veriburada.com'u tercih edin.\n\n#hedefkitle #sektörfiltresi #zamanverimliliği #araştırma #veriburada"
    },
    "post_08.jpg": {
        "title": "Mimarlık Ofisleri ve Tasarım Stüdyoları",
        "caption": "Konum ve sektör bazında mimarlık ofisleri, mühendislik firmaları ve yapı profesyonellerinin listesi. Yapı ve malzeme tedarikçileri için doğrudan erişim: veriburada.com\n\n#mimarlıkofisi #yapısektörü #mühendislik #b2btedarik #veriburada"
    },
    "post_09.jpg": {
        "title": "İletişim Bilgileri Bir Arada",
        "caption": "Telefon numarası, web sitesi ve açık adres bilgileri tek bir sütunda, doğrulanmış olarak elinizin altında. Güvenilir işletme rehberi veriburada.com'da.\n\n#iletişimrehberi #telefonnumarası #webadresi #firmaverisi #veriburada"
    },
    "post_10.jpg": {
        "title": "Yeni Açılanlar Aylık Liste",
        "caption": "Bölgenizde son açılan işletmeleri sahadan önce öğrenin. Aylık taze işletme akışıyla satış hattınızı sürekli dolu tutmak için veriburada.com'a katılın.\n\n#yeniaçılanlar #aylıktakip #işgeliştirme #sıcakmüşteri #veriburada"
    },
    "post_11.jpg": {
        "title": "Ajansınız İçin Yeni Bağlantılar",
        "caption": "Ajans müşterilerinize yerel pazarlama, web tasarımı veya sosyal medya hizmeti sunarken bölge ve sektör bazlı işletme listelerinden faydalanın: veriburada.com\n\n#dijitalajans #müşteribulma #yerelreklam #b2blisteler #veriburada"
    },
    "post_12.jpg": {
        "title": "Aradığınız Sektör Burada",
        "caption": "Sağlıktan perakendeye, üretimden hizmete... İşletme listenizi tam olarak iş modelinizin ihtiyacına göre özelleştirin. İncelemek için veriburada.com adresine gelin.\n\n#sektörelfiltreleme #özelliste #işletmeveritabanı #veriburada #b2bpazar"
    },
    "post_13.jpg": {
        "title": "Veriyi Listeye Dönüştürün",
        "caption": "Dağınık harita noktalarını düzenli sütunlara dökün. Saha satış temsilcileriniz için hazır çalışma listeleri oluşturmanın en hızlı yolu veriburada.com.\n\n#veridönüşümü #düzenlitablo #sahasatışekibi #veriburada #işletmeler"
    },
    "post_14.jpg": {
        "title": "Bir İl Seçin, Keşif Başlasın",
        "caption": "Hangi şehirde büyümek istiyorsunuz? İlinizi ve aradığınız sektörü seçin, tüm işletme dökümü önünüze gelsin. Türkiye geneli veriler veriburada.com'da.\n\n#şehirkeşfi #türkiyegeneli #bölgeselaraştırma #veriburada #pazarbüyütme"
    },
    "post_15.jpg": {
        "title": "İş Geliştirme Listeniz Hazır",
        "caption": "Masa başında saatlerce firma aramak yerine hazır, doğrulanmış işletme listeleriyle satışa doğrudan başlayın. Fırsatları keşfetmek için: veriburada.com\n\n#işgeliştirme #hazırliste #satışhattı #leadüretimi #veriburada"
    },
    "post_16.jpg": {
        "title": "Mahallenizde Kimler Var?",
        "caption": "Kendi ilçenizde ve mahallenizde faaliyet gösteren yerel işletmeleri keşfedin. Bölgesel tedarik ve esnaf ağınızı veriburada.com ile genişletin.\n\n#mahallenidönüştür #yerelesnaf #bölgeseltedarik #mahalleverisi #veriburada"
    },
    "post_17.jpg": {
        "title": "Yeni Bir Vitrin, Yeni Bir Bağlantı",
        "caption": "Yeni açılan işletmeler için tabela, POS, ambalaj ve lojistik ihtiyaçları ilk günden başlar. İlk teklifi veren olmak için veriburada.com aylık listesini takip edin.\n\n#yenişletmeler #ilkfırsat #b2bteklif #tedarikağı #veriburada"
    },
    "post_18.jpg": {
        "title": "Bilgiler Düzenli ve Eksiksiz Olsun",
        "caption": "İşletme adı, yetkili iletişim telefonu, web sayfası ve açık adres verileri tek bir tabloda. Operasyonel zaman kaybını önlemek için: veriburada.com\n\n#düzenlibilgi #hatasızveri #işletmeadresi #telefonbilgisi #veriburada"
    },
    "post_19.jpg": {
        "title": "Araştırmanız Her An Yanınızda",
        "caption": "Sahada, ofiste veya yolda... İndirilebilir CSV formatıyla işletme verilerinizi yanınızda taşıyın. Detaylı analiz için veriburada.com sizi bekliyor.\n\n#mobilveri #csvaktarımı #sahadayız #işletmeanalizi #veriburada"
    },
    "post_20.jpg": {
        "title": "Bölgeyi Siz Seçin, Liste Başlasın",
        "caption": "Bölgenizi ve sektörünüzü (örneğin restoranlar) seçin, listeniz anında hazırlansın. Hedef odaklı pazar araştırması için veriburada.com'u keşfedin.\n\n#bölgeselseçim #restoranlistesi #hedefodaklı #pazaryeri #veriburada"
    },
    "post_21.jpg": {
        "title": "Yeni Bağlantılara Yer Açın",
        "caption": "Portföyünüzü yeni ticari partnerlerle güçlendirin. İşletmeleri keşfetmek ve güncel listenizi indirmek için hemen veriburada.com adresini ziyaret edin.\n\n#ticariortaklık #b2bbağlantı #yeniportföy #veriburada #işletmeler"
    },
    "post_22.jpg": {
        "title": "Tek Tek Aramak Yerine Listeyle Başlayın",
        "caption": "İnternet arama motorlarında tek tek firma aramak saatlerinizi alır. Yüzlerce işletmeyi tek listede topluca incelemek için veriburada.com yanınızda.\n\n#topluarama #zamantasarrufu #b2bliste #kolayaraştırma #veriburada"
    },
    "post_23.jpg": {
        "title": "Sektörünüze Odaklanın",
        "caption": "Alakasız firmalarla vakit kaybetmeyin. Yalnızca hedeflediğiniz sektöre odaklanarak doğrudan karar vericilere ulaşmak için veriburada.com'u deneyin.\n\n#odaklıarama #sektörelfiltre #kararverici #b2bpazarlama #veriburada"
    },
    "post_24.jpg": {
        "title": "Bir Dosyada Daha Düzenli: CSV",
        "caption": "Tüm işletme listenizi pratik bir CSV dosyasında indirin, dilediğiniz gibi sıralayın ve ekibinizle paylaşın. Örnek listeleri veriburada.com'da inceleyin.\n\n#csvindirme #tabloyönetimi #ekipçalışması #düzenliveri #veriburada"
    },
    "post_25.jpg": {
        "title": "Satış Araştırmasının İlk Adımı",
        "caption": "Doğru bir satış stratejisi sahadaki aktörleri tanımakla başlar. Bölgenizdeki işletmelerin sektörel dağılımını veriburada.com ile haritada görün.\n\n#satışstratejisi #pazartanıma #lokasyonverisi #sahaaraştırması #veriburada"
    },
    "post_26.jpg": {
        "title": "Her Ay Yeni İşletmeler Masanızda",
        "caption": "Şehir geliştikçe yeni işletmeler açılmaya devam ediyor. Her ay güncellenen yeni açılan işletmeler listesini kaçırmamak için: veriburada.com\n\n#aylıkgüncelleme #yenidükkanlar #büyümetakibi #pazaranalizi #veriburada"
    },
    "post_27.jpg": {
        "title": "Haritada Bulun, Listede İnceleyin",
        "caption": "Konumdan işletme detaylarına uzanan kapsamlı araştırma. Haritada yerini görün, listede iletişim bilgilerini kontrol edin: veriburada.com\n\n#haritadanlisteye #kapsamlıarama #lokasyondetayı #veriburada #işletme"
    },
    "post_28.jpg": {
        "title": "İşletme Keşfine Farklı Bir Bakış",
        "caption": "İl ve sektör filtreleriyle işletmeleri klasik arama kalıplarının ötesinde analiz edin. Bölgenizdeki ticari hareketliliği veriburada.com ile izleyin.\n\n#farklıbakış #akıllıarama #lokasyonanalitiği #veriburada #ticaribilgi"
    },
    "post_29.jpg": {
        "title": "Önce Hazır Örneğine Bakın",
        "caption": "Veri yapımızın kalitesini ve sütun düzenini merak ediyorsanız hazır CSV örneklerimizi ücretsiz olarak veriburada.com adresinden inceleyebilirsiniz.\n\n#ücretsizörnek #verikalitesi #csvörneği #incelevegör #veriburada"
    },
    "post_30.jpg": {
        "title": "Bağlantılar Orada, Başlangıç Burada",
        "caption": "Yeni müşterileriniz sahada sizi bekliyor. Onlara en hızlı şekilde ulaşmak için ilk adımı veriburada.com üzerinden atın ve listenizi oluşturun.\n\n#başlangıçburada #müşteribağlantısı #işbüyütme #satışhattı #veriburada"
    },
    "veriburada_yeni_01.jpg": {
        "title": "Yeni Açılan Kapıları Keşfedin",
        "caption": "Bölgenizdeki yeni işletmelerin aylık listesini düzenli olarak alarak satış ekibinize sürekli sıcak müşteri adayı sağlayın. Ayrıntılar veriburada.com'da.\n\n#yeniaçılankapılar #sıcaklead #aylıkişletmelistesi #veriburada #satışekibi"
    },
    "veriburada_yeni_02.jpg": {
        "title": "İşletme Aramanıza Yön Çizin",
        "caption": "Rastgele arayışlara son. İl ve sektör seçerek dakikalar içinde hedef müşteri listenizi oluşturun. Akıllı arama araçları için: veriburada.com\n\n#akıllıfiltreleme #hedefliste #zamanoptimizasyonu #veriburada #b2bpazar"
    },
    "veriburada_yeni_03.jpg": {
        "title": "Bir Sokakta Birçok İhtimal",
        "caption": "Kitapçı, kafe, manav, fırın, eczane, butik ve kuaför... Tek bir sokakta yer alan tüm yerel işletmeleri sektörel olarak filtrelemek veriburada.com ile çok kolay.\n\n#birsokaktaticaret #yerelişletmeler #eczanevefırın #kafevebutik #veriburada"
    },
    "veriburada_yeni_04.jpg": {
        "title": "Bağlantı Haritanızı Genişletin",
        "caption": "İşletmeleri harita üzerinde keşfedin, listenizi hazırlayın ve yeni ticari anlaşmalara zemin hazırlayın. Bölgesel büyüme için: veriburada.com\n\n#bağlantıharitası #bölgeselbüyüme #işağı #veriburada #müşteritakibi"
    },
    "veriburada_yeni_05.jpg": {
        "title": "Listenizin Odağı Tamamen Sizde",
        "caption": "İhtiyacınız olan işletmeleri konum ve sektör parametreleriyle filtreleyin, yalnızca sizin işinize yarayacak temiz veriyle çalışın: veriburada.com\n\n#odaklıveri #temizliste #b2bhedefleme #veriburada #işletmeler"
    },
    "veriburada_yeni_06.jpg": {
        "title": "Düzenli Bilgiyle Güçlü Başlangıç",
        "caption": "Telefon, web sitesi ve açık adres verileri tek bir CSV dosyasında. İşletme bilgilerini düzenli listeler halinde indirmek için veriburada.com'u ziyaret edin.\n\n#düzenlibilgi #güçlübaşlangıç #telefonveweb #csvlistesi #veriburada"
    },
    "veriburada_yeni_07.jpg": {
        "title": "Yeni İşletmeler, Yeni Tanışmalar",
        "caption": "Her ay yeni açılan işletmelerin listesini alarak bölgenizdeki ilk iş ortaklıklarını siz kurun. Yeni açılan firma veritabanı veriburada.com'da.\n\n#yeniişletmeler #işortaklığı #aylıkliste #veriburada #b2bbüyüme"
    },
    "veriburada_yeni_08.jpg": {
        "title": "Bölgenizdeki Restoranlar Nerede?",
        "caption": "Semt ve sektör seçin, bölgenizdeki kafe ve restoranların tam listesine tek tıkla ulaşın. Gıda ve servis tedarikçileri için ideal kaynak: veriburada.com\n\n#restoranlarnerede #kafeler #gıdatedariği #semtanalizi #veriburada"
    },
    "veriburada_yeni_09.jpg": {
        "title": "Bilgiden İş Bağlantısına",
        "caption": "İşletme araştırmanızı tek bir profesyonel veri tabanında toplayın. Bilgiyi iş bağlantısına dönüştürmenin en pratik yolu veriburada.com rehberliğinde.\n\n#bilgidenbağlantıya #profesyonelveri #b2bstrateji #veriburada #işletmeler"
    },
    "veriburada_yeni_10.jpg": {
        "title": "İl Seçin, Sektör Seçin, Başlayın",
        "caption": "İşletme listenizi araştırmanıza göre anında oluşturun. Kullanıcı dostu arayüz ve zengin veri altyapısıyla tanışmak için: veriburada.com\n\n#hızlıbaşlangıç #sektörseçimi #işletmelisteleri #veriburada #pazaranalizi"
    },
    "veriburada_yeni_11.jpg": {
        "title": "Araştırmanızın Yeni Sayfası",
        "caption": "Hazır CSV örneklerini inceleyin ve işletme verilerinin satış operasyonlarınızı nasıl hızlandırdığını görün. Örnek dökümler veriburada.com'da.\n\n#yenisayfa #hazırcsv #satışoperasyonu #hızlıveri #veriburada"
    },
    "veriburada_yeni_12.jpg": {
        "title": "Aynı Şehir, Farklı Sektörler",
        "caption": "Atölye, butik, kafe, kuaför veya tamirhane... İhtiyacınıza uygun işletmeleri konuma ve sektöre göre listeleyin. Her ay güncel veriler veriburada.com'da.\n\n#aynışehirfarklısektör #atölyevebutik #tamirhane #güncelliste #veriburada"
    },
    "veriburada_yeni_13.jpg": {
        "title": "İşletme Bilgileri Elinizin Altında",
        "caption": "Listenizi doğrudan CSV olarak indirin ve ekibinizle anında incelemeye başlayın. Sahadan doğrulanmış veriler veriburada.com adresinde.\n\n#elinizinaltında #csvdosyası #sahadanveri #veriburada #işletmelistesi"
    },
    "veriburada_yeni_14.jpg": {
        "title": "Keşfetmenin En Düzenli Hâli",
        "caption": "İşletme adı, iletişim bilgileri ve konum verisi tek bir düzenli tabloda. Karmaşık araştırmaları sadeleştirmek için: veriburada.com\n\n#düzenlikeşif #sadelik #firmaverisi #haritatabanlı #veriburada"
    },
    "veriburada_yeni_15.jpg": {
        "title": "Önce Bölgeyi Belirleyin",
        "caption": "İşletmeleri konuma göre araştırarak bölgesel pazar analizlerinizi eksiksiz tamamlayın. Bölgenizi keşfetmek için veriburada.com haritasını açın.\n\n#öncebölge #konumaraştırması #bölgeselanaliz #veriburada #lokasyon"
    },
    "veriburada_yeni_16.jpg": {
        "title": "Yeni Bir Adresi İlk Siz Keşfedin",
        "caption": "Şehrinizde yeni açılan işletmelerin aylık listesini inceleyerek ticari fırsatları anında yakalayın. Taze işletme kayıtları veriburada.com'da.\n\n#yeniadres #ilksizkeşfedin #fırsatyakala #b2btedarik #veriburada"
    },
    "veriburada_yeni_17.jpg": {
        "title": "Ajansınızın Araştırma Masası",
        "caption": "Kafe ve restoranlardan güzellik salonlarına kadar hedef sektörleri bölge bazında listeleyin. Ajansınız için potansiyel müşteri havuzu: veriburada.com\n\n#ajansmasası #hedefsektör #güzelliksalonları #müşterihavuzu #veriburada"
    },
    "veriburada_yeni_18.jpg": {
        "title": "İşletmeleri Bir Arada Görün",
        "caption": "Araştırmanızı düzenli bir listeyle sürdürün. Şehrinizdeki işletmeleri bir arada görmek ve satışa başlamak için veriburada.com'u ziyaret edin.\n\n#biraradagörün #düzenliaraştırma #satışabaşla #veriburada #işletmeler"
    },
    "veriburada_yeni_19.jpg": {
        "title": "Şehrin Ticaretini Keşfedin",
        "caption": "Konum ve sektör seçerek kapsamlı pazar araştırmasına hemen başlayın. Şehrin ticari potansiyeli veriburada.com ile parmaklarınızın ucunda.\n\n#şehrinticareti #ticaretpotansiyeli #kentselanaliz #veriburada #lokasyonveri"
    },
    "veriburada_yeni_20.jpg": {
        "title": "Bir Sonraki Listeniz Burada Başlasın",
        "caption": "Konuma göre işletmeleri bulun, sektöre göre filtreleyin, paylaşıma hazır CSV listeleri oluşturun ve her ay güncel işletme listeleri alın: veriburada.com\n\n#birsonrakiliste #hazırcsv #güncelliste #veriburada #türkiyeişletmeleri"
    }
}

count = 0
for post in ws['posts']:
    media_file = post['mediaUrl'].split('/')[-1]
    if media_file in media_configs:
        cfg = media_configs[media_file]
        post['title'] = cfg['title']
        post['caption'] = cfg['caption']
        count += 1

with open('data/workspace.json', 'w', encoding='utf-8') as f:
    json.dump(ws, f, ensure_ascii=False, indent=2)

print(f"Successfully matched and updated {count} posts to their exact image contents!")
