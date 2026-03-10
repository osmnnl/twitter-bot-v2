import { existsSync } from "node:fs";
import path from "node:path";
import { env } from "../src/config/env.js";
import { accounts } from "../src/data/accounts.js";
import { campaigns } from "../src/data/catalog.js";
import { TwitterPublisher } from "../src/publish/twitterClient.js";

type PreflightIssue = {
  level: "error" | "warn";
  message: string;
};

function checkTwitterCredentials(): PreflightIssue[] {
  const issues: PreflightIssue[] = [];

  for (const account of accounts) {
    if (account.enabled === false) {
      continue;
    }

    const publisher = TwitterPublisher.fromEnvPrefix(account.envPrefix, false);
    if (!publisher.hasCredentials()) {
      issues.push({
        level: "error",
        message: `Missing Twitter credentials for ${account.accountId} (${account.envPrefix}).`,
      });
    }
  }

  return issues;
}

function checkGemini(): PreflightIssue[] {
  if (!env.geminiApiKey()) {
    return [
      {
        level: "warn",
        message: "GEMINI_API_KEY is missing; bot will use fallback templates only.",
      },
    ];
  }

  return [];
}

function checkMediaAssets(): PreflightIssue[] {
  const issues: PreflightIssue[] = [];
  const rootDir = process.cwd();

  for (const campaign of campaigns) {
    if (!campaign.mediaRequired) {
      continue;
    }

    const resolved = path.resolve(rootDir, campaign.imagePath);
    if (!existsSync(resolved)) {
      issues.push({
        level: "error",
        message: `Missing required media file: ${campaign.imagePath}`,
      });
    }
  }

  return issues;
}

function renderIssues(issues: PreflightIssue[]): void {
  if (issues.length === 0) {
    console.log("Preflight OK.");
    return;
  }

  const errors = issues.filter((issue) => issue.level === "error");
  const warnings = issues.filter((issue) => issue.level === "warn");

  if (errors.length > 0) {
    console.error("Preflight errors:");
    for (const issue of errors) {
      console.error(`- ${issue.message}`);
    }
  }

  if (warnings.length > 0) {
    console.warn("Preflight warnings:");
    for (const issue of warnings) {
      console.warn(`- ${issue.message}`);
    }
  }

  if (errors.length > 0) {
    process.exit(1);
  }
}

const issues = [
  ...checkTwitterCredentials(),
  ...checkGemini(),
  ...checkMediaAssets(),
];

renderIssues(issues);
