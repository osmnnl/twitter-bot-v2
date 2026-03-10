import type { Campaign, Product } from "../domain/product.js";
import { TWITTER_CHARACTER_LIMIT, TWITTER_URL_LENGTH } from "./duplicateGuard.js";

export interface LegacyTweetInput {
  product: Product;
  campaign: Campaign;
  assetText?: string;
  code?: string;
  referralUrl?: string;
  random?: () => number;
}

export interface LegacyTweetParts {
  header: string;
  body: string;
  footer: string;
  maxBodyChars: number;
}

const LEGACY_PERSONAS = [
  "Agresif Oyuncu (Ping ve Packet Loss yüzünden delirmiş, çözüm arayan)",
  "Ekonomik Öğrenci (Zam haberlerinden bıkmış, KYK bursunu düşünen)",
  "Profesyonel Yazılımcı (Upload hızı yetmeyen, toplantıda donan)",
  "Teknoloji Meraklısı (Fiber altyapı ve 1000 Mbps tutkunu)",
  "Bıkmış Kullanıcı (Taahhüt bitiminde operatörden kaçmaya çalışan)",
  "Samimi Kanka (Arkadaşına 'gel kurtul' diyen)",
];

const LEGACY_PERSONAS_BY_CATEGORY: Record<Product["category"], string[]> = {
  "Fiber İnternet": [
    "Agresif Oyuncu (Ping ve Packet Loss yüzünden delirmiş, çözüm arayan)",
    "Profesyonel Yazılımcı (Upload hızı yetmeyen, toplantıda donan)",
    "Teknoloji Meraklısı (Fiber altyapı ve 1000 Mbps tutkunu)",
    "Bıkmış Kullanıcı (Taahhüt bitiminde operatörden kaçmaya çalışan)",
  ],
  "Mobil Operatör": [
    "Zamdan Bunalmış Kullanıcı (Tarife değiştirip rahatlamak isteyen)",
    "Numara Taşıyan Pratikçi (Hızlıca geçiş yapmak isteyen)",
    "Dijitalci Genç (GB peşinde koşan, sosyal medya ağırlıklı)",
  ],
  "Ev İnterneti": [
    "Evden Çalışan (Stabil bağlantı arayan)",
    "Aile Kullanıcısı (Aynı anda çok cihaz bağlayan)",
    "Dizi/Film Meraklısı (Kesintisiz yayın isteyen)",
  ],
  "Bankacılık": [
    "Yeni Müşteri Avcısı (Hoşgeldin kampanyası kovalayan)",
    "Masraf Hassasiyeti Olan (Hesap ücreti istemeyen)",
    "Dijital Bankacı (Şubeye uğramak istemeyen)",
  ],
  "Sigorta": [
    "Risk Odaklı (Poliçe detayına bakan, akılcı)",
    "Fiyat Avcısı (Net avantaj arayan)",
    "Temkinli Kullanıcı (Güvenceye önem veren)",
  ],
  "Seyahat": [
    "Puan Avcısı (BolBol/Miles toplayan)",
    "Sık Seyahat Eden (Hızlı avantaj isteyen)",
    "Planlı Gezgin (Bilet/otel fırsatı arayan)",
  ],
  "Yeme & İçme": [
    "Kahve Molacısı (Günlük rutinine ek avantaj isteyen)",
    "Tasarruflu Öğrenci (İndirim peşinde)",
    "Sadakat Kartçısı (Hediye/puan seven)",
  ],
  "Kozmetik": [
    "Trend Takipçisi (Yeni ürün peşinde)",
    "İndirim Avcısı (Sepet fırsatı arayan)",
    "Bakım Rutinine Düşkün (Düzenli alışveriş yapan)",
  ],
  "Dijital Ürün": [
    "Tasarımcı (Üretkenlik odaklı)",
    "İçerik Üreticisi (Hızlı çözüm arayan)",
    "Freelancer (Gelir fırsatına bakan)",
  ],
};

const LEGACY_PERSONAS_BY_PRODUCT: Partial<Record<Product["id"], string[]>> = {
  turknet: [
    "Agresif Oyuncu (Ping ve Packet Loss yüzünden delirmiş, çözüm arayan)",
    "Evden Çalışan (Upload hızı yetmeyen)",
    "Fiyat Hassasiyeti Olan (Zam haberlerinden bıkmış)",
  ],
  pegasus: [
    "Puan Avcısı (BolBol fırsatlarını kovalayan)",
    "Sık Seyahat Eden (Hızlı avantaj isteyen)",
  ],
  starbucks: [
    "Kahve Molacısı (Günlük rutinine ek avantaj isteyen)",
    "Sadakat Kartçısı (Hediye/puan seven)",
  ],
};

const LEGACY_OPENERS = [
  "Selamlar",
  "Hey",
  "Dostum",
  "Millet",
  "Arkadaşlar",
  "Herkes baksın",
  "Kankam",
  "Bro",
  "Gençler",
];

const LEGACY_OPENERS_BY_CATEGORY: Record<Product["category"], string[]> = {
  "Fiber İnternet": [
    "Evden çalışanlar",
    "Öğrenci kardeşlerim",
    "İnterneti yavaş olanlar",
    "Ping sorunu yaşayanlar",
    "Taahhüdü bitenler",
    "Faturasından bıkanlar",
  ],
  "Mobil Operatör": [
    "Taahhüdü bitenler",
    "Faturasından bıkanlar",
    "Gençler",
    "Herkes baksın",
  ],
  "Ev İnterneti": [
    "Evden çalışanlar",
    "İnterneti yavaş olanlar",
    "Taahhüdü bitenler",
    "Faturasından bıkanlar",
  ],
  "Bankacılık": [
    "Yeni müşteri olanlar",
    "Masrafsız hesap arayanlar",
    "Kampanya kovalayanlar",
  ],
  "Sigorta": [
    "Güvence arayanlar",
    "Riskini garantiye almak isteyenler",
    "Kampanya kovalayanlar",
  ],
  "Seyahat": [
    "Seyahat planlayanlar",
    "Puan biriktirenler",
    "Uçuş bakanlar",
  ],
  "Yeme & İçme": [
    "Kahve molası sevenler",
    "Lezzet avcıları",
    "Dışarıda harcayanlar",
  ],
  "Kozmetik": [
    "Alışverişe çıkanlar",
    "Sepet indirimi arayanlar",
    "Bakım rutinine önem verenler",
  ],
  "Dijital Ürün": [
    "Tasarım yapanlar",
    "İçerik üretenler",
    "Freelancer olanlar",
  ],
};

const LEGACY_OPENERS_BY_PRODUCT: Partial<Record<Product["id"], string[]>> = {
  turknet: [
    "İnterneti yavaş olanlar",
    "Ping sorunu yaşayanlar",
    "Evden çalışanlar",
    "Taahhüdü bitenler",
  ],
};

const LEGACY_TEMPLATES_TURKNET = [
  "TurkNet'li arkadaşın seni çağırıyor! Bu davet koduyla gelirsen hem sen hem ben 1 ay bedava internet kazanıyoruz. Kazan-kazan dönemi!",
  "Sınırsız ve taahhütsüz internetin keyfini 1 ay ücretsiz çıkarman için kodum hazır. Faturayı dert etme, hıza odaklan.",
  "Arkadaşını Getir kampanyasıyla 1 ay internet hediye. 700 TL'ye varan indirim fırsatını kaçırma, hemen geçiş yap.",
  "Sevdiklerini TurkNet hızıyla tanıştır, faturandan tasarruf et. Bu kodla abone olursan 1 aylık kullanım ücreti bizden.",
  "Hem hızlı hem hesaplı. Davet kodumu kullanarak TurkNet'e geç, aktivasyon tamamlanınca 1 ay bedava kullanım hakkı kazan.",
  "1 ay bizden olsun, keyfin yerinde olsun. Taahhütsüz, kotasız internet dünyasına bu kodla adım at.",
  "TurkNet'liler kazanıyor. Kodumu kullanarak abone ol, ilk faturanda indirim şokunu yaşa.",
  "Paylaştıkça kazandıran kampanya. Bu kodla TurkNet ailesine katıl, dünya standartlarında hızı 1 ay ücretsiz dene.",
  "İnternet faturası ödemeye 1 ay ara ver. Arkadaşını Getir fırsatıyla bütçeni rahatlat, hızını katla.",
  "Sadece bir kodla internet deneyimini değiştir. Hem taahhütsüz özgürlük hem de 1 ay hediye seni bekliyor.",
  "Yavaş internet kaderin değil. Altyapını sorgula, eğer destekliyorsa TurkNet ile ışık hızına geçiş yap.",
  "GigaFiber ile 1000 Mbps'ye varan eşit indirme ve yükleme hızı. Altyapın uygunsa bu hız şaka değil gerçek.",
  "Sabit fiyat garantisi arayanlara müjde. TurkNet ile sürpriz faturalara son, şeffaf fiyatlandırma burada.",
  "Oyunlarda düşük ping, yüksek performans. TurkNet oyuncu dostu internetiyle rakiplerinin önüne geç.",
  "İnternet hizmetinden memnun kalmazsan paran iade. İlk 30 gün içinde yüzde 100 para iade garantisi.",
];

const LEGACY_TEMPLATES_GENERIC = [
  "{brand} tarafında {primaryOffer} fırsatı var. {packageDetail}",
  "{brand} ile {primaryOffer} avantajı yakala. {supportPoint}",
  "{brand} kampanyasında {primaryOffer} öne çıkıyor. {supportPoint}",
  "{brand} için bu davet kodu/link ile {primaryOffer} fırsatı seni bekliyor.",
  "{brand} başvurusunda {primaryOffer} kazanmak için bu daveti kullanabilirsin.",
  "{brand} tarafında yeni müşteri avantajı var. {primaryOffer} için davetle gir.",
  "{brand} fırsatı için doğru yerdesin. {supportPoint}",
  "Şartları temiz ve net: {primaryOffer}. {supportPoint}",
  "{brand} başvurusunu kolaylaştıran bu davetle {primaryOffer} al.",
];

const LEGACY_TEMPLATES_BY_CATEGORY: Record<Product["category"], string[]> = {
  "Fiber İnternet": [
    "Hız yetmiyorsa çözüm net: {brand}. {primaryOffer} ile başla.",
    "Fiber internet arayanlar için {brand} tarafında {primaryOffer} var.",
    "Upload tarafında zorlananlar için {brand} iyi gelir. {supportPoint}",
    "Taahhütsüz, net fiyat, güçlü altyapı. {primaryOffer} için davetle gir.",
  ],
  "Mobil Operatör": [
    "Hat taşımayı düşünenler için {brand} kampanyasında {primaryOffer} var.",
    "Yeni hat alacaklar için {brand} tarafında {primaryOffer} fırsatı duruyor.",
    "Paket arayanlara net seçenek: {brand}. {supportPoint}",
    "Aylık masrafı düşürmek isteyenlere {brand} kampanyası. {primaryOffer}",
  ],
  "Ev İnterneti": [
    "Ev internetinde taahhüt ve zam yoranlara {brand}. {primaryOffer}",
    "Evde stabil internet isteyenler için {brand} kampanyası. {supportPoint}",
    "Modem resetlemekten bıkanlara {brand} çözüm olabilir. {primaryOffer}",
    "Ev interneti başvurusu için {brand} tarafında {primaryOffer} var.",
  ],
  "Bankacılık": [
    "Yeni müşteri olanlara {brand} tarafında {primaryOffer} var.",
    "{brand} hesap açılışında {primaryOffer} kazanma fırsatı sunuyor.",
    "Banka değiştirirken avantaj arayanlara {brand}. {supportPoint}",
    "Masrafsız hesap ve kampanya arayanlara {brand}. {primaryOffer}",
  ],
  "Sigorta": [
    "Sigorta başvurusunda {brand} tarafında {primaryOffer} avantajı var.",
    "{brand} sigorta kampanyasında {primaryOffer} öne çıkıyor.",
    "Poliçe yaptırırken avantaj arayanlara {brand}. {supportPoint}",
    "Sigorta teklifine bakarken {brand} kampanyasını kaçırma. {primaryOffer}",
  ],
  "Seyahat": [
    "Bilet ve puan tarafında {brand} kampanyası iyi görünüyor. {primaryOffer}",
    "{brand} üyeliğinde {primaryOffer} fırsatı var. {supportPoint}",
    "Seyahat planlayanlara {brand} ile {primaryOffer} avantajı.",
    "Puan biriktirmek isteyenlere {brand}. {primaryOffer}",
  ],
  "Yeme & İçme": [
    "Kahve molası sevenlere {brand} tarafında {primaryOffer} var.",
    "{brand} ile {primaryOffer} fırsatını kap. {supportPoint}",
    "Lezzet tarafında tasarruf isteyenlere {brand}. {primaryOffer}",
    "Uygun fiyatlı kahve arayanlara {brand} kampanyası. {primaryOffer}",
  ],
  "Kozmetik": [
    "Alışverişe başlarken {brand} tarafında {primaryOffer} var.",
    "Kozmetik alışverişinde {brand} ile {primaryOffer} fırsatı.",
    "Sepet indirimi arayanlara {brand}. {supportPoint}",
    "Yeni ürün deneyenlere {brand} kampanyası. {primaryOffer}",
  ],
  "Dijital Ürün": [
    "Dijital üretimde {brand} ile {primaryOffer} fırsatı var.",
    "İkon kütüphanesi arayanlara {brand}. {supportPoint}",
    "{brand} tarafında {primaryOffer} avantajı dikkat çekiyor.",
    "Lisans/abonelik arayanlar için {brand} fırsatı. {primaryOffer}",
  ],
};

const TEMPLATE_BLOCKLIST_BY_CATEGORY: Partial<Record<Product["category"], string[]>> = {
  "Bankacılık": ["internet", "ping", "altyapı", "upload", "fiber", "modem"],
  "Sigorta": ["internet", "ping", "altyapı", "upload", "fiber", "modem"],
  "Seyahat": ["modem", "altyapı", "upload"],
  "Yeme & İçme": ["upload", "ping", "modem", "fiber"],
  "Kozmetik": ["upload", "ping", "modem", "fiber"],
};

const LEGACY_TEMPLATES_BY_PRODUCT: Partial<Record<Product["id"], string[]>> = {
  turknet: [
    "TurkNet tarafında net hız ve net fiyat var. {primaryOffer} için davetle gir.",
    "TurkNet'e geçerken {primaryOffer} avantajı seni bekliyor.",
  ],
  akbank: [
    "Akbank müşterisi olurken {primaryOffer} fırsatı var. {supportPoint}",
    "Akbank başvurunda {primaryOffer} kazanmak için bu daveti kullanabilirsin.",
  ],
  isbank: [
    "İş Bankası'na yeni müşteri olanlara {primaryOffer} var. {supportPoint}",
    "İş Bankası fırsatı için başvuruda {primaryOffer} avantajı yakala.",
  ],
  "enpara-sirketim": [
    "Enpara Şirketim ile {primaryOffer} avantajı yakala. {supportPoint}",
    "Enpara Şirketim hesabında {primaryOffer} fırsatı var.",
  ],
  "enpara-bireysel": [
    "Enpara bireysel başvuruda {primaryOffer} fırsatı sunuyor.",
    "Enpara'ya geçerken {primaryOffer} avantajı almak için daveti kullan.",
  ],
  "garanti-bbva": [
    "Garanti BBVA tarafında {primaryOffer} fırsatı var. {supportPoint}",
    "Garanti BBVA yeni müşteri kampanyasında {primaryOffer} öne çıkıyor.",
  ],
  "vodafone-avantajli": [
    "Vodafone avantajlı tarifelerde {primaryOffer} fırsatı var.",
    "Vodafone'da yeni hat/taşıma için {primaryOffer} avantajını yakala.",
  ],
  "vodafone-red": [
    "Vodafone Red tarafında {primaryOffer} öne çıkıyor. {supportPoint}",
    "Vodafone Red'le {primaryOffer} avantajını kaçırma.",
  ],
  "vodafone-freezone": [
    "Vodafone FreeZone tarafında {primaryOffer} fırsatı var.",
    "FreeZone ile {primaryOffer} avantajını yakala.",
  ],
  "vodafone-ilk-hattim": [
    "Vodafone İlk Hattım için {primaryOffer} avantajı var.",
    "İlk hattını alırken {primaryOffer} için bu daveti kullan.",
  ],
  "vodafone-ev-internet": [
    "Vodafone Ev İnterneti kampanyasında {primaryOffer} öne çıkıyor.",
    "Ev interneti başvurunda {primaryOffer} fırsatını yakala.",
  ],
  "allianz-saglik": [
    "Allianz Sağlık tarafında {primaryOffer} avantajı var. {supportPoint}",
    "Allianz Sağlık poliçesinde {primaryOffer} fırsatını kaçırma.",
  ],
  starbucks: [
    "Starbucks tarafında {primaryOffer} fırsatı var. {supportPoint}",
    "Starbucks kampanyasında {primaryOffer} avantajını kap.",
  ],
  pegasus: [
    "Pegasus ile {primaryOffer} avantajı yakala. {supportPoint}",
    "Pegasus kampanyasında {primaryOffer} fırsatını kaçırma.",
  ],
  korendy: [
    "Korendy alışverişinde {primaryOffer} avantajı var. {supportPoint}",
    "Korendy kampanyasında {primaryOffer} fırsatını değerlendir.",
  ],
  "hugeicons-pro": [
    "Hugeicons Pro ile {primaryOffer} fırsatı var. {supportPoint}",
    "Hugeicons Pro affiliate programında {primaryOffer} avantajını yakala.",
    "Dijital üretimde Hugeicons Pro ile {primaryOffer} kazanabilirsin.",
    "Affiliate programına başvurup {primaryOffer} fırsatını değerlendirebilirsin.",
    "Hugeicons Pro başvurusu kolay, {primaryOffer} net: {supportPoint}",
    "İkon kütüphanesi arayanlara Hugeicons Pro. {primaryOffer} fırsatı burada.",
    "Tasarımcılar için Hugeicons Pro tarafında {primaryOffer} fırsatı var.",
    "Getirdiğin satışlardan {primaryOffer} kazanma fırsatı. Hugeicons Pro affiliate programı.",
  ],
};

const LEGACY_CALL_TO_ACTIONS = [
  "Hemen tıkla ve sorgula.",
  "Fırsatı kaçırma, kodu kap.",
  "Kodu not et, lazım olur.",
  "İndirim seni bekliyor.",
  "Geçiş yapmak için tıkla.",
  "Bedava internetini al.",
  "Daha ne bekliyorsun?",
];

const LEGACY_CALL_TO_ACTIONS_FORMAL = [
  "Detaylara göz at.",
  "Fırsatı kaçırma.",
  "Başvuru için incele.",
  "Avantajı değerlendir.",
  "Kampanyayı gözden geçir.",
];

const LEGACY_CALL_TO_ACTIONS_BY_CATEGORY: Partial<Record<Product["category"], string[]>> = {
  "Bankacılık": LEGACY_CALL_TO_ACTIONS_FORMAL,
  "Sigorta": LEGACY_CALL_TO_ACTIONS_FORMAL,
  "Dijital Ürün": [
    "Detaylara göz at.",
    "Formu doldurup başvur.",
    "Programa göz at.",
    "Fırsatı değerlendir.",
  ],
};

const LEGACY_HASHTAG_POOL = [
  "indirim",
  "promosyon",
  "davetkodu",
  "kod",
  "bedava",
  "hediye",
  "fırsat",
  "kampanya",
  "internet",
  "fiber",
  "taahhütsüz",
];

const LEGACY_OPENERS_EN = [
  "Designers",
  "Creators",
  "Freelancers",
  "Icon lovers",
  "Product teams",
  "UI folks",
];

const LEGACY_CALL_TO_ACTIONS_EN = [
  "Apply to the affiliate program.",
  "Check the details.",
  "See the program.",
  "Join the affiliate program.",
];

const LEGACY_HASHTAG_POOL_EN = [
  "HugeiconsPro",
  "Icons",
  "IconLibrary",
  "Design",
  "UI",
  "Affiliate",
];

const LEGACY_TEMPLATES_EN_HUGEICONS = [
  "Hugeicons Pro is a clean, modern icon library with great coverage and consistency. {supportPoint}",
  "If you care about UI polish, Hugeicons Pro is a solid pick. {supportPoint}",
  "Hugeicons Pro makes product visuals feel crisp and premium. {supportPoint}",
  "Beautiful icons, thoughtful styles, and a pro-level library. {supportPoint}",
  "Affiliate program with a {primaryOffer}. {supportPoint}",
  "Hugeicons Pro is a premium icon library worth bookmarking. {supportPoint}",
];

const SAFETY_MARGIN = 5;
const FALLBACK_ATTEMPTS = 12;

const CONTENT_BLOCKLIST_BY_CATEGORY: Partial<Record<Product["category"], string[]>> = {
  "Bankacılık": ["gb", "tarife", "hat", "fiber", "modem", "altyapı", "upload", "ping", "internet"],
  "Sigorta": ["gb", "tarife", "hat", "fiber", "modem", "altyapı", "upload", "ping", "internet"],
  "Seyahat": ["modem", "altyapı", "upload", "ping"],
  "Yeme & İçme": ["modem", "altyapı", "upload", "ping", "fiber"],
  "Kozmetik": ["modem", "altyapı", "upload", "ping", "fiber"],
  "Dijital Ürün": ["modem", "altyapı", "upload", "ping", "fiber", "tarife", "hat"],
};

const CONTENT_BLOCKLIST_BY_PRODUCT: Partial<Record<Product["id"], string[]>> = {
  pegasus: ["modem", "fiber", "altyapı"],
  starbucks: ["upload", "ping", "fiber"],
};

export function buildLegacyTweetParts(input: LegacyTweetInput): LegacyTweetParts {
  const random = input.random ?? Math.random;
  const brand = pickRandom(uniqueValues([input.product.brand, ...(input.product.searchAliases ?? [])]), random);
  const isEnglish = input.product.id === "hugeicons-pro";
  const headerLines = [
    brand,
    input.code ? (isEnglish ? `Referral Code: ${input.code}` : `Davet Kodu: ${input.code}`) : "",
    input.referralUrl ? (isEnglish ? `Link: ${input.referralUrl}` : `Davet Linki: ${input.referralUrl}`) : "",
  ].filter(Boolean);
  const header = headerLines.join("\n");
  const footer = buildLegacyFooter(input, random);
  const newlineCount = countNewlines(headerLines, footer);
  const maxBodyChars =
    TWITTER_CHARACTER_LIMIT -
    SAFETY_MARGIN -
    normalizedLength(header) -
    normalizedLength(footer) -
    newlineCount;

  return {
    header,
    body: "",
    footer,
    maxBodyChars: Math.max(maxBodyChars, 80),
  };
}

export function buildLegacyFallbackBody(
  input: LegacyTweetInput,
  maxBodyChars: number,
  recentTexts: string[] = [],
): string {
  const random = input.random ?? Math.random;
  const isEnglish = input.product.id === "hugeicons-pro";
  const openerPool =
    (isEnglish ? LEGACY_OPENERS_EN : undefined) ??
    LEGACY_OPENERS_BY_PRODUCT[input.product.id] ??
    LEGACY_OPENERS_BY_CATEGORY[input.product.category] ??
    LEGACY_OPENERS;
  const ctaPool =
    (isEnglish ? LEGACY_CALL_TO_ACTIONS_EN : undefined) ??
    LEGACY_CALL_TO_ACTIONS_BY_CATEGORY[input.product.category] ??
    LEGACY_CALL_TO_ACTIONS;

  const candidates: string[] = [];

  for (let attempt = 0; attempt < FALLBACK_ATTEMPTS; attempt += 1) {
    const opener = pickRandom(openerPool, random);
    const template = pickLegacyTemplate(input, random);
    const cta = pickCtaWithAvoidance(ctaPool, recentTexts, random);
    let candidate = `${opener} ${template} ${cta}`.replace(/\s+/g, " ").trim();

    candidate = scrubBlockedContent(candidate, input.product, input.campaign);

    if (candidate.length > maxBodyChars) {
      candidate = smartTruncate(candidate, maxBodyChars);
    }

    if (candidate === "") {
      continue;
    }

    if (containsRecentOverlap(candidate, recentTexts)) {
      continue;
    }

    candidates.push(candidate);
  }

  if (candidates.length === 0) {
    const fallbackOpener = pickRandom(openerPool, random);
    const fallbackTemplate = pickLegacyTemplate(input, random);
    const fallbackCta = pickRandom(ctaPool, random);
    let fallback = `${fallbackOpener} ${fallbackTemplate} ${fallbackCta}`.replace(/\s+/g, " ").trim();
    fallback = scrubBlockedContent(fallback, input.product, input.campaign);
    return fallback.length > maxBodyChars ? smartTruncate(fallback, maxBodyChars) : fallback;
  }

  return pickBestCandidate(candidates, maxBodyChars);
}

export function buildLegacyAiPrompt(
  input: LegacyTweetInput,
  maxBodyChars: number,
): { prompt: string; persona: string } {
  const random = input.random ?? Math.random;
  const personas =
    LEGACY_PERSONAS_BY_PRODUCT[input.product.id] ??
    LEGACY_PERSONAS_BY_CATEGORY[input.product.category] ??
    LEGACY_PERSONAS;
  const persona = pickRandom(personas, random);
  const primaryOffer = input.campaign.bonus || input.campaign.priceHighlight;
  const packageDetail = cleanSupportPoint(
    input.campaign.packageDetail || input.campaign.textStrategy || "",
    input.product,
  );
  const tone = input.product.id === "hugeicons-pro"
    ? "English, confident, and slightly enthusiastic."
    : toneForCategory(input.product.category);

  const prompt = [
    input.product.id === "hugeicons-pro"
      ? "You are a copywriter writing for X. Write in English."
      : "Sen bir Türkçe içerik yazarı ve sosyal medya metin yazarı gibi davran.",
    `Ton: ${tone}`,
    `Kişilik: ${persona}`,
    `Limit: Maksimum ${maxBodyChars} karakter.`,
    `Marka: ${input.product.brand}`,
    `Kampanya: ${primaryOffer}`,
    `Detay: ${packageDetail}`,
    input.product.id === "hugeicons-pro"
      ? "Task: Write a short, punchy body copy that praises the icon library and mentions the affiliate program."
      : "Görev: Samimi, akıcı, konuşma diline yakın bir gövde metni yaz.",
    "Kurallar:",
    input.product.id === "hugeicons-pro"
      ? "- Do not include the link, code, or hashtags."
      : "- Link, kod, hashtag yazma.",
    input.product.id === "hugeicons-pro"
      ? "- Return only the body text."
      : "- Sadece gövde metni yaz.",
    input.product.id === "hugeicons-pro"
      ? "- Keep it to one paragraph."
      : "- Tek paragraf ve doğal bir akış olsun.",
    input.product.id === "hugeicons-pro"
      ? "- Avoid exaggerated marketing clichés."
      : "- Abartılı pazarlama klişeleri kullanma.",
  ].join("\n");

  return { prompt, persona };
}

export function assembleLegacyTweet(header: string, body: string, footer: string): string {
  const sections = [header, body, footer].filter(Boolean);
  return sections.join("\n\n");
}

function pickLegacyTemplate(input: LegacyTweetInput, random: () => number): string {
  const primaryOffer = input.campaign.bonus || input.campaign.priceHighlight;
  const supportPoint = cleanSupportPoint(
    input.campaign.packageDetail || input.campaign.textStrategy || "",
    input.product,
  );
  if (input.product.id === "hugeicons-pro") {
    const template = pickRandom(LEGACY_TEMPLATES_EN_HUGEICONS, random);
    return template
      .replace("{primaryOffer}", primaryOffer)
      .replace("{supportPoint}", supportPoint);
  }
  const productTemplates = LEGACY_TEMPLATES_BY_PRODUCT[input.product.id] ?? [];
  const categoryTemplates = LEGACY_TEMPLATES_BY_CATEGORY[input.product.category] ?? [];
  const rawPool = [
    ...(input.product.id === "turknet" ? LEGACY_TEMPLATES_TURKNET : []),
    ...productTemplates,
    ...categoryTemplates,
    ...LEGACY_TEMPLATES_GENERIC,
  ];
  const templatePool = filterTemplatesByCategory(rawPool, input.product.category);
  const template = pickRandom(templatePool, random);

  return template
    .replace("{brand}", input.product.brand)
    .replace("{primaryOffer}", primaryOffer)
    .replace("{packageDetail}", supportPoint)
    .replace("{supportPoint}", supportPoint);
}

function buildLegacyFooter(input: LegacyTweetInput, random: () => number): string {
  if (input.product.id === "hugeicons-pro") {
    const tags = pickHashtags(LEGACY_HASHTAG_POOL_EN, 2, random);
    return tags.map((tag) => `#${tag}`).join(" ");
  }
  if (input.product.id === "turknet") {
    const tags = pickHashtags(LEGACY_HASHTAG_POOL, 2, random);
    return `#arkadasinigetir ${tags.map((tag) => `#${tag}`).join(" ")}`.trim();
  }

  const tags = input.campaign.hashtags.length > 0
    ? pickHashtags(input.campaign.hashtags.map((tag) => tag.replace(/^#/, "")), 2, random)
    : pickHashtags(LEGACY_HASHTAG_POOL, 2, random);

  return tags.map((tag) => `#${tag}`).join(" ");
}

function pickHashtags(pool: string[], count: number, random: () => number): string[] {
  const shuffled = [...pool].sort(() => random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function smartTruncate(text: string, limit: number): string {
  if (text.length <= limit) {
    return text;
  }

  const truncated = text.slice(0, limit);
  const lastPunctuation = Math.max(
    truncated.lastIndexOf("."),
    truncated.lastIndexOf("!"),
    truncated.lastIndexOf("?"),
  );

  if (lastPunctuation === -1) {
    const trimmed = truncated.substring(0, truncated.lastIndexOf(" "));
    return trimmed === "" ? truncated.slice(0, Math.max(0, limit - 3)).trim() + "..." : `${trimmed}...`;
  }

  return truncated.substring(0, lastPunctuation + 1);
}

function normalizedLength(text: string): number {
  if (text === "") {
    return 0;
  }

  return text.replace(/https?:\/\/\S+/g, "0".repeat(TWITTER_URL_LENGTH)).length;
}

function countNewlines(headerLines: string[], footer: string): number {
  if (headerLines.length === 0 && footer === "") {
    return 0;
  }

  let count = Math.max(headerLines.length - 1, 0);
  count += 2; // header-body
  if (footer !== "") {
    count += 2; // body-footer
  }
  return count;
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function pickRandom<T>(items: T[], random: () => number): T {
  const fallback = items[0];
  if (fallback === undefined) {
    throw new Error("Cannot pick from an empty array.");
  }

  const index = Math.floor(random() * items.length);
  return items[index] ?? fallback;
}

function filterTemplatesByCategory(templates: string[], category: Product["category"]): string[] {
  const blocklist = TEMPLATE_BLOCKLIST_BY_CATEGORY[category];
  if (!blocklist || blocklist.length === 0) {
    return templates;
  }

  const filtered = templates.filter((template) => {
    const normalized = template.toLocaleLowerCase("tr-TR");
    return !blocklist.some((blocked) => normalized.includes(blocked));
  });

  return filtered.length > 0 ? filtered : templates;
}

function pickCtaWithAvoidance(ctas: string[], recentTexts: string[], random: () => number): string {
  if (recentTexts.length === 0) {
    return pickRandom(ctas, random);
  }

  const normalizedRecent = recentTexts.map((text) => normalizeForMatch(text));
  const filtered = ctas.filter((cta) => {
    const normalized = normalizeForMatch(cta);
    return !normalizedRecent.some((recent) => recent.includes(normalized));
  });

  return pickRandom(filtered.length > 0 ? filtered : ctas, random);
}

function containsRecentOverlap(candidate: string, recentTexts: string[]): boolean {
  if (recentTexts.length === 0) {
    return false;
  }

  const normalizedCandidate = normalizeForMatch(candidate);
  return recentTexts.some((recent) => {
    const normalizedRecent = normalizeForMatch(recent);
    return normalizedRecent.includes(normalizedCandidate) || normalizedCandidate.includes(normalizedRecent);
  });
}

function normalizeForMatch(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pickBestCandidate(candidates: string[], maxBodyChars: number): string {
  let best = candidates[0] ?? "";
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const candidate of candidates) {
    const score = scoreCandidate(candidate, maxBodyChars);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}

function scoreCandidate(text: string, maxBodyChars: number): number {
  if (maxBodyChars <= 0) {
    return -1;
  }

  const lengthRatio = text.length / maxBodyChars;
  const lengthScore = lengthRatio >= 0.6 && lengthRatio <= 0.92 ? 1.0 : 0.2;
  const exclamationPenalty = (text.match(/!/g) ?? []).length * 0.05;
  const repetitionPenalty = hasRepeatedWord(text) ? 0.2 : 0;

  return lengthScore - exclamationPenalty - repetitionPenalty;
}

function hasRepeatedWord(text: string): boolean {
  const tokens = normalizeForMatch(text).split(" ").filter(Boolean);
  const seen = new Set<string>();
  for (const token of tokens) {
    if (seen.has(token)) {
      return true;
    }
    seen.add(token);
  }
  return false;
}

function scrubBlockedContent(text: string, product: Product, campaign: Campaign): string {
  const normalized = normalizeForMatch(text);
  const categoryBlock = CONTENT_BLOCKLIST_BY_CATEGORY[product.category] ?? [];
  const productBlock = CONTENT_BLOCKLIST_BY_PRODUCT[product.id] ?? [];
  const blocklist = [...categoryBlock, ...productBlock];

  if (blocklist.length === 0) {
    return text;
  }

  for (const blocked of blocklist) {
    if (blocked !== "" && normalized.includes(blocked)) {
      return "";
    }
  }

  // Ensure offer and brand exist for relevance.
  if (!normalizeForMatch(text).includes(normalizeForMatch(product.brand))) {
    return "";
  }

  const offer = normalizeForMatch(campaign.bonus || campaign.priceHighlight);
  if (offer && !normalizeForMatch(text).includes(offer)) {
    return "";
  }

  return text;
}

function cleanSupportPoint(value: string, product: Product): string {
  const trimmed = value.trim();
  if (trimmed === "") {
    return "";
  }

  const blocklist = CONTENT_BLOCKLIST_BY_CATEGORY[product.category] ?? [];
  const normalized = normalizeForMatch(trimmed);
  if (blocklist.some((blocked) => normalized.includes(blocked))) {
    return "";
  }

  return trimmed;
}

function toneForCategory(category: Product["category"]): string {
  switch (category) {
    case "Bankacılık":
    case "Sigorta":
      return "Daha resmi, net ve güven veren.";
    case "Seyahat":
      return "Heyecanlı ama abartısız, keyifli.";
    case "Yeme & İçme":
    case "Kozmetik":
      return "Gündelik ve samimi, kısa cümlelerle.";
    default:
      return "Samimi, net ve akıcı.";
  }
}
