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

import { promises as fs } from "node:fs";
import { join } from "node:path";

import { ensureDirForFile, writeFileAtomic } from "@compoz/infra/lib/fs";
import type {
  DeleteMediaInput,
  MediaStorage,
  PutMediaInput,
  PutMediaResult,
  ReadMediaInput,
  ReadMediaResult,
} from "@compoz/infra/media/storage/media-storage";

const LOCAL_UPLOADS_ROOT =
  process.env["PUBLIC_UPLOADS_DIR"] ?? join(process.cwd(), "public", "uploads");

function normalizeLocalKey(rawKey: string): string {
  const key = String(rawKey ?? "")
    .replace(/^\/+/, "")
    .trim();

  if (!key) {
    throw new Error("LocalMediaStorage: key is required.");
  }

  return key;
}

function toRelativeUploadUrl(key: string): string {
  return `/uploads/${key}`;
}

function toAbsoluteUploadPath(key: string): string {
  return join(LOCAL_UPLOADS_ROOT, key);
}

export class LocalMediaStorage implements MediaStorage {
  async put(input: PutMediaInput): Promise<PutMediaResult> {
    const key = normalizeLocalKey(input.key);
    const absPath = toAbsoluteUploadPath(key);

    await ensureDirForFile(absPath);
    await writeFileAtomic(absPath, input.buffer);

    return {
      url: toRelativeUploadUrl(key),
    };
  }

  async read(input: ReadMediaInput): Promise<ReadMediaResult> {
    const key = normalizeLocalKey(input.key);
    const absPath = toAbsoluteUploadPath(key);
    const buffer = await fs.readFile(absPath);

    return {
      buffer,
      contentType: undefined,
    };
  }

  async delete(input: DeleteMediaInput): Promise<void> {
    const key = normalizeLocalKey(input.key);
    const absPath = toAbsoluteUploadPath(key);

    await fs.rm(absPath, { force: true });
  }
}
