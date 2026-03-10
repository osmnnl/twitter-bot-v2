import { campaigns, products } from "../src/data/catalog.js";
import { assembleLegacyTweet, buildLegacyFallbackBody, buildLegacyTweetParts } from "../src/generation/legacyStyle.js";

type PreviewOptions = {
  count: number;
  productId?: string;
};

function parseArgs(): PreviewOptions {
  const args = process.argv.slice(2);
  const options: PreviewOptions = { count: 2 };

  for (const arg of args) {
    if (arg.startsWith("--count=")) {
      options.count = Number(arg.split("=")[1] ?? "2");
    } else if (arg.startsWith("--product=")) {
      options.productId = arg.split("=")[1];
    }
  }

  if (!Number.isFinite(options.count) || options.count <= 0) {
    options.count = 2;
  }

  return options;
}

function seededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 0xffffffff;
    return value / 0xffffffff;
  };
}

function buildSampleCode(index: number): string {
  const suffix = `${index}`.padStart(2, "0");
  return `DEMO${suffix}X9Z`;
}

function buildSampleLink(code: string): string {
  return `https://example.com/?p=${code}`;
}

const options = parseArgs();
const campaignMap = new Map(campaigns.map((campaign) => [campaign.productId, campaign]));

const targetProducts = options.productId
  ? products.filter((product) => product.id === options.productId)
  : products;

if (targetProducts.length === 0) {
  console.error("No matching products found.");
  process.exit(1);
}

targetProducts.forEach((product, index) => {
  const campaign = campaignMap.get(product.id);
  if (!campaign) {
    return;
  }

  console.log(`\n=== ${product.id.toUpperCase()} ===`);

  for (let i = 0; i < options.count; i += 1) {
    const seed = 1000 + index * 10 + i;
    const random = seededRandom(seed);
    const code = product.id === "hugeicons-pro" ? "" : buildSampleCode(index * 2 + i + 1);
    const link = product.id === "hugeicons-pro"
      ? "https://hugeicons.com?via=osmnnl"
      : buildSampleLink(code === "" ? "OSMNNL" : code);

    const parts = buildLegacyTweetParts({
      product,
      campaign,
      code: code === "" ? undefined : code,
      referralUrl: link,
      random,
    });

    const body = buildLegacyFallbackBody(
      {
        product,
        campaign,
        code: code === "" ? undefined : code,
        referralUrl: link,
        random,
      },
      parts.maxBodyChars,
    );

    const tweet = assembleLegacyTweet(parts.header, body, parts.footer);
    const label = String.fromCharCode("A".charCodeAt(0) + i);
    console.log(`\n--- ${label} ---\n${tweet}`);
  }
});
