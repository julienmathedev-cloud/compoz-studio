/**
 * @file packages/infra/src/media/storage/blob-media-storage.ts
 * @layer infra/media/storage
 * @description
 * Implémentation Vercel Blob du stockage média.
 *
 * @remarks
 * - Utilisée en preview / production Vercel quand `BLOB_READ_WRITE_TOKEN` est disponible.
 * - Écrit dans un store Blob public.
 * - Retourne l’URL publique absolue du blob.
 */

import { put } from "@vercel/blob";

import type {
  MediaStorage,
  PutMediaInput,
  PutMediaResult,
} from "@compoz/infra/media/storage/media-storage";

export class BlobMediaStorage implements MediaStorage {
  async put(input: PutMediaInput): Promise<PutMediaResult> {
    const key = String(input.key ?? "").replace(/^\/+/, "");
    if (!key) {
      throw new Error("BlobMediaStorage.put: key is required.");
    }

    const blob = await put(key, input.buffer, {
      access: "public",
      contentType: input.contentType,
      addRandomSuffix: false,
    });

    return {
      url: blob.url,
    };
  }
}
