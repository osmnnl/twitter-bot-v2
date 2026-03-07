import { env } from "./config/env.js";
import { accounts } from "./data/accounts.js";
import type { PublishingAccount } from "./domain/account.js";
import type { PostHistory } from "./domain/history.js";
import type { Campaign } from "./domain/product.js";
import { AiGenerator } from "./generation/aiGenerator.js";
import {
  checkDuplicateCandidate,
  hashTweetText,
  validateTweetLength,
} from "./generation/duplicateGuard.js";
import { buildTemplateFallbackTweet } from "./generation/templateFallback.js";
import { RepoStateAdapter } from "./history/repoStateAdapter.js";
import { MediaHandler } from "./publish/mediaHandler.js";
import { TwitterPublisher } from "./publish/twitterClient.js";
import { resolveAsset } from "./selectors/assetSelector.js";
import { selectCampaign } from "./selectors/campaignSelector.js";

type AccountRunResult = {
  accountId: string;
  dryRun: boolean;
  status: "posted" | "skipped" | "error";
  reason?: string;
  productId?: string;
  tweetText?: string;
  tweetId?: string;
  usedAi?: boolean;
};

async function main(): Promise<void> {
  const now = new Date();
  const dryRun = env.botDryRun();
  const stateStore = new RepoStateAdapter({
    stateBranch: env.stateBranch(),
    pushChanges: !dryRun,
  });
  const snapshot = await stateStore.read();
  const results: AccountRunResult[] = [];
  let hasPersistedChanges = false;

  for (const account of accounts) {
    const result = await runAccount(account, snapshot.postHistory, snapshot.poolState, now, dryRun);
    results.push(result.result);

    if (result.historyEntry) {
      snapshot.postHistory.unshift(result.historyEntry);
      snapshot.postHistory = snapshot.postHistory.slice(0, 200);
      hasPersistedChanges = hasPersistedChanges || !dryRun;
    }
  }

  if (hasPersistedChanges && !dryRun) {
    await stateStore.write(snapshot, {
      commitMessage: `chore: update state snapshot (${now.toISOString()})`,
    });
  }

  console.log(
    JSON.stringify(
      {
        project: "twitter-bot-v2",
        dryRun,
        stateBranch: env.stateBranch(),
        processedAccounts: results.length,
        results,
      },
      null,
      2,
    ),
  );
}

async function runAccount(
  account: PublishingAccount,
  postHistory: PostHistory[],
  poolState: Record<string, { available: string[]; used: string[]; lastReset: string | null; resetPolicy: "manual" | "monthly" }>,
  now: Date,
  dryRun: boolean,
): Promise<{ result: AccountRunResult; historyEntry?: PostHistory }> {
  try {
    if (!account.scheduleProfile.allowedHours.includes(now.getHours())) {
      return {
        result: {
          accountId: account.accountId,
          dryRun,
          status: "skipped",
          reason: "current hour is outside allowedHours",
        },
      };
    }

    const selected = selectCampaign({
      account,
      postHistory,
      poolState,
      now,
    });

    if (!selected) {
      return {
        result: {
          accountId: account.accountId,
          dryRun,
          status: "skipped",
          reason: "no eligible campaign found",
        },
      };
    }

    const resolvedAsset = resolveAsset({
      asset: selected.asset,
      poolState,
    });

    const { tweetText, usedAi } = await generateTweetText(
      selected.product.brand,
      selected.campaign,
      resolvedAsset.assetText,
      postHistory,
    );

    const publisher = TwitterPublisher.fromEnvPrefix(account.envPrefix, false);
    const mediaHandler = new MediaHandler(publisher);
    const mediaUpload = await mediaHandler.upload({
      imagePath: selected.campaign.imagePath,
      altText: selected.campaign.altText,
      mediaRequired: selected.campaign.mediaRequired,
    });

    const publishResult = await publisher.publishTweet({
      text: tweetText,
      mediaIds: mediaUpload.mediaId ? [mediaUpload.mediaId] : [],
    });

    const historyEntry: PostHistory = {
      productId: selected.product.id,
      assetId: resolvedAsset.assetId,
      accountId: account.accountId,
      tweetId: publishResult.tweetId,
      textHash: hashTweetText(tweetText),
      postedAt: now.toISOString(),
    };

    return {
      result: {
        accountId: account.accountId,
        dryRun: publishResult.dryRun,
        status: "posted",
        productId: selected.product.id,
        tweetText,
        tweetId: publishResult.tweetId,
        usedAi,
      },
      historyEntry,
    };
  } catch (error) {
    return {
      result: {
        accountId: account.accountId,
        dryRun,
        status: "error",
        reason: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

async function generateTweetText(
  brand: string,
  campaign: Campaign,
  assetText: string,
  postHistory: PostHistory[],
): Promise<{ tweetText: string; usedAi: boolean }> {
  const recentHistory = postHistory.slice(0, 20);
  const recentHashes = recentHistory.map((item) => item.textHash);

  if (env.geminiApiKey()) {
    try {
      const generator = new AiGenerator();
      const generated = await generator.generateTweet({
        brand,
        campaign,
        assetText,
        maxAttempts: 2,
      });

      const duplicateCheck = checkDuplicateCandidate({
        text: generated.text,
        recentHashes,
      });

      if (!duplicateCheck.requiresRewrite && validateTweetLength(generated.text)) {
        return {
          tweetText: generated.text,
          usedAi: true,
        };
      }
    } catch {
      // Fallback below handles AI failures and invalid outputs.
    }
  }

  const fallbackText = buildTemplateFallbackTweet({
    brand,
    campaign,
    assetText,
  });

  if (!validateTweetLength(fallbackText)) {
    throw new Error("Fallback tweet exceeded Twitter character limit.");
  }

  return {
    tweetText: fallbackText,
    usedAi: false,
  };
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
