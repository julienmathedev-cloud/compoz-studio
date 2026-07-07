/**
 * @file packages/infra/src/media/storage/index.ts
 * @layer infra/media/storage
 * @description Resolves the media storage backend.
 * @remarks
 * Uses local filesystem storage by default, and Vercel Blob when `BLOB_READ_WRITE_TOKEN` is available.
 */

import { BlobMediaStorage } from "@compoz/infra/media/storage/blob-media-storage";
import { LocalMediaStorage } from "@compoz/infra/media/storage/local-media-storage";
import type { MediaStorage } from "@compoz/infra/media/storage/media-storage";

let mediaStorageSingleton: MediaStorage | null = null;

function hasBlobToken(): boolean {
  return Boolean(String(process.env["BLOB_READ_WRITE_TOKEN"] ?? "").trim());
}

export function getMediaStorage(): MediaStorage {
  if (mediaStorageSingleton) {
    return mediaStorageSingleton;
  }

  mediaStorageSingleton = hasBlobToken()
    ? new BlobMediaStorage()
    : new LocalMediaStorage();

  return mediaStorageSingleton;
}
