import type { ReferralAsset } from "../../domain/product.js";

export const referralAsset: ReferralAsset = {
  productId: "pegasus",
  assetType: "templated_link",
  urlTemplate: "https://flyp.gs/[CODE]",
  status: "active",
  resetPolicy: "manual",
  availabilityPolicy: "while_active"
};
