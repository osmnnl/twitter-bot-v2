import { createHash } from "node:crypto";
import type { PostHistory } from "../domain/history.js";

export const TWITTER_CHARACTER_LIMIT = 280;
export const TWITTER_URL_LENGTH = 23;

export interface DuplicateCheckInput {
  text: string;
  recentTexts?: string[];
  recentHashes?: string[];
  recentHistory?: Pick<PostHistory, "textHash">[];
  hashWindow?: number;
  similarityThreshold?: number;
  ngramSize?: number;
}

export interface DuplicateCheckResult {
  normalized: string;
  textHash: string;
  isExactDuplicate: boolean;
  maxSimilarity: number;
  requiresRewrite: boolean;
}

export function normalizeTweetText(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}\s#]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateTweetLength(text: string): boolean {
  const normalized = text.replace(/https?:\/\/\S+/g, "0".repeat(TWITTER_URL_LENGTH));
  return normalized.length <= TWITTER_CHARACTER_LIMIT;
}

export function hashTweetText(text: string): string {
  return createHash("md5").update(normalizeTweetText(text)).digest("hex");
}

export function calculateNgramOverlap(left: string, right: string, ngramSize = 3): number {
  const leftNgrams = createNgrams(normalizeTweetText(left), ngramSize);
  const rightNgrams = createNgrams(normalizeTweetText(right), ngramSize);

  if (leftNgrams.size === 0 || rightNgrams.size === 0) {
    return 0;
  }

  let intersectionCount = 0;

  for (const token of leftNgrams) {
    if (rightNgrams.has(token)) {
      intersectionCount += 1;
    }
  }

  return intersectionCount / Math.max(leftNgrams.size, rightNgrams.size);
}

export function checkDuplicateCandidate(input: DuplicateCheckInput): DuplicateCheckResult {
  const normalized = normalizeTweetText(input.text);
  const textHash = hashTweetText(input.text);
  const hashWindow = input.hashWindow ?? 20;
  const similarityThreshold = input.similarityThreshold ?? 0.4;
  const ngramSize = input.ngramSize ?? 3;

  const recentHashes = [
    ...(input.recentHashes ?? []),
    ...((input.recentHistory ?? []).map((item) => item.textHash)),
  ].slice(0, hashWindow);

  const recentTexts = (input.recentTexts ?? []).slice(0, hashWindow);
  const maxSimilarity = recentTexts.reduce((maxValue, candidate) => {
    return Math.max(maxValue, calculateNgramOverlap(input.text, candidate, ngramSize));
  }, 0);

  const isExactDuplicate = recentHashes.includes(textHash);

  return {
    normalized,
    textHash,
    isExactDuplicate,
    maxSimilarity,
    requiresRewrite: isExactDuplicate || maxSimilarity >= similarityThreshold,
  };
}

function createNgrams(text: string, ngramSize: number): Set<string> {
  const tokens = text.split(" ").filter(Boolean);

  if (tokens.length < ngramSize) {
    return new Set(tokens.length === 0 ? [] : [tokens.join(" ")]);
  }

  const ngrams = new Set<string>();

  for (let index = 0; index <= tokens.length - ngramSize; index += 1) {
    ngrams.add(tokens.slice(index, index + ngramSize).join(" "));
  }

  return ngrams;
}
