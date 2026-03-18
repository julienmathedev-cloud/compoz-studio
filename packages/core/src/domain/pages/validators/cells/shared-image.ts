/**
 * @file packages/core/src/domain/pages/validators/cells/shared-image.ts
 * @layer core/domain/pages/validators
 * @description
 * Validateur partagé des images de cells.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { ImageEditor } from "@compoz/core/domain/pages/entities/cell";

type Path = ReadonlyArray<string | number>;

export function assertImageEditor(
  img: unknown,
  path: Path,
): asserts img is ImageEditor {
  if (!img || typeof img !== "object") {
    throw new DomainError({
      code: EC.CELL_IMAGE_INVALID,
      message: EC.CELL_IMAGE_INVALID,
      details: { path },
    });
  }

  const { id, src, alt, caption, href, width, height } = img as ImageEditor;

  if (typeof id !== "string" || !id.trim()) {
    throw new DomainError({
      code: EC.CELL_IMAGE_ID_REQUIRED,
      message: EC.CELL_IMAGE_ID_REQUIRED,
      details: { path: [...path, "id"] },
    });
  }

  if (typeof src !== "string" || !src.trim()) {
    throw new DomainError({
      code: EC.CELL_IMAGE_SRC_REQUIRED,
      message: EC.CELL_IMAGE_SRC_REQUIRED,
      details: { path: [...path, "src"] },
    });
  }

  if (typeof alt !== "string") {
    throw new DomainError({
      code: EC.CELL_IMAGE_ALT_INVALID,
      message: EC.CELL_IMAGE_ALT_INVALID,
      details: { path: [...path, "alt"] },
    });
  }

  if (caption !== null && typeof caption !== "string") {
    throw new DomainError({
      code: EC.CELL_IMAGE_CAPTION_INVALID,
      message: EC.CELL_IMAGE_CAPTION_INVALID,
      details: { path: [...path, "caption"] },
    });
  }

  if (href !== null && typeof href !== "string") {
    throw new DomainError({
      code: EC.CELL_IMAGE_HREF_INVALID,
      message: EC.CELL_IMAGE_HREF_INVALID,
      details: { path: [...path, "href"] },
    });
  }

  if (typeof width !== "number" || !Number.isFinite(width) || width <= 0) {
    throw new DomainError({
      code: EC.CELL_IMAGE_WIDTH_INVALID,
      message: EC.CELL_IMAGE_WIDTH_INVALID,
      details: { path: [...path, "width"], meta: { width } },
    });
  }

  if (typeof height !== "number" || !Number.isFinite(height) || height <= 0) {
    throw new DomainError({
      code: EC.CELL_IMAGE_HEIGHT_INVALID,
      message: EC.CELL_IMAGE_HEIGHT_INVALID,
      details: { path: [...path, "height"], meta: { height } },
    });
  }
}

export function assertMultiImageCell(images: unknown, path: Path) {
  if (!Array.isArray(images)) {
    throw new DomainError({
      code: EC.CELL_IMAGES_INVALID,
      message: EC.CELL_IMAGES_INVALID,
      details: { path: [...path, "images"] },
    });
  }

  if (images.length < 1) {
    throw new DomainError({
      code: EC.CELL_IMAGES_MIN_1,
      message: EC.CELL_IMAGES_MIN_1,
      details: { path: [...path, "images"] },
    });
  }

  for (let i = 0; i < images.length; i++) {
    assertImageEditor(images[i], [...path, "images", i]);
  }
}
