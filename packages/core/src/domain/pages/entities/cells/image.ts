/**
 * @file packages/core/src/domain/pages/entities/cells/image.ts
 * @layer core/domain/pages
 * @description
 * Entités métier ImageCell et ImageEditor.
 */

export type ImageEditor = {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  href?: string | null;
  width: number;
  height: number;
};

export type ImageRatio = "default" | "wide" | "portrait" | "square";

export type ImageCell = {
  id: string;
  kind: "image";
  image: ImageEditor;
  variant?: ImageRatio;
};
