import type { PoolState, PostHistory } from "../domain/history.js";

export interface StateSnapshot {
  postHistory: PostHistory[];
  poolState: PoolState;
}

export interface WriteStateOptions {
  commitMessage?: string;
}

export interface HistoryStore {
  read(): Promise<StateSnapshot>;
  write(snapshot: StateSnapshot, options?: WriteStateOptions): Promise<void>;
  getRecent(limit: number): Promise<PostHistory[]>;
}

export function createEmptyStateSnapshot(): StateSnapshot {
  return {
    postHistory: [],
    poolState: {},
  };
}
