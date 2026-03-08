import type { Campaign } from "../domain/product.js";
import { validateTweetLength } from "./duplicateGuard.js";

export interface TemplateFallbackInput {
  brand: string;
  campaign: Campaign;
  assetText?: string;
  code?: string;
  referralUrl?: string;
  extraHashtags?: string[];
}

export function buildTemplateFallbackTweet(input: TemplateFallbackInput): string {
  const hashtags = uniqueHashtags([
    ...input.campaign.hashtags,
    ...(input.extraHashtags ?? []),
  ]);

  const headerLines = [
    input.brand,
    input.code ? `Davet Kodu: ${input.code}` : "",
    input.referralUrl ? `Davet Linki: ${input.referralUrl}` : "",
  ].filter(Boolean);

  const detailSentences = [
    buildCampaignDetail(input.campaign),
  ].filter(Boolean);

  const textWithoutHashtags = fitStructuredContentWithinLimit(
    headerLines,
    detailSentences,
    "",
  );
  const hashtagBlock = fitHashtagsWithinLimit(textWithoutHashtags, hashtags);

  return [textWithoutHashtags, hashtagBlock].filter(Boolean).join("\n");
}

function fitStructuredContentWithinLimit(
  headerLines: string[],
  detailSentences: string[],
  hashtags: string,
): string {
  const stableHeader = headerLines.join("\n");
  let details = "";

  for (const sentence of detailSentences) {
    const nextDetails = details === "" ? sentence : `${details} ${sentence}`;
    const candidate = [stableHeader, nextDetails, hashtags]
      .filter(Boolean)
      .join("\n\n");

    if (!validateTweetLength(candidate)) {
      break;
    }

    details = nextDetails;
  }

  return [stableHeader, details].filter(Boolean).join("\n\n");
}

function fitHashtagsWithinLimit(baseText: string, hashtags: string[]): string {
  const accepted: string[] = [];

  for (const hashtag of hashtags) {
    const nextHashtags = [...accepted, hashtag].join(" ");
    const candidate = [baseText, nextHashtags].filter(Boolean).join("\n");

    if (!validateTweetLength(candidate)) {
      break;
    }

    accepted.push(hashtag);
  }

  return accepted.join(" ");
}

function uniqueHashtags(hashtags: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const hashtag of hashtags) {
    const value = hashtag.trim();

    if (value === "") {
      continue;
    }

    if (!seen.has(value)) {
      seen.add(value);
      normalized.push(value);
    }
  }

  return normalized;
}

function buildCampaignDetail(campaign: Campaign): string {
  const parts = [
    campaign.bonus,
    campaign.priceHighlight,
    campaign.packageDetail,
  ]
    .map((item) => item.trim())
    .filter(Boolean);

  const uniqueParts = Array.from(new Set(parts));
  return uniqueParts.join(". ");
}
