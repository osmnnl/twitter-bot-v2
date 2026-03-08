import { TwitterApi } from "twitter-api-v2";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import { TURKNET_CODES, BASE_SHORT_URL } from "./codes.js";
import { OPENERS, TEMPLATES, CALL_TO_ACTIONS } from "./fallback_data.js";

dotenv.config();

// --- AYARLAR ---
const NEWLINES_COUNT = 4;
const TWITTER_LINK_LENGTH = 23;
const SAFETY_MARGIN = 5;

// --- KİŞİLİK LİSTESİ ---
const PERSONAS = [
  "Agresif Oyuncu (Ping ve Packet Loss yüzünden delirmiş, çözüm arayan)",
  "Ekonomik Öğrenci (Zam haberlerinden bıkmış, KYK bursunu düşünen)",
  "Profesyonel Yazılımcı (Upload hızı yetmeyen, toplantıda donan)",
  "Teknoloji Meraklısı (Fiber altyapı ve 1000 Mbps tutkunu)",
  "Bıkmış Kullanıcı (Taahhüt bitiminde operatörden kaçmaya çalışan)",
  "Samimi Kanka (Arkadaşına 'gel kurtul' diyen)",
];

const BRAND_NAMES = ["TurkNet", "TürkNet", "Turk Net", "Türk Net"];

const HASHTAG_POOL = [
  "indirim",
  "promosyon",
  "davetkodu",
  "kod",
  "bedava",
  "hediye",
  "gigafiber",
  "1000mbps",
  "fiberinternet",
  "hıztesti",
  "ping",
  "upload",
  "vdsl",
  "fiber",
  "internet",
  "altyapı",
  "taahhütsüz",
  "zam",
  "fırsat",
  "öneri",
  "internetimkesildi",
  "internetimyavaş",
  "internetönerisi",
];

// --- YARDIMCI FONKSİYONLAR ---
function cleanAIResponse(text: string): string {
  return text
    .trim()
    .replace(/^"|"$/g, "")
    .replace(/\(\d+\s*karakter\)/gi, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ");
}

function smartTruncate(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const truncated = text.slice(0, limit);
  const lastPunctuation = Math.max(
    truncated.lastIndexOf("."),
    truncated.lastIndexOf("!"),
    truncated.lastIndexOf("?")
  );
  if (lastPunctuation === -1)
    return truncated.substring(0, truncated.lastIndexOf(" ")) + "...";
  return truncated.substring(0, lastPunctuation + 1);
}

// --- FALLBACK (YEDEK) METİN ÜRETİCİ ---
function generateFallbackText(): string {
  const opener = OPENERS[Math.floor(Math.random() * OPENERS.length)];
  const body = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  const cta =
    CALL_TO_ACTIONS[Math.floor(Math.random() * CALL_TO_ACTIONS.length)];

  // Örnek: "Selamlar millet, bu devirde yavaş internet çekilmez... Fırsatı kaçırma! 🚀"
  return `${opener} ${body} ${cta}`;
}

async function main() {
  try {
    // --- 1. VARDİYA SİSTEMİ ---
    const currentHour = new Date().getHours();
    const isAccount1Turn = currentHour % 4 === 0;

    console.log(`🤖 Bot Başlatılıyor... [${new Date().toISOString()}]`);
    console.log(`🔄 Vardiya: ${isAccount1Turn ? "HESAP 1" : "HESAP 2"}`);

    let appKey, appSecret, accessToken, accessSecret;
    if (isAccount1Turn) {
      appKey = process.env.ACCOUNT1_API_KEY;
      appSecret = process.env.ACCOUNT1_API_SECRET;
      accessToken = process.env.ACCOUNT1_ACCESS_TOKEN;
      accessSecret = process.env.ACCOUNT1_ACCESS_SECRET;
    } else {
      appKey = process.env.ACCOUNT2_API_KEY;
      appSecret = process.env.ACCOUNT2_API_SECRET;
      accessToken = process.env.ACCOUNT2_ACCESS_TOKEN;
      accessSecret = process.env.ACCOUNT2_ACCESS_SECRET;
    }

    if (!appKey) throw new Error("🚨 API Anahtarları Eksik!");

    // --- 2. HAZIRLIK (Link, Kod, Tagler) ---
    const randomCode =
      TURKNET_CODES[Math.floor(Math.random() * TURKNET_CODES.length)];
    const targetUrl = `${BASE_SHORT_URL}${randomCode}`;
    const selectedBrand =
      BRAND_NAMES[Math.floor(Math.random() * BRAND_NAMES.length)];
    const selectedPersona =
      PERSONAS[Math.floor(Math.random() * PERSONAS.length)];

    // Header
    const headerPart = `${selectedBrand}\nDavet Kodu: ${randomCode}\nDavet Linki: ${targetUrl}`;

    // Footer (Hashtags)
    const shuffledTags = HASHTAG_POOL.sort(() => 0.5 - Math.random());
    const footerPart = `#arkadaşınıgetir ${shuffledTags
      .slice(0, 2)
      .map((t) => `#${t}`)
      .join(" ")}`;

    // Karakter Hesabı
    const headerLengthForTwitter =
      selectedBrand.length +
      1 +
      "Davet Kodu: ".length +
      randomCode.length +
      1 +
      "Davet Linki: ".length +
      TWITTER_LINK_LENGTH;
    const footerLength = footerPart.length;
    const totalFixedLength =
      headerLengthForTwitter + footerLength + NEWLINES_COUNT;
    const availableCharsForAI = 280 - totalFixedLength - SAFETY_MARGIN;

    // --- 3. METİN ÜRETİMİ (AI veya FALLBACK) ---
    let finalBodyText = "";
    const apiKey = process.env.GEMINI_API_KEY;

    try {
      // A) YAPAY ZEKA DENEMESİ
      if (!apiKey) throw new Error("API Key yok, Fallback'e geçiliyor.");

      // Gecikme SİMÜLASYONU (Sadece AI başarılıysa burada bekletmek mantıklıydı ama
      // Fallback durumunda da bekletmek güvenlik için iyidir, aşağıya taşıdık.)

      // Model Seçimi
      let selectedModel = "gemini-1.5-flash";
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        const data = await response.json();
        if (data.models) {
          const models = data.models.map((m: any) =>
            m.name.replace("models/", "")
          );
          if (models.includes("gemini-flash-latest"))
            selectedModel = "gemini-flash-latest";
        }
      } catch {}

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: selectedModel });

      const prompt = `
                Sen bir SEO ve İçerik Stratejistisin.
                Kişilik: ${selectedPersona}
                Limit: Maksimum ${availableCharsForAI} karakter.
                Görev: TürkNet davet kodu için "700 TL İndirim" vurgulu, samimi bir tweet metni yaz.
                Kurallar: Link/Kod/Tag yazma. Sadece metin.
            `;

      console.log(`🧠 ${selectedModel} düşünüyor...`);
      const result = await model.generateContent(prompt);
      finalBodyText = cleanAIResponse(result.response.text());
      finalBodyText = smartTruncate(finalBodyText, availableCharsForAI);
      console.log("✅ AI Metin Üretti.");
    } catch (aiError) {
      // B) FALLBACK (YEDEK) SİSTEMİ
      console.warn("⚠️ AI HATASI (veya Key yok):", aiError);
      console.log("🔄 Fallback Algoritması Devreye Giriyor...");

      // Algoritma ile metin üret
      let fallbackText = generateFallbackText();

      // Fallback metninin uzunluğunu kontrol et, sığmıyorsa sığan bir tane bulana kadar dene
      let attempts = 0;
      while (fallbackText.length > availableCharsForAI && attempts < 10) {
        fallbackText = generateFallbackText();
        attempts++;
      }
      // Hala sığmıyorsa zorla kes
      if (fallbackText.length > availableCharsForAI) {
        fallbackText = smartTruncate(fallbackText, availableCharsForAI);
      }

      finalBodyText = fallbackText;
      console.log("✅ Fallback Metni Hazırlandı.");
    }

    // --- 4. TWEET MONTAJI ---
    const finalTweet = `${headerPart}\n\n${finalBodyText}\n\n${footerPart}`;
    console.log("📝 TWEET TASLAĞI:\n" + finalTweet);

    // --- 5. GECİKME (Her iki durum için de geçerli) ---
    if (process.env.CI === "true") {
      const randomMinutes = Math.floor(Math.random() * 45);
      console.log(`⏳ Güvenlik: ${randomMinutes} dakika bekleniyor...`);
      await new Promise((r) => setTimeout(r, randomMinutes * 60 * 1000));
    } else {
      console.log("⏩ Local Ortam: Bekleme atlandı.");
    }

    // --- 6. GÖNDERİM ---
    const client = new TwitterApi({
      appKey: appKey!,
      appSecret: appSecret!,
      accessToken: accessToken!,
      accessSecret: accessSecret!,
    });

    const tweet = await client.v2.tweet(finalTweet);
    console.log(`🚀 Tweet Gönderildi! ID: ${tweet.data.id}`);
  } catch (error: any) {
    console.error("❌ HATA:", error.message || error);
    process.exit(1);
  }
}

main();
