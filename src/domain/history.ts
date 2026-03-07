export interface PostHistory {
  productId: string;
  assetId: string;
  accountId: string;
  tweetId: string;
  textHash: string;
  postedAt: string;
}

export interface PoolStateItem {
  available: string[];
  used: string[];
  lastReset: string | null;
  resetPolicy: "manual" | "monthly";
}

export type PoolState = Record<string, PoolStateItem>;
