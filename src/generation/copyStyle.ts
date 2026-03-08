import type { Campaign, Product, ProductCategory } from "../domain/product.js";

const EXACT_SEARCH_TERMS = [
  "davet kodu",
  "referans kodu",
  "referans linki",
  "kampanya",
  "fırsat",
  "hediye",
  "bedava",
  "avantaj",
  "kazan",
] as const;

const SEARCH_BANNED_PHRASES = [
  "bedavaları",
  "kaçırma",
  "stoklarla sınırlı",
  "hemen şimdi",
  "kazanımı sunulur",
  "kampanyasında ek avantajı bulunur",
] as const;

type SearchContext = {
  actionPhrase: string;
  searchTopic: string;
  benefitHint: string;
};

const CATEGORY_SEARCH_CONTEXTS: Record<ProductCategory, SearchContext> = {
  "Fiber İnternet": {
    actionPhrase: "kayıt olurken veya başvuru yaparken",
    searchTopic: "fiber internet kampanyası",
    benefitHint: "bedava internet avantajı",
  },
  "Mobil Operatör": {
    actionPhrase: "yeni hat alırken veya numara taşırken",
    searchTopic: "mobil hat kampanyası",
    benefitHint: "hediye internet avantajı",
  },
  "Ev İnterneti": {
    actionPhrase: "ev internetine başvururken",
    searchTopic: "ev interneti kampanyası",
    benefitHint: "hediye veya indirim avantajı",
  },
  "Bankacılık": {
    actionPhrase: "ilk kez müşteri olurken",
    searchTopic: "banka kampanyası",
    benefitHint: "müşteri ol kampanya avantajı",
  },
  "Sigorta": {
    actionPhrase: "başvuru yaparken",
    searchTopic: "sigorta kampanyası",
    benefitHint: "başvuru avantajı",
  },
  "Seyahat": {
    actionPhrase: "üyelik açarken veya bilet planlarken",
    searchTopic: "seyahat kampanyası",
    benefitHint: "puan veya hediye avantajı",
  },
  "Yeme & İçme": {
    actionPhrase: "üyelik açarken",
    searchTopic: "kahve kampanyası",
    benefitHint: "ikram avantajı",
  },
  "Kozmetik": {
    actionPhrase: "alışverişe başlarken",
    searchTopic: "kozmetik kampanyası",
    benefitHint: "indirim avantajı",
  },
};

export interface SearchCopyGuidance {
  headingBrand: string;
  brandQuery: string;
  referralQuery: string;
  brandDative: string;
  primaryOffer: string;
  supportPoint: string;
  actionPhrase: string;
  searchTopic: string;
  benefitPhrase: string;
  assetLabel: string;
  assetAccusative: string;
  exactTerms: readonly string[];
  extraBrandMentions: string[];
  avoidPhrases: readonly string[];
}

export function buildSearchCopyGuidance(
  input: {
    product: Product;
    campaign: Campaign;
    hasLink?: boolean;
    hasCode?: boolean;
    random?: () => number;
  },
): SearchCopyGuidance {
  const random = input.random ?? Math.random;
  const aliases = uniqueValues([input.product.brand, ...(input.product.searchAliases ?? [])]);
  const headingBrand = pickRandom(aliases, random);
  const referralLabel = input.hasLink ? "referans linki" : "referans kodu";
  const brandQueries = buildBrandQueries(aliases, Boolean(input.hasLink), Boolean(input.hasCode));
  const searchContext = CATEGORY_SEARCH_CONTEXTS[input.product.category];

  return {
    headingBrand,
    brandQuery: brandQueries.primary,
    referralQuery: brandQueries.secondary ?? `${headingBrand} ${referralLabel}`,
    brandDative: toTurkishDative(headingBrand),
    primaryOffer: selectPrimaryOffer(input.campaign),
    supportPoint: selectSupportPoint(input.campaign),
    actionPhrase: searchContext.actionPhrase,
    searchTopic: searchContext.searchTopic,
    benefitPhrase: buildBenefitPhrase(input.campaign, searchContext.benefitHint),
    assetLabel: input.hasCode ? "davet kodu" : input.hasLink ? "referans linki" : "referans kodu",
    assetAccusative: input.hasCode ? "davet kodunu" : input.hasLink ? "referans linkini" : "referans kodunu",
    exactTerms: EXACT_SEARCH_TERMS,
    extraBrandMentions: aliases.filter((alias) => alias !== headingBrand).slice(0, 3),
    avoidPhrases: SEARCH_BANNED_PHRASES,
  };
}

export function buildSearchFocusedFallbackSentences(
  input: {
    product: Product;
    campaign: Campaign;
    hasLink?: boolean;
    hasCode?: boolean;
    guidance?: SearchCopyGuidance;
    random?: () => number;
  },
): string[] {
  const random = input.random ?? Math.random;
  const guidance = input.guidance ?? buildSearchCopyGuidance(input);
  const primarySentence = pickRandom(
    [
      `${guidance.brandDative} ${guidance.actionPhrase} ${guidance.primaryOffer} için bu ${guidance.assetAccusative} kullan.`,
      `${guidance.brandDative} ${guidance.actionPhrase} ${guidance.primaryOffer} kampanya avantajı için bu ${guidance.assetAccusative} kullan.`,
      `${guidance.brandDative} ${guidance.actionPhrase} ${guidance.benefitPhrase} almak için bu ${guidance.assetAccusative} kullan.`,
    ],
    random,
  );
  const secondarySentence = pickRandom(
    [
      `${capitalizeSentence(guidance.searchTopic)} arayanlar için ${guidance.primaryOffer} fırsatı burada.`,
      `${guidance.brandQuery} ve ${guidance.referralQuery} arayanlar için kampanya avantajı bu paylaşımda.`,
      `${guidance.primaryOffer} fırsatı, ${guidance.assetLabel} arayanlar için burada duruyor.`,
    ],
    random,
  );
  const supportSentence = maybeUseSupportSentence(guidance);
  const aliasSentence = buildSearchKeywordTail(input.product, guidance.extraBrandMentions);

  return [primarySentence, secondarySentence, supportSentence, aliasSentence]
    .map((value) => normalizeSentence(value))
    .filter(Boolean);
}

export function cleanGeneratedTweet(text: string): string {
  return text
    .trim()
    .replace(/^```[\w-]*\s*/u, "")
    .replace(/\s*```$/u, "")
    .replace(/^["'“”‘’`]+|["'“”‘’`]+$/gu, "")
    .replace(/^tweet:\s*/iu, "")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

function selectPrimaryOffer(campaign: Campaign): string {
  const bonus = campaign.bonus.trim();
  const priceHighlight = campaign.priceHighlight.trim();

  if (bonus === "") {
    return priceHighlight;
  }

  if (priceHighlight === "") {
    return bonus;
  }

  if (areOfferVariants(bonus, priceHighlight)) {
    return bonus.length >= priceHighlight.length ? bonus : priceHighlight;
  }

  return bonus;
}

function selectSupportPoint(campaign: Campaign): string {
  const candidates = [campaign.packageDetail, campaign.textStrategy]
    .filter((item) => !looksLikeInternalStrategyNote(item))
    .map((item) => softenMarketingSentence(normalizeSentence(item)))
    .filter(Boolean);
  const primaryOffer = normalizeForComparison(selectPrimaryOffer(campaign));

  for (const candidate of candidates) {
    if (!isTooSimilar(primaryOffer, normalizeForComparison(candidate))) {
      return candidate;
    }
  }

  return candidates[0] ?? "";
}

function areOfferVariants(left: string, right: string): boolean {
  if (normalizeForComparison(left) === normalizeForComparison(right)) {
    return true;
  }

  const leftNumbers = extractNumbers(left);
  const rightNumbers = extractNumbers(right);

  return leftNumbers !== "" && leftNumbers === rightNumbers;
}

function isTooSimilar(left: string, right: string): boolean {
  if (left === "" || right === "") {
    return false;
  }

  if (left.includes(right) || right.includes(left)) {
    return true;
  }

  const leftTokens = new Set(left.split(" ").filter(Boolean));
  const rightTokens = new Set(right.split(" ").filter(Boolean));
  let shared = 0;

  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      shared += 1;
    }
  }

  return shared / Math.max(leftTokens.size, rightTokens.size) >= 0.6;
}

function normalizeSentence(value: string): string {
  const trimmed = value.trim().replace(/\.+$/u, "");
  if (trimmed === "") {
    return "";
  }

  const normalized = trimmed[0]?.toLocaleUpperCase("tr-TR") + trimmed.slice(1);
  return normalized.endsWith(".") ? normalized : `${normalized}.`;
}

function softenMarketingSentence(value: string): string {
  const softened = value
    .replace(/^.+? referans kampanyasında yeni müşterilere (.+?)(?: kazanımı)? sunulur\.$/iu, "Yeni müşteri tarafında $1 avantajı var.")
    .replace(/^.+? kampanyasında ek (.+?) avantajı bulunur\.$/iu, "Ek tarafta $1 avantajı da var.")
    .replace(/^.+? kampanyasında (.+?) avantajı bulunur\.$/iu, "$1 avantajı var.")
    .replace(/^.+? davet sistemiyle (.+?) fırsatı\.$/iu, "$1 fırsatı var.")
    .replace(/ kazanımı avantajı var\./iu, " avantajı var.")
    .replace(/kazanımı sunulur\./iu, "avantajı var.")
    .replace(/\bbulunur\./iu, "var.")
    .replace(/\s+/g, " ")
    .trim();

  return normalizeSentence(softened);
}

function buildBrandQueries(aliases: string[], hasLink: boolean, hasCode: boolean): { primary: string; secondary?: string } {
  const primaryLabel = hasCode ? "davet kodu" : hasLink ? "referans linki" : "referans kodu";
  const referralLabel = hasLink ? "referans linki" : "referans kodu";
  const firstAlias = aliases[0] ?? "Marka";
  const secondAlias = aliases[1];

  return {
    primary: `${firstAlias} ${primaryLabel}`,
    secondary: secondAlias ? `${secondAlias} ${referralLabel}` : `${firstAlias} ${referralLabel}`,
  };
}

function buildSearchKeywordTail(product: Product, aliases: string[]): string {
  if (product.id === "turknet" && aliases.length > 0) {
    return `${aliases.join(", ")} arayanlar da aynı davet kodunu kullanabilir.`;
  }

  return "";
}

function capitalizeSentence(value: string): string {
  if (value === "") {
    return "";
  }

  return value[0]?.toLocaleUpperCase("tr-TR") + value.slice(1);
}

function looksLikeInternalStrategyNote(value: string): boolean {
  const normalized = normalizeForComparison(value);
  const markers = [
    "öne çıkar",
    "vurgusuyla",
    "aksiyon mesajı",
    "güçlü fayda",
    "mesajı ver",
  ];

  return markers.some((marker) => normalized.includes(marker));
}

function cleanSentenceSpacing(value: string): string {
  return value.replace(/\s+/g, " ").replace(/\s+([.,!?])/g, "$1").trim();
}

function normalizeForComparison(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractNumbers(value: string): string {
  return (value.match(/\d+/g) ?? []).join("|");
}

function buildBenefitPhrase(campaign: Campaign, fallbackHint: string): string {
  const offer = selectPrimaryOffer(campaign);
  const normalizedOffer = normalizeForComparison(offer);

  if (normalizedOffer.includes("ücretsiz") || normalizedOffer.includes("bedava")) {
    return `${offer} fırsatı`;
  }

  if (normalizedOffer.includes("gb")) {
    return normalizedOffer.includes("hediye") ? `${offer} fırsatı` : `${offer} hediyesi`;
  }

  if (normalizedOffer.includes("puan")) {
    return `${offer} avantajı`;
  }

  if (normalizedOffer.includes("ikram")) {
    return `${offer} fırsatı`;
  }

  if (normalizedOffer.includes("indirim")) {
    return `${offer} indirimi`;
  }

  if (normalizedOffer.includes("iade")) {
    return `${offer} avantajı`;
  }

  return `${offer} ${fallbackHint}`;
}

function maybeUseSupportSentence(guidance: SearchCopyGuidance): string {
  const support = guidance.supportPoint.trim();
  if (support === "") {
    return "";
  }

  if (normalizeForComparison(support).includes(normalizeForComparison(guidance.primaryOffer))) {
    return "";
  }

  return support;
}

function toTurkishDative(brand: string): string {
  const trimmed = brand.trim();
  if (trimmed === "") {
    return brand;
  }

  const lower = trimmed.toLocaleLowerCase("tr-TR");
  const lastVowel = getLastTurkishVowel(lower);
  const suffix = lastVowel && "aıou".includes(lastVowel) ? "a" : "e";

  if (/(sı|si|su|sü)$/u.test(lower)) {
    return `${trimmed}'n${suffix}`;
  }

  if (/[aeıioöuü]$/u.test(lower)) {
    return `${trimmed}'y${suffix}`;
  }

  return `${trimmed}'${suffix}`;
}

function getLastTurkishVowel(value: string): string | undefined {
  const matches = value.match(/[aeıioöuü]/gu);
  return matches ? matches[matches.length - 1] : undefined;
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
