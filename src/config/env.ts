function readEnv(name: string, required = true): string {
  const value = process.env[name];

  if (!value && required) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value ?? "";
}

export const env = {
  geminiApiKey: () => readEnv("GEMINI_API_KEY", false),
  stateBranch: () => readEnv("STATE_BRANCH", false) || "state",
};
