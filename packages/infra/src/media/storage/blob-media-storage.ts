/**
 * @file packages/infra/src/media/storage/blob-media-storage.ts
 * @layer infra/media/storage
 * @description Vercel Blob implementation of media storage.
 */

import { del, head, put } from "@vercel/blob";

import type {
  DeleteMediaInput,
  MediaStorage,
  PutMediaInput,
  PutMediaResult,
  ReadMediaInput,
  ReadMediaResult,
} from "@compoz/infra/media/storage/media-storage";

function normalizeBlobKey(rawKey: string): string {
  const key = String(rawKey ?? "")
    .replace(/^\/+/, "")
    .trim();

  if (!key) {
    throw new Error("BlobMediaStorage: key is required.");
  }

  return key;
}

export class BlobMediaStorage implements MediaStorage {
  async put(input: PutMediaInput): Promise<PutMediaResult> {
    const key = normalizeBlobKey(input.key);

    const blob = await put(key, input.buffer, {
      access: "public",
      contentType: input.contentType,
      addRandomSuffix: false,
    });

    return {
      url: blob.url,
    };
  }

  async read(input: ReadMediaInput): Promise<ReadMediaResult> {
    const key = normalizeBlobKey(input.key);

    const blobMeta = await head(key);
    if (!blobMeta?.url) {
      throw new Error(
        `BlobMediaStorage.read: blob not found for key "${key}".`,
      );
    }

    const response = await fetch(blobMeta.url, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `BlobMediaStorage.read: failed to fetch blob "${key}" (status ${response.status}).`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    return {
      buffer: Buffer.from(arrayBuffer),
      contentType: response.headers.get("content-type") ?? undefined,
    };
  }

  async delete(input: DeleteMediaInput): Promise<void> {
    const key = normalizeBlobKey(input.key);
    await del(key);
  }
}
