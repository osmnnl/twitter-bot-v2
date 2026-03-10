export const PRODUCT_CATEGORIES = [
  "Fiber İnternet",
  "Mobil Operatör",
  "Ev İnterneti",
  "Bankacılık",
  "Sigorta",
  "Seyahat",
  "Yeme & İçme",
  "Kozmetik",
  "Dijital Ürün",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type ReferralAssetType =
  | "fixed_code"
  | "rotating_code"
  | "link_only"
  | "templated_link";

export type AssetStatus = "active" | "exhausted" | "expired";
export type ResetPolicy = "manual" | "monthly";
export type AvailabilityPolicy = "always" | "while_active";

export interface Product {
  id: string;
  brand: string;
  category: ProductCategory;
  searchAliases?: string[];
  color: string;
  imagePath: string;
  weight: number;
  active: boolean;
}

export interface Campaign {
  productId: string;
  bonus: string;
  packageDetail: string;
  priceHighlight: string;
  textStrategy: string;
  hashtags: string[];
  imagePath: string;
  altText: string;
  mediaRequired: boolean;
}

export interface ReferralAsset {
  productId: string;
  assetType: ReferralAssetType;
  code?: string;
  referralUrl?: string;
  urlTemplate?: string;
  status: AssetStatus;
  resetPolicy?: ResetPolicy;
  availabilityPolicy?: AvailabilityPolicy;
  validFrom?: string;
  validUntil?: string;
}
