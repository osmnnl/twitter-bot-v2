import { RepoStateAdapter } from "../src/history/repoStateAdapter.js";
import type { StateSnapshot } from "../src/history/historyStore.js";

const adapter = new RepoStateAdapter({
  repoDir: process.cwd(),
  cloneSource: ".",
  pushChanges: false,
  stateBranch: "state",
});

const sampleSnapshot: StateSnapshot = {
  postHistory: [
    {
      productId: "turknet",
      assetId: "turknet-TESTCODE",
      accountId: "account1",
      tweetId: "test-tweet",
      textHash: "test-hash",
      tweetText: "test tweet",
      postedAt: new Date().toISOString(),
    },
  ],
  poolState: {
    turknet: {
      available: ["TESTCODE"],
      disabled: [],
      lastReset: null,
      resetPolicy: "manual",
    },
  },
};

try {
  await adapter.write(sampleSnapshot, { commitMessage: "test: state adapter" });
  const loaded = await adapter.read();

  if (!loaded.postHistory.length) {
    throw new Error("postHistory not persisted.");
  }

  if (!loaded.poolState.turknet?.available?.length) {
    throw new Error("poolState not persisted.");
  }

  console.log("State adapter tests OK.");
} catch (error) {
  console.error("State adapter tests failed.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
