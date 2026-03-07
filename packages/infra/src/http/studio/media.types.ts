/**
 * @file packages/infra/src/http/studio/media.types.ts
 * @layer infra/http/studio
 * @description
 * DTO SoT des réponses d’upload média (Studio).
 *
 * @remarks
 * - Source of truth alignée sur les routes Next côté Studio (préfixées via ENDPOINTS).
 * - Ce fichier évite d'importer des types depuis `app/api/.../route.ts`
 *   (dépendance framework) dans un package partagé.
 */

export type UploadImageKind = "content" | "og" | "logo" | "favicon";

export type UploadImageResponse = Readonly<{
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
  url: string;
  filename: string;
  size: number;
  contentType: string;
}>;

export type MediaUploadResponseDTO = UploadImageResponse | UploadSvgResponse;
