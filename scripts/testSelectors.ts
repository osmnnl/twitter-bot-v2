import { campaigns, products, referralAssets } from "../src/data/catalog.js";
import { accounts } from "../src/data/accounts.js";
import { selectCampaign } from "../src/selectors/campaignSelector.js";
import type { PoolState } from "../src/domain/history.js";

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

const productIds = new Set(products.map((product) => product.id));
const campaignIds = new Set(campaigns.map((campaign) => campaign.productId));
const assetIds = new Set(referralAssets.map((asset) => asset.productId));

const results: TestResult[] = [];

results.push(
  assert(products.length > 0, "products loaded", "No products found."),
  assert(campaigns.length === products.length, "campaign count matches products", "Missing campaign(s)."),
  assert(referralAssets.length === products.length, "asset count matches products", "Missing asset(s)."),
);

for (const product of products) {
  results.push(
    assert(campaignIds.has(product.id), `campaign exists for ${product.id}`),
    assert(assetIds.has(product.id), `asset exists for ${product.id}`),
  );
}

const poolState: PoolState = {};
for (const asset of referralAssets) {
  if (asset.assetType === "rotating_code" || asset.assetType === "templated_link") {
    poolState[asset.productId] = {
      available: [
        {
          code: "TESTCODE",
          expires: "01.01.2099",
          win: false,
        },
      ],
      disabled: [],
      lastReset: null,
      resetPolicy: asset.resetPolicy ?? "manual",
    };
  }
}

for (const account of accounts.filter((account) => account.enabled !== false)) {
  const selected = selectCampaign({
    account,
    postHistory: [],
    poolState,
    now: new Date(),
    random: () => 0.42,
  });

  results.push(
    assert(Boolean(selected), `campaign selectable for ${account.accountId}`, "No eligible campaign."),
  );
}

const failed = results.filter((result) => !result.ok);

if (failed.length === 0) {
  console.log("Selector tests OK.");
} else {
  console.error("Selector tests failed:");
  for (const result of failed) {
    console.error(`- ${result.name}${result.details ? ` (${result.details})` : ""}`);
  }
  process.exit(1);
}
