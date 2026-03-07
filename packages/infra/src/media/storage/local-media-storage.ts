/**
 * @file packages/infra/src/media/storage/local-media-storage.ts
 * @layer infra/media/storage
 * @description
 * Implémentation locale du stockage média via le filesystem.
 *
 * @remarks
 * - Utilisée en développement local.
 * - Écrit dans `public/uploads/...`.
 * - Retourne une URL publique relative (`/uploads/...`).
 */

import { join } from "node:path";

import { ensureDirForFile, writeFileAtomic } from "@compoz/infra/lib/fs";
import type {
  MediaStorage,
  PutMediaInput,
  PutMediaResult,
} from "@compoz/infra/media/storage/media-storage";

const LOCAL_UPLOADS_ROOT =
  process.env["PUBLIC_UPLOADS_DIR"] ?? join(process.cwd(), "public", "uploads");

function toRelativeUploadUrl(key: string): string {
  const normalized = String(key ?? "").replace(/^\/+/, "");
  return `/uploads/${normalized}`;
}

export class LocalMediaStorage implements MediaStorage {
  async put(input: PutMediaInput): Promise<PutMediaResult> {
    const key = String(input.key ?? "").replace(/^\/+/, "");
    if (!key) {
      throw new Error("LocalMediaStorage.put: key is required.");
    }

    const absPath = join(LOCAL_UPLOADS_ROOT, key);

    await ensureDirForFile(absPath);
    await writeFileAtomic(absPath, input.buffer);

    return {
      url: toRelativeUploadUrl(key),
    };
  }
}
