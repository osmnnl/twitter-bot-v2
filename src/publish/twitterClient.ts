import { createHash } from "node:crypto";
import { TwitterApi } from "twitter-api-v2";
import { env, type TwitterCredentials } from "../config/env.js";

export type UploadMimeType = "image/png" | "image/jpeg" | "image/gif";

export interface PublishTweetInput {
  text: string;
  mediaIds?: string[];
}

export interface PublishTweetResult {
  tweetId: string;
  dryRun: boolean;
  text: string;
  mediaIds: string[];
}

export class TwitterPublisher {
  private readonly credentials: TwitterCredentials | null;
  private readonly dryRun: boolean;
  private client: TwitterApi | null = null;

  constructor(credentials: TwitterCredentials | null, dryRun = env.botDryRun()) {
    this.credentials = credentials;
    this.dryRun = dryRun;
  }

  static fromEnvPrefix(envPrefix: string, required = false): TwitterPublisher {
    return new TwitterPublisher(env.twitterCredentials(envPrefix, required));
  }

  isDryRun(): boolean {
    return this.dryRun;
  }

  hasCredentials(): boolean {
    return this.credentials !== null;
  }

  async uploadMedia(buffer: Buffer, mimeType: UploadMimeType, altText?: string): Promise<string> {
    if (this.dryRun) {
      return `dry-run-media-${createHash("md5").update(buffer).digest("hex").slice(0, 12)}`;
    }

    const client = this.getClient().readWrite;
    const mediaId = await client.v2.uploadMedia(buffer, {
      media_type: mimeType,
    });

    if (altText) {
      await client.v2.createMediaMetadata(mediaId, {
        alt_text: {
          text: altText,
        },
      });
    }

    return mediaId;
  }

  async publishTweet(input: PublishTweetInput): Promise<PublishTweetResult> {
    const mediaIds = input.mediaIds ?? [];

    if (this.dryRun) {
      return {
        tweetId: `dry-run-tweet-${Date.now()}`,
        dryRun: true,
        text: input.text,
        mediaIds,
      };
    }

    const client = this.getClient().readWrite;
    const response =
      mediaIds.length > 0
        ? await client.v2.tweet({
            text: input.text,
            media: {
              media_ids: toTweetMediaIds(mediaIds),
            },
          })
        : await client.v2.tweet(input.text);

    return {
      tweetId: response.data.id,
      dryRun: false,
      text: input.text,
      mediaIds,
    };
  }

  private getClient(): TwitterApi {
    if (!this.credentials) {
      throw new Error("Twitter credentials are not configured.");
    }

    if (!this.client) {
      this.client = new TwitterApi({
        appKey: this.credentials.appKey,
        appSecret: this.credentials.appSecret,
        accessToken: this.credentials.accessToken,
        accessSecret: this.credentials.accessSecret,
      });
    }

    return this.client;
  }
}

function toTweetMediaIds(mediaIds: string[]): [string] | [string, string] | [string, string, string] | [string, string, string, string] {
  if (mediaIds.length === 0 || mediaIds.length > 4) {
    throw new Error("Tweet media_ids must contain between 1 and 4 items.");
  }

  const [first, second, third, fourth] = mediaIds;

  if (mediaIds.length === 1) {
    return [requiredMediaId(first)];
  }

  if (mediaIds.length === 2) {
    return [requiredMediaId(first), requiredMediaId(second)];
  }

  if (mediaIds.length === 3) {
    return [requiredMediaId(first), requiredMediaId(second), requiredMediaId(third)];
  }

  return [
    requiredMediaId(first),
    requiredMediaId(second),
    requiredMediaId(third),
    requiredMediaId(fourth),
  ];
}

function requiredMediaId(mediaId: string | undefined): string {
  if (!mediaId) {
    throw new Error("Missing media id.");
  }

  return mediaId;
}
