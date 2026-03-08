import type { ReferralAsset } from "../../domain/product.js";

export const referralAsset: ReferralAsset = {
  productId: "turknet",
  assetType: "templated_link",
  urlTemplate: "https://turk.net/?p=[KOD]",
  status: "active",
  resetPolicy: "manual",
  availabilityPolicy: "while_active"
};
