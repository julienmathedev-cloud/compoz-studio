/**
 * @file packages/infra/src/media/storage/media-storage.ts
 * @layer infra/media/storage
 * @description
 * Contrat commun de stockage des médias uploadés.
 */

export type PutMediaInput = Readonly<{
  key: string;
  buffer: Buffer;
  contentType: string;
}>;

export type PutMediaResult = Readonly<{
  url: string;
}>;

export type ReadMediaInput = Readonly<{
  key: string;
}>;

export type ReadMediaResult = Readonly<{
  buffer: Buffer;
  contentType?: string;
}>;

export type DeleteMediaInput = Readonly<{
  key: string;
}>;

export interface MediaStorage {
  put(input: PutMediaInput): Promise<PutMediaResult>;
  read(input: ReadMediaInput): Promise<ReadMediaResult>;
  delete(input: DeleteMediaInput): Promise<void>;
}
