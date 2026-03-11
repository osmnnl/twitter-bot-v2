import type { PoolCodeEntry, PoolState } from "../domain/history.js";
import type { ReferralAsset } from "../domain/product.js";

export interface ResolvedAsset {
  assetId: string;
  productId: string;
  assetType: ReferralAsset["assetType"];
  assetText: string;
  code?: string;
  referralUrl?: string;
}

export interface ResolveAssetInput {
  asset: ReferralAsset;
  poolState?: PoolState;
  random?: () => number;
}

export function hasAvailableAsset(asset: ReferralAsset, poolState: PoolState = {}): boolean {
  if (asset.status !== "active") {
    return false;
  }

  if (asset.assetType === "link_only") {
    return isUsableReferralUrl(asset.referralUrl);
  }

  if (asset.assetType === "fixed_code") {
    return Boolean(asset.code || isUsableReferralUrl(asset.referralUrl));
  }

  if (asset.assetType === "rotating_code" || asset.assetType === "templated_link") {
    const availableCode = poolState[asset.productId]?.available?.[0];
    return Boolean(getPoolCodeValue(availableCode));
  }

  return false;
}

export function resolveAsset(input: ResolveAssetInput): ResolvedAsset {
  const { asset, poolState = {}, random = Math.random } = input;

  if (!hasAvailableAsset(asset, poolState)) {
    throw new Error(`No usable asset found for product "${asset.productId}".`);
  }

  if (asset.assetType === "link_only") {
    const referralUrl = normalizeReferralUrl(asset.referralUrl);
    const resolvedAsset: ResolvedAsset = {
      assetId: `${asset.productId}-link`,
      productId: asset.productId,
      assetType: asset.assetType,
      assetText: referralUrl ? `Davet Linki: ${referralUrl}` : "",
    };

    if (referralUrl) {
      resolvedAsset.referralUrl = referralUrl;
    }

    return resolvedAsset;
  }

  if (asset.assetType === "fixed_code") {
    const referralUrl = normalizeReferralUrl(asset.referralUrl);
    const parts = [asset.code ? `Davet Kodu: ${asset.code}` : "", referralUrl ? `Davet Linki: ${referralUrl}` : ""]
      .filter(Boolean)
      .join("\n");

    const resolvedAsset: ResolvedAsset = {
      assetId: `${asset.productId}-fixed`,
      productId: asset.productId,
      assetType: asset.assetType,
      assetText: parts,
    };

    if (asset.code) {
      resolvedAsset.code = asset.code;
    }

    if (referralUrl) {
      resolvedAsset.referralUrl = referralUrl;
    }

    return resolvedAsset;
  }

  const selectedCode = pickRandomAvailableCode(poolState, asset.productId, random);
  if (!selectedCode) {
    throw new Error(`Pool code is missing for product "${asset.productId}".`);
  }

  if (asset.assetType === "templated_link") {
    const referralUrl = asset.urlTemplate
      ?.replace("[CODE]", selectedCode)
      .replace("[KOD]", selectedCode);

    if (!referralUrl) {
      throw new Error(`Template link is missing for product "${asset.productId}".`);
    }

    return {
      assetId: `${asset.productId}-${selectedCode}`,
      productId: asset.productId,
      assetType: asset.assetType,
      assetText: `Davet Kodu: ${selectedCode}\nDavet Linki: ${referralUrl}`,
      code: selectedCode,
      referralUrl,
    };
  }

  return {
    assetId: `${asset.productId}-${selectedCode}`,
    productId: asset.productId,
    assetType: asset.assetType,
    assetText: `Davet Kodu: ${selectedCode}`,
    code: selectedCode,
  };
}

function normalizeReferralUrl(referralUrl?: string): string | undefined {
  if (!referralUrl) {
    return undefined;
  }

  const trimmed = referralUrl.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return undefined;
  }

  if (trimmed.includes("...")) {
    return undefined;
  }

  return trimmed;
}

function isUsableReferralUrl(referralUrl?: string): boolean {
  return Boolean(normalizeReferralUrl(referralUrl));
}

function pickRandomAvailableCode(
  poolState: PoolState,
  productId: string,
  random: () => number,
): string | undefined {
  const availableCodes = poolState[productId]?.available ?? [];
  if (availableCodes.length === 0) {
    return undefined;
  }

  const randomIndex = Math.floor(random() * availableCodes.length);
  return getPoolCodeValue(availableCodes[randomIndex]);
}

function getPoolCodeValue(entry: PoolCodeEntry | string | undefined): string | undefined {
  if (!entry) {
    return undefined;
  }

  if (typeof entry === "string") {
    return entry;
  }

  return entry.code;
}
