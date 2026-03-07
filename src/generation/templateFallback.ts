import type { Campaign } from "../domain/product.js";
import { validateTweetLength } from "./duplicateGuard.js";

export interface TemplateFallbackInput {
  brand: string;
  campaign: Campaign;
  assetText: string;
  extraHashtags?: string[];
}

export function buildTemplateFallbackTweet(input: TemplateFallbackInput): string {
  const sentences = [
    `${input.brand} kampanyasinda ${input.campaign.bonus} firsati var.`,
    input.campaign.priceHighlight
      ? `One cikan detay: ${input.campaign.priceHighlight}.`
      : "",
    `${input.assetText}.`,
  ].filter(Boolean);

  const hashtags = uniqueHashtags([
    ...input.campaign.hashtags,
    ...(input.extraHashtags ?? []),
  ]);

  const textWithoutHashtags = fitSentencesWithinLimit(sentences, "");
  const hashtagBlock = fitHashtagsWithinLimit(textWithoutHashtags, hashtags);

  return [textWithoutHashtags, hashtagBlock].filter(Boolean).join("\n");
}

function fitSentencesWithinLimit(sentences: string[], hashtags: string): string {
  let current = "";

  for (const sentence of sentences) {
    const next = current === "" ? sentence : `${current} ${sentence}`;
    const candidate = [next, hashtags].filter(Boolean).join("\n");

    if (!validateTweetLength(candidate)) {
      break;
    }

    current = next;
  }

  return current;
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
