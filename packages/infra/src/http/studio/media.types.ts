/**
 * @file packages/infra/src/http/studio/media.types.ts
 * @layer infra/http/studio
 * @description
 * DTO SoT des uploads média Studio.
 */

export type UploadImageKind = "content" | "og" | "logo" | "favicon";

export type PrepareImageUploadRequest = Readonly<{
  filename: string;
  contentType: string;
  size: number;
  kind: UploadImageKind;
}>;

export type PrepareImageUploadResponse = Readonly<{
  /**
   * Clé temporaire générée côté serveur.
   * Elle sera utilisée comme pathname Blob pour l’upload direct.
   */
  tempKey: string;
}>;

export type UploadImageClientPayload = Readonly<{
  tempKey: string;
  kind: UploadImageKind;
  originalFilename: string;
  originalContentType: string;
  originalSize: number;
}>;

export type FinalizeImageUploadRequest = Readonly<{
  tempKey: string;
  kind: UploadImageKind;
  originalFilename: string;
  originalContentType: string;
  originalSize: number;
}>;

export type UploadImageResponse = Readonly<{
  mediaAssetId: string;
  url: string;
  filename: string;
  size: number;
  width: number;
  height: number;
  contentType: string;
  originalSize: number;
  optimizedSize: number;
  wasResized: boolean;
  wasCompressed: boolean;
}>;

export type UploadSvgResponse = Readonly<{
  mediaAssetId: string;
  url: string;
  filename: string;
  size: number;
  width: number;
  height: number;
  contentType: string;
}>;

export type MediaUploadResponseDTO = UploadImageResponse | UploadSvgResponse;
