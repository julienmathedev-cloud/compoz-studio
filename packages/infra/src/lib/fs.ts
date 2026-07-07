/**
 * @file packages/infra/src/lib/fs.ts
 * @layer infra/fs
 * @description Low-level filesystem helpers for infra code.
 * @remarks
 * Atomic writes use a temporary file, best-effort fsync, and rename-based replacement.
 */

import { promises as fs } from "node:fs";
import { dirname } from "node:path";

export async function ensureDirForFile(filePath: string): Promise<void> {
  await fs.mkdir(dirname(filePath), { recursive: true });
}

function toUint8Array(view: NodeJS.ArrayBufferView): Uint8Array {
  return view instanceof Uint8Array
    ? view
    : new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
}

export async function writeFileAtomic(
  filePath: string,
  data: string | NodeJS.ArrayBufferView,
  encoding: BufferEncoding = "utf-8",
): Promise<void> {
  await ensureDirForFile(filePath);

  // Stable temporary filename for the rename-based atomic write.
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  const fh = await fs.open(tmp, "w");

  try {
    if (typeof data === "string") {
      await fh.writeFile(data, { encoding });
    } else {
      await fh.writeFile(toUint8Array(data));
    }
    await fh.sync();
  } finally {
    // Best-effort close must not hide an earlier write or sync error.
    try {
      await fh.close();
    } catch {
      /* noop */
    }
  }

  try {
    await fs.rename(tmp, filePath);
  } catch (renameErr) {
    // Best-effort cleanup if the final rename fails.
    try {
      await fs.unlink(tmp);
    } catch {
      /* noop */
    }
    throw renameErr;
  }

  // Best-effort parent directory fsync after the rename.
  try {
    const dir = await fs.open(dirname(filePath), "r");
    try {
      await dir.sync();
    } finally {
      await dir.close();
    }
  } catch {
    /* noop */
  }
}

export class InvalidJsonFileError extends Error {
  readonly path: string;

  constructor(path: string, cause?: unknown) {
    super(
      `Invalid JSON at ${path}`,
      cause !== undefined ? { cause } : undefined,
    );
    this.name = "InvalidJsonFileError";
    this.path = path;
  }
}

export async function readJsonFile<T = unknown>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf-8");

  // Strip an optional UTF-8 BOM before JSON parsing.
  const text =
    raw.length > 0 && raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new InvalidJsonFileError(filePath, err);
  }
}
