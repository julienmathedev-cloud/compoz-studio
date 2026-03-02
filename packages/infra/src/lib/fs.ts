/**
 * @file packages/infra/src/lib/fs.ts
 * @layer infra/fs
 * @description
 * Utilitaires FileSystem partagés : création de dossiers, écriture atomique,
 * lecture JSON robuste et typée.
 *
 * Responsabilités : helpers bas-niveau pour toute l’infrastructure, durabilité
 * d’écriture, parse JSON avec BOM et erreurs dédiées.
 */

import { promises as fs } from "node:fs";
import { dirname } from "node:path";

/**
 * Crée récursivement le dossier parent d’un fichier.
 * Contrat : idempotent, ne lève pas d’erreur si le dossier existe.
 */
export async function ensureDirForFile(filePath: string): Promise<void> {
  await fs.mkdir(dirname(filePath), { recursive: true });
}

/**
 * Convertit un ArrayBufferView en Uint8Array.
 * Contrat : renvoie un Uint8Array compatible writeFile.
 */
function toUint8Array(view: NodeJS.ArrayBufferView): Uint8Array {
  return view instanceof Uint8Array
    ? view
    : new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
}

/**
 * Écriture atomique d’un fichier.
 * Contrat : écrit dans un fichier temporaire puis renomme pour garantir atomicité.
 * Supporte string ou données binaires, fsync best-effort du fichier et du dossier.
 * Lève l’erreur du rename si elle échoue.
 */
export async function writeFileAtomic(
  filePath: string,
  data: string | NodeJS.ArrayBufferView,
  encoding: BufferEncoding = "utf-8",
): Promise<void> {
  await ensureDirForFile(filePath);

  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  const fh = await fs.open(tmp, "w");

  try {
    if (typeof data === "string") {
      await fh.writeFile(data, { encoding });
    } else {
      await fh.writeFile(toUint8Array(data));
    }
    await fh.sync(); // durabilité : flush du tmp
  } finally {
    // close best-effort : on évite de masquer une erreur précédente
    try {
      await fh.close();
    } catch {
      /* noop */
    }
  }

  try {
    await fs.rename(tmp, filePath);
  } catch (renameErr) {
    // Cleanup best-effort du fichier tmp si rename échoue
    try {
      await fs.unlink(tmp);
    } catch {
      /* noop */
    }
    throw renameErr;
  }

  // Durabilité : fsync du dossier parent (best-effort)
  try {
    const dir = await fs.open(dirname(filePath), "r");
    try {
      await dir.sync();
    } finally {
      await dir.close();
    }
  } catch {
    /* noop — toléré */
  }
}

/**
 * Erreur spécifique pour JSON malformé sur disque.
 * Contrat : expose le chemin du fichier incriminé via `.path`.
 */
export class InvalidJsonFileError extends Error {
  readonly path: string;

  constructor(path: string, cause?: unknown) {
    super(
      `Invalid JSON at ${path}`,
      cause instanceof Error ? { cause } : undefined,
    );
    this.name = "InvalidJsonFileError";
    this.path = path;
  }
}

/**
 * Lit et parse un fichier JSON robuste.
 * Contrat : strip BOM UTF-8 si présent, lance InvalidJsonFileError en cas de JSON invalide.
 */
export async function readJsonFile<T = unknown>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf-8");

  // Strip BOM éventuel
  const text =
    raw.length > 0 && raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;

  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new InvalidJsonFileError(filePath, err);
  }
}
