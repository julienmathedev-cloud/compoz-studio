/**
 * @file packages/infra/src/media/storage/media-storage.ts
 * @layer infra/media/storage
 * @description
 * Contrat commun de stockage des médias uploadés.
 *
 * @remarks
 * - Abstraction unique pour supporter plusieurs backends :
 *   - local FS en développement
 *   - Vercel Blob en preview / production
 * - Ne contient aucune logique HTTP.
 */

export type PutMediaInput = Readonly<{
  key: string;
  buffer: Buffer;
  contentType: string;
}>;

export type PutMediaResult = Readonly<{
  url: string;
}>;

export interface MediaStorage {
  put(input: PutMediaInput): Promise<PutMediaResult>;
}
