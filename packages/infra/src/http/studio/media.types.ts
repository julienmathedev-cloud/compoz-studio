/**
 * @file packages/infra/src/http/studio/media.types.ts
 * @layer infra/http
 * @description
 * DTO SoT des réponses upload média (admin).
 *
 * @remarks
 * - Source of truth alignée sur les routes Next :
 *   - /api/media/upload/image
 *   - /api/media/upload/svg
 * - Ce fichier évite d'importer des types depuis `app/api/.../route.ts`
 *   (dépendance framework) dans un package partagé.
 */

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

export type UploadImageKind = "content" | "og" | "logo" | "favicon";
