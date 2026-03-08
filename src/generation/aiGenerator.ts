import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import type { Campaign } from "../domain/product.js";
import { hashTweetText, validateTweetLength } from "./duplicateGuard.js";

export interface GenerateTweetInput {
  brand: string;
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

  constructor(apiKey = env.geminiApiKey(), modelName = "gemini-2.0-flash") {
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
      const text = result.response.text().trim();

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
  const recentTweetsBlock =
    input.recentTweets && input.recentTweets.length > 0
      ? input.recentTweets.map((tweet, index) => `${index + 1}. ${tweet}`).join("\n")
      : "No recent tweets available.";

  return [
    "You are writing a Turkish promotional tweet for X.",
    "Rules:",
    "- Total length must never exceed 280 characters.",
    "- URLs count as 23 characters.",
    "- Do not end with a cut-off sentence.",
    "- Keep the tweet concise, natural, and non-spammy.",
    "- Make the tone different from recent tweets when possible.",
    "- Use this exact block order:",
    "  1. Brand name",
    "  2. If available: Davet Kodu: ...",
    "  3. If available: Davet Linki: ...",
    "  4. One short promotional paragraph about the campaign",
    "  5. Hashtags on the last line",
    "- Do not include invalid or placeholder links.",
    "",
    `Brand: ${input.brand}`,
    `Bonus: ${input.campaign.bonus}`,
    `Package detail: ${input.campaign.packageDetail}`,
    `Price highlight: ${input.campaign.priceHighlight}`,
    `Text strategy: ${input.campaign.textStrategy}`,
    `Asset text: ${input.assetText}`,
    `Invite code: ${input.code ?? "N/A"}`,
    `Invite link: ${input.referralUrl ?? "N/A"}`,
    `Suggested hashtags: ${input.campaign.hashtags.join(", ")}`,
    "",
    "Recent tweets:",
    recentTweetsBlock,
    "",
    "Return only the final tweet text.",
  ].join("\n");
}
