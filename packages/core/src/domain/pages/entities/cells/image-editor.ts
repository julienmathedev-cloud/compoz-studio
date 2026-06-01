/**
 * @file packages/core/src/domain/pages/entities/cells/image-editor.ts
 * @layer core/domain/pages
 * @description
 * Entités métier ImageCell et ImageEditor.
 */

import type { Image } from "@compoz/core/domain/assets/entities/image";

export type ImageEditor = Image & {
  id: string;
  caption: string | null;
  href: string | null;
};

export type ImageRatio = "default" | "wide" | "portrait" | "square";
export type ImageSize = "sm" | "md" | "lg" | "full";

export type ImageCell = {
  id: string;
  kind: "image";
  cssClassName?: string;
  image: ImageEditor;
  variant: ImageRatio;
  size: ImageSize;
  reveal: boolean;
};
