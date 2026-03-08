import type { Campaign, Product } from "../domain/product.js";
import { validateTweetLength } from "./duplicateGuard.js";
import { buildSearchCopyGuidance, buildSearchFocusedFallbackSentences } from "./copyStyle.js";

export interface TemplateFallbackInput {
  product: Product;
  campaign: Campaign;
  assetText?: string;
  code?: string;
  referralUrl?: string;
  extraHashtags?: string[];
}

export function buildTemplateFallbackTweet(input: TemplateFallbackInput): string {
  const guidance = buildSearchCopyGuidance({
    product: input.product,
    campaign: input.campaign,
    hasCode: Boolean(input.code),
    hasLink: Boolean(input.referralUrl),
  });
  const hashtags = selectHashtags(uniqueHashtags([
    ...input.campaign.hashtags,
    ...(input.extraHashtags ?? []),
  ]));

  const headerLines = [
    guidance.headingBrand,
    input.code ? `Davet Kodu: ${input.code}` : "",
    input.referralUrl ? `Davet Linki: ${input.referralUrl}` : "",
  ].filter(Boolean);

  const detailSentences = buildSearchFocusedFallbackSentences({
    product: input.product,
    campaign: input.campaign,
    hasCode: Boolean(input.code),
    hasLink: Boolean(input.referralUrl),
    guidance,
  }).filter(Boolean);

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
      if (details === "") {
        const shortened = shortenSentenceToFit(stableHeader, sentence, hashtags);
        if (shortened) {
          details = shortened;
        }
      }
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

function selectHashtags(hashtags: string[]): string[] {
  const shuffled = [...hashtags].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(shuffled.length, 2));
}

function shortenSentenceToFit(header: string, sentence: string, hashtags: string): string {
  const words = sentence.split(" ").filter(Boolean);

  for (let length = words.length; length > 3; length -= 1) {
    const shortened = cleanTruncatedSentence(words.slice(0, length).join(" "));
    const candidate = [header, shortened, hashtags]
      .filter(Boolean)
      .join("\n\n");

    if (validateTweetLength(candidate)) {
      return shortened;
    }
  }

  return "";
}

function cleanTruncatedSentence(value: string): string {
  return value
    .trim()
    .replace(/[,:;]+$/u, "")
    .replace(/\b(ve|ile|ama|fakat|çünkü|için|gibi)$/iu, "")
    .trim()
    .concat(".");
}
