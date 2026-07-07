/**
 * @file packages/core/src/domain/assets/entities/image.ts
 * @layer core/domain/assets
 * @description Image domain entity shared by core features.
 */

export type Image = {
  src: string;
  alt: string;
  width: number;
  height: number;
  mediaAssetId?: string;
};
