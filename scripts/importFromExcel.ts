import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import ExcelJS from "exceljs";

type ProductRow = {
  id: string;
  brand: string;
  category: string;
  color: string;
  imagePath: string;
  weight: number;
  active: boolean;
};

type CampaignRow = {
  productId: string;
  bonus: string;
  packageDetail: string;
  priceHighlight: string;
  textStrategy: string;
  hashtags: string[];
  imagePath: string;
  altText: string;
  mediaRequired: boolean;
};

type AssetRow = {
  productId: string;
  assetType: string;
  code?: string;
  referralUrl?: string;
  urlTemplate?: string;
  status: string;
  resetPolicy?: string;
  availabilityPolicy?: string;
  validFrom?: string;
  validUntil?: string;
};

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT_DIR, "src", "data");
function getArg(name: string): string | undefined {
  const prefix = `${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match?.slice(prefix.length);
}

function stringifyTs(value: unknown, indent = 0): string {
  const space = " ".repeat(indent);

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }

    const items = value
      .map((item) => `${" ".repeat(indent + 2)}${stringifyTs(item, indent + 2)}`)
      .join(",\n");

    return `[\n${items}\n${space}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value).filter(([, item]) => item !== undefined);

    if (entries.length === 0) {
      return "{}";
    }

    const lines = entries
      .map(
        ([key, item]) =>
          `${" ".repeat(indent + 2)}${key}: ${stringifyTs(item, indent + 2)}`,
      )
      .join(",\n");

    return `{\n${lines}\n${space}}`;
  }

  throw new Error(`Unsupported value type: ${typeof value}`);
}

async function sheetToRows<T extends Record<string, unknown>>(
  workbookPath: string,
  sheetName: string,
): Promise<T[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);

  const worksheet = workbook.worksheets.find(
    (sheet) => sheet.name.toLowerCase() === sheetName.toLowerCase(),
  );

  if (!worksheet) {
    throw new Error(
      `Workbook içinde "${sheetName}" sayfasi bulunamadi. Beklenen sayfalar: products, campaigns, assets.`,
    );
  }

  const headerRow = worksheet.getRow(1);
  const headerValues = Array.isArray(headerRow.values) ? headerRow.values : [];
  const headers = headerValues
    .slice(1)
    .map((value) => (typeof value === "string" ? value.trim() : String(value ?? "").trim()));

  const rows: T[] = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const record: Record<string, unknown> = {};
    headers.forEach((header: string, index: number) => {
      if (!header) {
        return;
      }

      const cell = row.getCell(index + 1);
      const value = cell.value;

      if (typeof value === "object" && value !== null && "text" in value) {
        record[header] = typeof value.text === "string" ? value.text.trim() : String(value.text ?? "").trim();
        return;
      }

      record[header] = value ?? "";
    });

    rows.push(record as T);
  });

  return rows;
}

function requiredString(
  row: Record<string, unknown>,
  field: string,
  sheetName: string,
  index: number,
): string {
  const value = row[field];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${sheetName} satir ${index + 2}: "${field}" zorunlu.`);
  }

  return value.trim();
}

function optionalString(row: Record<string, unknown>, field: string): string | undefined {
  const value = row[field];

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function requiredNumber(
  row: Record<string, unknown>,
  field: string,
  sheetName: string,
  index: number,
): number {
  const value = row[field];
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;

  if (Number.isNaN(numberValue)) {
    throw new Error(`${sheetName} satir ${index + 2}: "${field}" sayi olmali.`);
  }

  return numberValue;
}

function parseBoolean(
  row: Record<string, unknown>,
  field: string,
  sheetName: string,
  index: number,
): boolean {
  const value = row[field];

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "y", "evet"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "n", "hayir", "hayır"].includes(normalized)) {
      return false;
    }
  }

  throw new Error(`${sheetName} satir ${index + 2}: "${field}" boolean olmali.`);
}

function parseHashtags(
  row: Record<string, unknown>,
  field: string,
  sheetName: string,
  index: number,
): string[] {
  const value = requiredString(row, field, sheetName, index);

  return value
    .split(/[,\n|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function safeIdentifier(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]/g, "_");
}

async function writeModuleFile(
  directory: string,
  fileName: string,
  typeName: string,
  exportName: string,
  payload: unknown,
): Promise<void> {
  const filePath = path.join(directory, `${fileName}.ts`);
  const source =
    `import type { ${typeName} } from "../../domain/product.js";\n\n` +
    `export const ${exportName}: ${typeName} = ${stringifyTs(payload)};\n`;

  await writeFile(filePath, source, "utf8");
}

async function writeIndexFile<T extends { fileName: string }>(
  directory: string,
  typeName: string,
  exportName: string,
  collectionName: string,
  items: T[],
): Promise<void> {
  const imports = items
    .map(({ fileName }) => {
      const identifier = safeIdentifier(fileName);
      return `import { ${exportName} as ${identifier} } from "./${fileName}.js";`;
    })
    .join("\n");

  const collection = items
    .map(({ fileName }) => `  ${safeIdentifier(fileName)},`)
    .join("\n");

  const source =
    `import type { ${typeName} } from "../../domain/product.js";\n` +
    `${imports}\n\n` +
    `export const ${collectionName}: ${typeName}[] = [\n` +
    `${collection}\n` +
    `];\n`;

  await writeFile(path.join(directory, "index.ts"), source, "utf8");
}

async function writeCatalogBridge(): Promise<void> {
  const source = [
    'export { products } from "./products/index.js";',
    'export { campaigns } from "./campaigns/index.js";',
    'export { referralAssets } from "./assets/index.js";',
    "",
  ].join("\n");

  await writeFile(path.join(DATA_DIR, "catalog.ts"), source, "utf8");
}

async function parseProducts(workbookPath: string): Promise<ProductRow[]> {
  const rows = await sheetToRows<Record<string, unknown>>(workbookPath, "products");

  return rows.map((row, index) => ({
    id: requiredString(row, "id", "products", index),
    brand: requiredString(row, "brand", "products", index),
    category: requiredString(row, "category", "products", index),
    color: requiredString(row, "color", "products", index),
    imagePath: requiredString(row, "imagePath", "products", index),
    weight: requiredNumber(row, "weight", "products", index),
    active: parseBoolean(row, "active", "products", index),
  }));
}

async function parseCampaigns(workbookPath: string): Promise<CampaignRow[]> {
  const rows = await sheetToRows<Record<string, unknown>>(workbookPath, "campaigns");

  return rows.map((row, index) => ({
    productId: requiredString(row, "productId", "campaigns", index),
    bonus: requiredString(row, "bonus", "campaigns", index),
    packageDetail: requiredString(row, "packageDetail", "campaigns", index),
    priceHighlight: requiredString(row, "priceHighlight", "campaigns", index),
    textStrategy: requiredString(row, "textStrategy", "campaigns", index),
    hashtags: parseHashtags(row, "hashtags", "campaigns", index),
    imagePath: requiredString(row, "imagePath", "campaigns", index),
    altText: requiredString(row, "altText", "campaigns", index),
    mediaRequired: parseBoolean(row, "mediaRequired", "campaigns", index),
  }));
}

async function parseAssets(workbookPath: string): Promise<AssetRow[]> {
  const rows = await sheetToRows<Record<string, unknown>>(workbookPath, "assets");

  return rows.map((row, index) => {
    const asset: AssetRow = {
      productId: requiredString(row, "productId", "assets", index),
      assetType: requiredString(row, "assetType", "assets", index),
      status: requiredString(row, "status", "assets", index),
    };

    const code = optionalString(row, "code");
    const referralUrl = optionalString(row, "referralUrl");
    const urlTemplate = optionalString(row, "urlTemplate");
    const resetPolicy = optionalString(row, "resetPolicy");
    const availabilityPolicy = optionalString(row, "availabilityPolicy");
    const validFrom = optionalString(row, "validFrom");
    const validUntil = optionalString(row, "validUntil");

    if (code !== undefined) {
      asset.code = code;
    }

    if (referralUrl !== undefined) {
      asset.referralUrl = referralUrl;
    }

    if (urlTemplate !== undefined) {
      asset.urlTemplate = urlTemplate;
    }

    if (resetPolicy !== undefined) {
      asset.resetPolicy = resetPolicy;
    }

    if (availabilityPolicy !== undefined) {
      asset.availabilityPolicy = availabilityPolicy;
    }

    if (validFrom !== undefined) {
      asset.validFrom = validFrom;
    }

    if (validUntil !== undefined) {
      asset.validUntil = validUntil;
    }

    return asset;
  });
}

async function main(): Promise<void> {
  const workbookArg = process.argv[2];

  if (!workbookArg || workbookArg === "--help") {
    console.log("Kullanim: npm run import:excel -- ./path/to/catalog.xlsx");
    console.log("Beklenen sayfalar: products, campaigns, assets");
    process.exit(workbookArg ? 0 : 1);
  }

  const workbookPath = path.resolve(process.cwd(), workbookArg);
  const outputDir = path.resolve(process.cwd(), getArg("--outDir") ?? DATA_DIR);

  const products = await parseProducts(workbookPath);
  const campaigns = await parseCampaigns(workbookPath);
  const assets = await parseAssets(workbookPath);

  const productsDir = path.join(outputDir, "products");
  const campaignsDir = path.join(outputDir, "campaigns");
  const assetsDir = path.join(outputDir, "assets");

  await mkdir(productsDir, { recursive: true });
  await mkdir(campaignsDir, { recursive: true });
  await mkdir(assetsDir, { recursive: true });

  await Promise.all(
    products.map((product) =>
      writeModuleFile(productsDir, product.id, "Product", "product", product),
    ),
  );

  await Promise.all(
    campaigns.map((campaign) =>
      writeModuleFile(
        campaignsDir,
        campaign.productId,
        "Campaign",
        "campaign",
        campaign,
      ),
    ),
  );

  await Promise.all(
    assets.map((asset) =>
      writeModuleFile(
        assetsDir,
        asset.productId,
        "ReferralAsset",
        "referralAsset",
        asset,
      ),
    ),
  );

  await writeIndexFile(
    productsDir,
    "Product",
    "product",
    "products",
    products.map((item) => ({ fileName: item.id })),
  );

  await writeIndexFile(
    campaignsDir,
    "Campaign",
    "campaign",
    "campaigns",
    campaigns.map((item) => ({ fileName: item.productId })),
  );

  await writeIndexFile(
    assetsDir,
    "ReferralAsset",
    "referralAsset",
    "referralAssets",
    assets.map((item) => ({ fileName: item.productId })),
  );

  if (outputDir === DATA_DIR) {
    await writeCatalogBridge();
  }

  console.log(
    JSON.stringify(
      {
        workbookPath,
        outputDir,
        products: products.length,
        campaigns: campaigns.length,
        assets: assets.length,
        status: "ok",
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Import basarisiz: ${message}`);
  process.exit(1);
});
