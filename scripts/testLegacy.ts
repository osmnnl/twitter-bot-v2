import { campaigns, products, referralAssets } from "../src/data/catalog.js";
import { buildLegacyFallbackBody, buildLegacyTweetParts } from "../src/generation/legacyStyle.js";
import { validateTweetLength } from "../src/generation/duplicateGuard.js";
import type { Product } from "../src/domain/product.js";

type TestResult = {
  name: string;
  ok: boolean;
  details?: string;
};

function assert(condition: boolean, name: string, details?: string): TestResult {
  if (condition) {
    return { name, ok: true };
  }

  return details ? { name, ok: false, details } : { name, ok: false };
}

function getCampaign(productId: string) {
  return campaigns.find((campaign) => campaign.productId === productId);
}

function getAsset(productId: string) {
  return referralAssets.find((asset) => asset.productId === productId);
}

function generateLegacySample(product: Product): string {
  const campaign = getCampaign(product.id);
  if (!campaign) {
    return "";
  }

  const asset = getAsset(product.id);
  const code = asset?.assetType === "fixed_code" ? asset.code : undefined;
  const link = asset?.referralUrl ?? (asset?.urlTemplate ? asset.urlTemplate.replace("[CODE]", "DEMO01X9Z") : undefined);

  const parts = buildLegacyTweetParts({
    product,
    campaign,
    ...(link ? { referralUrl: link } : {}),
    ...(code ? { code } : {}),
  });

  const body = buildLegacyFallbackBody(
    {
      product,
      campaign,
      ...(link ? { referralUrl: link } : {}),
      ...(code ? { code } : {}),
    },
    parts.maxBodyChars,
  );

  return [parts.header, body, parts.footer].filter(Boolean).join("\n\n");
}

const results: TestResult[] = [];

results.push(
  assert(products.length > 0, "products loaded", "No products found."),
  assert(campaigns.length === products.length, "campaign count matches products", "Missing campaign(s)."),
  assert(referralAssets.length === products.length, "asset count matches products", "Missing asset(s)."),
);

for (const product of products) {
  const sample = generateLegacySample(product);
  results.push(
    assert(sample !== "", `legacy sample generated for ${product.id}`, "Empty sample."),
    assert(validateTweetLength(sample), `tweet length ok for ${product.id}`, "Tweet exceeds length."),
  );
}

const failed = results.filter((result) => !result.ok);

if (failed.length === 0) {
  console.log("Legacy tests OK.");
} else {
  console.error("Legacy tests failed:");
  for (const result of failed) {
    console.error(`- ${result.name}${result.details ? ` (${result.details})` : ""}`);
  }
  process.exit(1);
}
