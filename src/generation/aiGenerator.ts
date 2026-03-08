import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import type { Campaign, Product } from "../domain/product.js";
import { hashTweetText, validateTweetLength } from "./duplicateGuard.js";
import { buildSearchCopyGuidance, cleanGeneratedTweet } from "./copyStyle.js";

export interface GenerateTweetInput {
  product: Product;
  campaign: Campaign;
  assetText: string;
  code?: string;
  referralUrl?: string;
  recentTweets?: string[];
  maxAttempts?: number;
  modelName?: string;
}

export interface GeneratedTweet {
  text: string;
  textHash: string;
  attempts: number;
  modelName: string;
}

export class AiGenerator {
  private readonly client: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor(apiKey = env.geminiApiKey(), modelName = env.geminiModel()) {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    this.client = new GoogleGenerativeAI(apiKey);
    this.modelName = modelName;
  }

  async generateTweet(input: GenerateTweetInput): Promise<GeneratedTweet> {
    const modelName = input.modelName ?? this.modelName;
    const model = this.client.getGenerativeModel({ model: modelName });
    const maxAttempts = input.maxAttempts ?? 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const result = await model.generateContent(buildTweetPrompt(input));
      const text = cleanGeneratedTweet(result.response.text());

      if (text !== "" && validateTweetLength(text)) {
        return {
          text,
          textHash: hashTweetText(text),
          attempts: attempt,
          modelName,
        };
      }
    }

    throw new Error("AI generator could not produce a valid tweet.");
  }
}

export function buildTweetPrompt(input: GenerateTweetInput): string {
  const guidance = buildSearchCopyGuidance({
    product: input.product,
    campaign: input.campaign,
    hasCode: Boolean(input.code),
    hasLink: Boolean(input.referralUrl),
  });
  const recentTweetsBlock =
    input.recentTweets && input.recentTweets.length > 0
      ? input.recentTweets.map((tweet, index) => `${index + 1}. ${tweet}`).join("\n")
      : "No recent tweets available.";

  return [
    "You are writing a Turkish tweet for X with a search-first SEO goal.",
    "Primary goal: surface in X search for people looking for referral codes, referral links, campaigns, free offers, and product-specific opportunity keywords.",
    "Rules:",
    "- Total length must never exceed 280 characters.",
    "- URLs count as 23 characters.",
    "- Do not end with a cut-off sentence.",
    "- Keep the tweet readable, concise, and multi-line.",
    "- The tweet must target search intent more than conversation tone.",
    "- Never output a bare keyword list. Every keyword must appear inside a meaningful sentence that explains the benefit.",
    "- Prefer direct action sentences like 'X'e ilk kez müşteri olurken ... için bu davet kodunu kullan.'",
    "- Use this preferred structure:",
    "  1. Brand name on its own line",
    "  2. If available: Davet Kodu: ...",
    "  3. If available: Davet Linki: ...",
    "  4. One short paragraph with 2 search-friendly sentences",
    "  5. Optional hashtags on the last line if they still fit",
    "- Do not include invalid or placeholder links.",
    "- Use exact search phrases in their base form when relevant: davet kodu, referans kodu, referans linki, kampanya, fırsat, hediye, bedava, avantaj.",
    "- Prefer exact words like 'bedava', not inflected variants like 'bedavaları'.",
    "- Include at least 4 of the target search phrases naturally in the paragraph.",
    "- If the brand has alias spellings, use the requested heading spelling and, if it fits naturally, mention another alias in the paragraph too.",
    "- Do not waste characters on soft CTA, chitchat, or personality fluff.",
    "- Avoid these phrases: stock marketing clichés, awkward plurals, exaggerated hype.",
    "- The reader must immediately understand what they gain by using the code or link.",
    "",
    `Heading brand spelling: ${guidance.headingBrand}`,
    `Brand base name: ${input.product.brand}`,
    `Bonus: ${input.campaign.bonus}`,
    `Package detail: ${input.campaign.packageDetail}`,
    `Price highlight: ${input.campaign.priceHighlight}`,
    `Text strategy: ${input.campaign.textStrategy}`,
    `Primary offer to emphasize: ${guidance.primaryOffer}`,
    `Support point: ${guidance.supportPoint || "Use only if it sounds clean and helpful."}`,
    `Brand dative form: ${guidance.brandDative}`,
    `Action phrase: ${guidance.actionPhrase}`,
    `Search topic: ${guidance.searchTopic}`,
    `Benefit phrase: ${guidance.benefitPhrase}`,
    `Preferred asset label: ${guidance.assetLabel}`,
    `Preferred asset accusative: ${guidance.assetAccusative}`,
    `Primary brand query: ${guidance.brandQuery}`,
    `Secondary referral query: ${guidance.referralQuery}`,
    `Extra brand spellings: ${guidance.extraBrandMentions.join(", ") || "None"}`,
    `Exact keyword targets: ${guidance.exactTerms.join(", ")}`,
    `Avoid phrases: ${guidance.avoidPhrases.join(", ")}`,
    `Asset text: ${input.assetText}`,
    `Invite code: ${input.code ?? "N/A"}`,
    `Invite link: ${input.referralUrl ?? "N/A"}`,
    `Suggested hashtags: ${input.campaign.hashtags.join(", ")}`,
    "",
    "Recent tweets:",
    recentTweetsBlock,
    "",
    "Bad example: 'Pegasus davet kodu, ucak bileti, seyahat, kampanya, hediye'",
    "Bad example: 'Enpara Sirketim referans linki bakanlara net ozet'",
    "Good example style: 'Is Bankasi'na ilk kez musteri olurken 500 TL MaxiPuan icin bu davet kodunu kullan.'",
    "Good example style: 'Enpara'ya ilk kez musteri olurken 1.000 TL Odul icin bu referans linkini kullan.'",
    "",
    "Return only the final tweet text in Turkish.",
  ].join("\n");
}
