import { RepoStateAdapter } from "../src/history/repoStateAdapter.js";
import type { StateSnapshot } from "../src/history/historyStore.js";

const adapter = new RepoStateAdapter({
  repoDir: process.cwd(),
  cloneSource: ".",
  pushChanges: false,
  stateBranch: "state",
});

const existing = await adapter.read();

if (!Array.isArray(existing.postHistory)) {
  console.error("State adapter tests failed.");
  console.error("postHistory not readable.");
  process.exit(1);
}

if (typeof existing.poolState !== "object" || existing.poolState === null) {
  console.error("State adapter tests failed.");
  console.error("poolState not readable.");
  process.exit(1);
}

console.log("State adapter tests OK.");
