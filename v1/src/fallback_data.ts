// src/fallback_datats

// 1 ÖZNE (HEDEF KİTLE SESLENİŞLERİ)
export const OPENERS = [
    // Genel & Samimi
    "Selamlar", "Hey", "Dostum", "Millet", "Arkadaşlar", "Herkes baksın",
    "Kankam", "Bro", "Gençler", "Hız tutkunları", "İnternet mağdurları",
    // Sorun Odaklı
    "İnterneti yavaş olanlar", "Ping sorunu yaşayanlar", "Taahhüdü bitenler",
    "Faturasından bıkanlar", "Upload yetmeyenler", "Yayıncı arkadaşlar",
    "Evden çalışanlar", "Oyun severler", "Öğrenci kardeşlerim", "Film gurmeleri"
];

// 2 İÇERİK (TURKNET SAYFALARINDAN TÜRETİLMİŞ METİNLER)
export const TEMPLATES = [
    // --- KAYNAK: ARKADAŞINI GETİR KAMPANYASI ---
    "TurkNet'li arkadaşın seni çağırıyor! Bu davet koduyla gelirsen hem sen hem ben 1 ay bedava internet kazanıyoruz Kazan-kazan dönemi!",
    "sınırsız ve taahhütsüz internetin keyfini 1 ay ücretsiz çıkarman için kodum hazır Faturayı dert etme, hıza odaklan",
    "Arkadaşını Getir kampanyasıyla 1 ay internet hediye! 700 TL'ye varan indirim fırsatını kaçırma, hemen geçiş yap",
    "sevdiklerini TurkNet hızıyla tanıştır, faturandan tasarruf et Bu kodla abone olursan 1 aylık kullanım ücreti bizden",
    "hem hızlı hem hesaplı Davet kodumu kullanarak TurkNet'e geç, aktivasyon tamamlanınca 1 ay bedava kullanım hakkı kazan",
    "1 ay bizden olsun, keyfin yerinde olsun Taahhütsüz, kotasız, AKN'siz internet dünyasına bu kodla adım at",
    "TurkNet'liler kazanıyor! Kodumu kullanarak abone ol, ilk faturanda indirim şokunu yaşa (iyi anlamda!)",
    "paylaştıkça kazandıran kampanya Bu kodla TurkNet ailesine katıl, dünya standartlarında hızı 1 ay ücretsiz dene",
    "internet faturası ödemeye 1 ay ara ver Arkadaşını Getir fırsatıyla bütçeni rahatlat, hızını katla",
    "sadece bir kodla internet deneyimini değiştir Hem taahhütsüz özgürlük hem de 1 ay hediye seni bekliyor",

    // --- KAYNAK: HIZ & ALTYAPI SORGULAMA ---
    "evindeki internet altyapısının gerçek gücünü biliyor musun? Linke tıkla, saniyeler içinde altyapını sorgula",
    "belki de evinde GigaFiber altyapısı var haberin yok! 1000 Mbps hıza kadar destekleyip desteklemediğini hemen öğren",
    "adresinde alabileceğin maksimum hızı merak ediyorsan doğru yerdesin Tek tıkla sorgula, sürpriz hızlarla tanış",
    "fiber altyapı kapına kadar gelmiş olabilir Sorgulama aracını kullan, evine gelen gerçek hızı keşfet",
    "yavaş internet kaderin değil Altyapını sorgula, eğer destekliyorsa TurkNet ile ışık hızına geçiş yap",
    "VDSL mi Fiber mi? Evinin altyapı teknolojisini ve alabileceğin en yüksek hızı şimdi öğren",
    "altyapın ne kadar güçlüyse internetin o kadar hızlı Hemen sorgula, TurkNet kalitesiyle tanış",
    "adresindeki gizli potansiyeli ortaya çıkar Belki de 100 Mbps ve üzeri hızlar seni bekliyor",
    "internet hızından memnun değilsen önce altyapına bak Linkten sorgulama yap, TurkNet farkını gör",
    "saniyeler içinde altyapı durumunu öğren Eğer GigaFiber bölgesindeysen upload ve download hızın 1000 Mbps olabilir!",

    // --- KAYNAK: İNTERNET KAMPANYALARI & AVANTAJLAR ---
    "başka operatörden geçiş yapmak çok kolay Cayma bedelinin belirli bir kısmını TurkNet karşılıyor, sana hızın keyfini sürmek kalıyor",
    "taahhüt saymak yok, ceza ödemek yok TurkNet'te beğenmezsen istediğin zaman iptal etme özgürlüğü var",
    "kota yok, limit yok, hız sınırı yok Gerçek sınırsız internet deneyimi bu kodla başlıyor",
    "upload hızı sadece yayıncılar için değil herkes için önemli Dosyalarını saniyeler içinde yükle, donmadan görüntülü konuş",
    "GigaFiber ile 1000 Mbps'ye varan eşit indirme ve yükleme hızı! Altyapın uygunsa bu hız şaka değil gerçek",
    "sabit fiyat garantisi arayanlara müjde TurkNet ile sürpriz faturalara son, şeffaf fiyatlandırma burada",
    "çağrı merkeziyle vakit kaybetme Dijital işlemlerle aboneliğini yönet, sorunsuz internetin tadını çıkar",
    "kurulum hizmetiyle uğraşma TurkNet ekipleri yerinde kurulum desteğiyle internetini hemen aktif etsin",
    "oyunlarda düşük ping, yüksek performans TurkNet oyuncu dostu internetiyle rakiplerinin önüne geç",
    "internet hizmetinden memnun kalmazsan paran iade! İlk 30 gün içinde %100 para iade garantisi",
    "eski internet operatörüne veda et, belgelerini kurye kapından alsın Zahmetsizce TurkNet'li ol",
    "AKN (Adil Kullanım Noktası) tarihe karıştı TurkNet'te hızın asla düşmez, keyfin yarım kalmaz",
    "Netflix, YouTube, Twitch Tüm platformlarda takılmadan, donmadan en yüksek kalitede izle",
    "evden çalışanlar için kesintisiz bağlantı şart İş toplantılarında donma derdine son ver",
    "öğrenciler için bütçe dostu, performans canavarı Hem taahhütsüz hem de kurulumu çok kolay",

    // --- SENARYO BAZLI (KARIŞIK) ---
    "pingin tavan yaptığı o anı unut TurkNet ile oyun keyfin bölünmesin, 1 ay hediye fırsatını da kaçırma",
    "zoom toplantısında sesin kesilmesin Yüksek upload hızıyla profesyonelliğini konuştur, kodla kazan",
    "film izlerken donan sahnelerden bıktıysan altyapını sorgula Fiber hız seni bekliyor",
    "zam haberleri canını sıkmasın Arkadaşını Getir kampanyasıyla faturanı düşür, hızını artır",
    "modemi kapatıp açmaktan yorulanlar buraya Stabil bağlantı ve 700 TL değerinde indirim kodu",
    "akıllı evin internetsiz kalmasın Tüm cihazların aynı anda bağlansa bile hızın düşmesin",
    "gece kuşları için sınırsız hız İndirmelerini beklemeden tamamla, zaman sana kalsın",
    "dizi maratonu yaparken 'yükleniyor' yazısı görme Akıcı internet deneyimi için kodun hazır",
    "arkadaşına hava atma sırası sende 'Benim internetim 1000 Mbps' demek istiyorsan sorgulama yap",
    "eski operatörünün taahhüdü bitmek üzereyse durma Cayma bedeli desteğiyle hemen geçiş yap",
    "internet yavaş diye ders çalışamayan öğrenci kardeşim, bu kod senin kurtarıcın olabilir",
    "bulut tabanlı oyun oynayanlar (GeForce Now vb), düşük gecikme süresi için TurkNet şart",
    "vpn bağlantın sürekli kopuyorsa altyapını değiştirme vakti gelmiştir Özgür internete geç",
    "sosyal medyada fotoğraf yüklerken bekleme Işık hızında paylaşım için TurkNet",
    "fatura ödeme derdini 1 ay ertelemek kulağa hoş gelmiyor mu? Kodu kullan, rahatla",

    // --- SEO ODAKLI KISA METİNLER ---
    "İnternet hız testi sonuçlarından memnun değilsen değiştir TurkNet fiber hızıyla tanış",
    "Taahhütsüz internet arayanlar! Özgürlük ve hız bir arada Üstelik ilk ay bedava",
    "En iyi internet sağlayıcısı hangisi diye düşünme Altyapını sorgula, TurkNet farkını gör",
    "Fiber internet başvurusu için en doğru zaman Bu davet koduyla avantajlı başla",
    "Ev interneti fiyatları artarken sen tasarruf et Arkadaşını getir, kazan",
    "VDSL internet hızından fiber performansı almak isteyenler, altyapınızı kontrol edin",
    "Yalın internet, telefonsuz internet arayanlara en temiz çözüm TurkNet'te",
    "Kotayı aştın mı? TurkNet'te kota yok! Sınırsız dünyada yerini al",
    "İnternet nakil işlemiyle uğraşma, yeni evine TurkNet bağlat, 1 ay hediye kazan",
    "Müşteri hizmetleri bekleme süresinden sıkılanlara dijital çözüm"
];

// 3 EYLEM ÇAĞRISI (CTA - HAREKETE GEÇİRİCİ)
export const CALL_TO_ACTIONS = [
    "Hemen tıkla ve sorgula ⚡",
    "Fırsatı kaçırma, kodu kap 🚀",
    "Linke tıkla, hızını gör 👀",
    "Kodu not et, lazım olur 📝",
    "İndirim seni bekliyor 💸",
    "Pişman olmayacaksın 😉",
    "Sınırlı süre, acele et ⏳",
    "Keyfini sür, faturayı unut 😎",
    "Link profilimde değil aşağıda! 👇",
    "Geçiş yapmak için tıkla 🖱️",
    "Bedava internetini al 🎁",
    "Hızını test et, şaşıracaksın 😲",
    "Daha ne bekliyorsun? 🤷",
    "Altyapını öğrenmek için tıkla 🏠",
    "Kodun burada, kullan ve kazan 🎫"
];