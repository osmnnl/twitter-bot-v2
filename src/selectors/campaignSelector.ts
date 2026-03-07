import { campaigns, products, referralAssets } from "../data/catalog.js";
import type { PublishingAccount } from "../domain/account.js";
import type { PoolState, PostHistory } from "../domain/history.js";
import type { Campaign, Product, ReferralAsset } from "../domain/product.js";
import { hasAvailableAsset } from "./assetSelector.js";

export interface CampaignCandidate {
  product: Product;
  campaign: Campaign;
  asset: ReferralAsset;
}

export interface CampaignSelectionInput {
  account: PublishingAccount;
  postHistory: PostHistory[];
  poolState?: PoolState;
  now?: Date;
  random?: () => number;
}

export function selectCampaign(input: CampaignSelectionInput): CampaignCandidate | null {
  const productMap = new Map(products.map((product) => [product.id, product]));
  const assetMap = new Map(referralAssets.map((asset) => [asset.productId, asset]));
  const eligibleCandidates: CampaignCandidate[] = [];
  const now = input.now ?? new Date();

  for (const campaign of campaigns) {
    const product = productMap.get(campaign.productId);
    const asset = assetMap.get(campaign.productId);

    if (!product || !asset) {
      continue;
    }

    if (!isCampaignEligible(product, asset, input.account, input.postHistory, input.poolState ?? {}, now, productMap)) {
      continue;
    }

    eligibleCandidates.push({ product, campaign, asset });
  }

  if (eligibleCandidates.length === 0) {
    return null;
  }

  return pickWeightedCandidate(eligibleCandidates, input.random ?? Math.random);
}

function isCampaignEligible(
  product: Product,
  asset: ReferralAsset,
  account: PublishingAccount,
  postHistory: PostHistory[],
  poolState: PoolState,
  now: Date,
  productMap: Map<string, Product>,
): boolean {
  if (!product.active) {
    return false;
  }

  if (!account.allowedCategories.includes(product.category)) {
    return false;
  }

  if (!hasAvailableAsset(asset, poolState)) {
    return false;
  }

  const accountHistory = postHistory.filter((item) => item.accountId === account.accountId);
  const sortedAccountHistory = [...accountHistory].sort((left, right) => {
    return new Date(right.postedAt).getTime() - new Date(left.postedAt).getTime();
  });
  const latestProductPost = sortedAccountHistory.find((item) => item.productId === product.id);

  if (latestProductPost && isInsideGap(latestProductPost.postedAt, now, account.scheduleProfile.minGapHours)) {
    return false;
  }

  const recentCategoryPosts = sortedAccountHistory
    .slice(0, 6)
    .filter((item) => productMap.get(item.productId)?.category === product.category);

  return recentCategoryPosts.length < 2;
}

function isInsideGap(postedAt: string, now: Date, minGapHours: number): boolean {
  const postedAtTime = new Date(postedAt).getTime();
  const gapMs = minGapHours * 60 * 60 * 1000;

  return now.getTime() - postedAtTime < gapMs;
}

function pickWeightedCandidate(
  candidates: CampaignCandidate[],
  random: () => number,
): CampaignCandidate {
  const fallbackCandidate = candidates[0];
  if (!fallbackCandidate) {
    throw new Error("Cannot pick a campaign from an empty candidate list.");
  }

  const totalWeight = candidates.reduce((sum, candidate) => sum + candidate.product.weight, 0);
  let threshold = random() * totalWeight;

  for (const candidate of candidates) {
    threshold -= candidate.product.weight;

    if (threshold <= 0) {
      return candidate;
    }
  }

  return candidates[candidates.length - 1] ?? fallbackCandidate;
}
