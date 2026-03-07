import type { PoolState } from "../domain/history.js";
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
}

export function hasAvailableAsset(asset: ReferralAsset, poolState: PoolState = {}): boolean {
  if (asset.status !== "active") {
    return false;
  }

  if (asset.assetType === "link_only") {
    return Boolean(asset.referralUrl);
  }

  if (asset.assetType === "fixed_code") {
    return Boolean(asset.code || asset.referralUrl);
  }

  if (asset.assetType === "rotating_code" || asset.assetType === "templated_link") {
    const availableCode = poolState[asset.productId]?.available?.[0];
    return Boolean(availableCode);
  }

  return false;
}

export function resolveAsset(input: ResolveAssetInput): ResolvedAsset {
  const { asset, poolState = {} } = input;

  if (!hasAvailableAsset(asset, poolState)) {
    throw new Error(`No usable asset found for product "${asset.productId}".`);
  }

  if (asset.assetType === "link_only") {
    const resolvedAsset: ResolvedAsset = {
      assetId: `${asset.productId}-link`,
      productId: asset.productId,
      assetType: asset.assetType,
      assetText: `Link: ${asset.referralUrl}`,
    };

    if (asset.referralUrl) {
      resolvedAsset.referralUrl = asset.referralUrl;
    }

    return resolvedAsset;
  }

  if (asset.assetType === "fixed_code") {
    const parts = [asset.code ? `Kod: ${asset.code}` : "", asset.referralUrl ? `Link: ${asset.referralUrl}` : ""]
      .filter(Boolean)
      .join(" | ");

    const resolvedAsset: ResolvedAsset = {
      assetId: `${asset.productId}-fixed`,
      productId: asset.productId,
      assetType: asset.assetType,
      assetText: parts,
    };

    if (asset.code) {
      resolvedAsset.code = asset.code;
    }

    if (asset.referralUrl) {
      resolvedAsset.referralUrl = asset.referralUrl;
    }

    return resolvedAsset;
  }

  const selectedCode = poolState[asset.productId]?.available?.[0];
  if (!selectedCode) {
    throw new Error(`Pool code is missing for product "${asset.productId}".`);
  }

  if (asset.assetType === "templated_link") {
    const referralUrl = asset.urlTemplate?.replace("[CODE]", selectedCode);

    if (!referralUrl) {
      throw new Error(`Template link is missing for product "${asset.productId}".`);
    }

    return {
      assetId: `${asset.productId}-${selectedCode}`,
      productId: asset.productId,
      assetType: asset.assetType,
      assetText: `Kod: ${selectedCode} | Link: ${referralUrl}`,
      code: selectedCode,
      referralUrl,
    };
  }

  return {
    assetId: `${asset.productId}-${selectedCode}`,
    productId: asset.productId,
    assetType: asset.assetType,
    assetText: `Kod: ${selectedCode}`,
    code: selectedCode,
  };
}
