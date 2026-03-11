export interface PostHistory {
  productId: string;
  assetId: string;
  accountId: string;
  tweetId: string;
  textHash: string;
  tweetText?: string;
  postedAt: string;
}

export interface PoolStateItem {
  available: PoolCodeEntry[];
  disabled: PoolCodeEntry[];
  lastReset: string | null;
  resetPolicy: "manual" | "monthly";
}

export type PoolState = Record<string, PoolStateItem>;

export interface PoolCodeEntry {
  code: string;
  expires: string;
  win: boolean;
}
