import { readFile } from "node:fs/promises";
import path from "node:path";
import { TwitterPublisher, type UploadMimeType } from "./twitterClient.js";

export interface UploadMediaInput {
  imagePath: string;
  altText?: string;
  mediaRequired?: boolean;
}

export interface UploadMediaResult {
  mediaId?: string;
  skipped: boolean;
  sourcePath: string;
  reason?: string;
}

export class MediaHandler {
  constructor(
    private readonly publisher: TwitterPublisher,
    private readonly rootDir = process.cwd(),
  ) {}

  async upload(input: UploadMediaInput): Promise<UploadMediaResult> {
    const sourcePath = path.resolve(this.rootDir, input.imagePath);

    try {
      const buffer = await readFile(sourcePath);
      const mediaId = await this.publisher.uploadMedia(
        buffer,
        detectMimeType(sourcePath),
        input.altText,
      );

      return {
        mediaId,
        skipped: false,
        sourcePath,
      };
    } catch (error) {
      if (input.mediaRequired && !this.publisher.isDryRun()) {
        throw error;
      }

      return {
        skipped: true,
        sourcePath,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

function detectMimeType(filePath: string): UploadMimeType {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }

  if (extension === ".gif") {
    return "image/gif";
  }

  throw new Error(`Unsupported media extension: ${extension}`);
}
