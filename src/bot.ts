import { env } from "./config/env.js";
import { calculateRandomDelayMs, isAllowedHour } from "./config/scheduleProfile.js";
import { accounts } from "./data/accounts.js";
import type { PublishingAccount } from "./domain/account.js";
import type { PostHistory } from "./domain/history.js";
import type { Campaign } from "./domain/product.js";
import { ApiResponseError } from "twitter-api-v2";
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

  await applyStartupJitter(dryRun);

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
  let phase = "select";
  let selectedProductId: string | undefined;

  try {
    if (!isAllowedHour(account.scheduleProfile, now)) {
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
    phase = "selected";

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

    selectedProductId = selected.product.id;
    const resolvedAsset = resolveAsset({
      asset: selected.asset,
      poolState,
    });
    phase = "resolved-asset";

    const { tweetText, usedAi } = await generateTweetText(
      selected.product.brand,
      selected.campaign,
      resolvedAsset,
      postHistory,
    );
    phase = "generated-text";

    const publisher = TwitterPublisher.fromEnvPrefix(account.envPrefix, false);
    const mediaHandler = new MediaHandler(publisher);
    const mediaUpload = await mediaHandler.upload({
      imagePath: selected.campaign.imagePath,
      altText: selected.campaign.altText,
      mediaRequired: selected.campaign.mediaRequired,
    });
    phase = "uploaded-media";

    const publishResult = await publisher.publishTweet({
      text: tweetText,
      mediaIds: mediaUpload.mediaId ? [mediaUpload.mediaId] : [],
    });
    phase = "published";

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
    const result: AccountRunResult = {
      accountId: account.accountId,
      dryRun,
      status: "error",
      reason: formatRunError(error, phase),
    };

    if (selectedProductId) {
      result.productId = selectedProductId;
    }

    return {
      result,
    };
  }
}

async function generateTweetText(
  brand: string,
  campaign: Campaign,
  resolvedAsset: {
    assetText: string;
    code?: string;
    referralUrl?: string;
  },
  postHistory: PostHistory[],
): Promise<{ tweetText: string; usedAi: boolean }> {
  const recentHistory = postHistory.slice(0, 20);
  const recentHashes = recentHistory.map((item) => item.textHash);

  if (env.geminiApiKey()) {
    try {
      const generator = new AiGenerator();
      const aiInput = {
        brand,
        campaign,
        assetText: resolvedAsset.assetText,
        maxAttempts: 2,
      } as const;

      if (resolvedAsset.code) {
        Object.assign(aiInput, { code: resolvedAsset.code });
      }

      if (resolvedAsset.referralUrl) {
        Object.assign(aiInput, { referralUrl: resolvedAsset.referralUrl });
      }

      const generated = await generator.generateTweet(aiInput);

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

  const fallbackInput = {
    brand,
    campaign,
    assetText: resolvedAsset.assetText,
  } as const;

  if (resolvedAsset.code) {
    Object.assign(fallbackInput, { code: resolvedAsset.code });
  }

  if (resolvedAsset.referralUrl) {
    Object.assign(fallbackInput, { referralUrl: resolvedAsset.referralUrl });
  }

  const fallbackText = buildTemplateFallbackTweet(fallbackInput);

  if (!validateTweetLength(fallbackText)) {
    throw new Error("Fallback tweet exceeded Twitter character limit.");
  }

  return {
    tweetText: fallbackText,
    usedAi: false,
  };
}

async function applyStartupJitter(dryRun: boolean): Promise<void> {
  if (dryRun || env.botDisableJitter()) {
    return;
  }

  const maxRandomDelayMinutes = accounts.reduce((maxMinutes, account) => {
    return Math.max(maxMinutes, account.scheduleProfile.randomDelayMinutes);
  }, 0);

  const maxDelayMs = calculateRandomDelayMs({
    targetPostsPerDay: 0,
    allowedHours: [],
    minGapHours: 0,
    randomDelayMinutes: maxRandomDelayMinutes,
  });

  if (maxDelayMs <= 0) {
    return;
  }

  await sleep(maxDelayMs);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function formatRunError(error: unknown, phase: string): string {
  if (error instanceof ApiResponseError) {
    const apiErrors = Array.isArray(error.errors)
      ? error.errors
          .map((item) => {
            const code = "code" in item ? String(item.code) : "unknown";
            const message = "message" in item ? String(item.message) : JSON.stringify(item);
            return `${code}:${message}`;
          })
          .join(", ")
      : "";

    const apiDetail =
      typeof error.data === "object" && error.data !== null
        ? JSON.stringify(error.data)
        : String(error.data);

    return [`phase=${phase}`, `http=${error.code}`, apiErrors && `apiErrors=${apiErrors}`, `data=${apiDetail}`]
      .filter(Boolean)
      .join(" | ");
  }

  if (error instanceof Error) {
    return `phase=${phase} | ${error.message}`;
  }

  return `phase=${phase} | ${String(error)}`;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
