import "dotenv/config";

export interface TwitterCredentials {
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
}

function readEnv(name: string, required = true): string {
  const value = process.env[name];

  if (!value && required) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value ?? "";
}

function readBooleanEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function twitterCredentials(envPrefix: string, required = false): TwitterCredentials | null {
  const appKey = readEnv(`${envPrefix}_APP_KEY`, required);
  const appSecret = readEnv(`${envPrefix}_APP_SECRET`, required);
  const accessToken = readEnv(`${envPrefix}_ACCESS_TOKEN`, required);
  const accessSecret = readEnv(`${envPrefix}_ACCESS_SECRET`, required);

  if (![appKey, appSecret, accessToken, accessSecret].every(Boolean)) {
    return null;
  }

  return {
    appKey,
    appSecret,
    accessToken,
    accessSecret,
  };
}

export const env = {
  geminiApiKey: () => readEnv("GEMINI_API_KEY", false),
  geminiModel: () => readEnv("GEMINI_MODEL", false) || "gemini-2.5-flash",
  stateBranch: () => readEnv("STATE_BRANCH", false) || "state",
  botDryRun: () => readBooleanEnv("BOT_DRY_RUN", true),
  botDisableJitter: () => readBooleanEnv("BOT_DISABLE_JITTER", false),
  twitterCredentials,
};
