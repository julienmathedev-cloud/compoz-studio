/**
 * @file packages/infra/src/media/storage/index.ts
 * @layer infra/media/storage
 * @description Provides the Vercel Blob media storage singleton.
 */

import { BlobMediaStorage } from "@compoz/infra/media/storage/blob-media-storage";
import type { MediaStorage } from "@compoz/infra/media/storage/media-storage";

let mediaStorageSingleton: MediaStorage | null = null;

export function assertBlobMediaStorageConfigured(): void {
  if (!String(process.env["BLOB_READ_WRITE_TOKEN"] ?? "").trim()) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is required for media operations.",
    );
  }
}

export function getMediaStorage(): MediaStorage {
  assertBlobMediaStorageConfigured();

  if (mediaStorageSingleton) {
    return mediaStorageSingleton;
  }

  mediaStorageSingleton = new BlobMediaStorage();

  return mediaStorageSingleton;
}
