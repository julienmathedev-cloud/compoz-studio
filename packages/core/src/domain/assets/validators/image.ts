/**
 * @file packages/core/src/domain/assets/validators/image.ts
 * @layer core/domain/assets
 * @description Shared domain validator for canonical image objects.
 * @remarks
 * `mediaAssetId` is optional, but must be a non-empty string when provided.
 */

import type { Image } from "@compoz/core/domain/assets/entities/image";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";

type Path = ReadonlyArray<string | number>;

/**
 * Asserts that a value matches the canonical image domain shape.
 *
 * @throws DomainError when the image payload or one of its required fields is invalid.
 */
export function assertImage(
  image: unknown,
  path: Path,
): asserts image is Image {
  if (!image || typeof image !== "object") {
    throw new DomainError({
      code: EC.CELL_IMAGE_INVALID,
      message: EC.CELL_IMAGE_INVALID,
      details: { path },
    });
  }

  const { src, alt, width, height, mediaAssetId } = image as Image;

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

  if (typeof width !== "number" || !Number.isFinite(width) || width <= 0) {
    throw new DomainError({
      code: EC.CELL_IMAGE_WIDTH_INVALID,
      message: EC.CELL_IMAGE_WIDTH_INVALID,
      details: {
        path: [...path, "width"],
        meta: { width },
      },
    });
  }

  if (typeof height !== "number" || !Number.isFinite(height) || height <= 0) {
    throw new DomainError({
      code: EC.CELL_IMAGE_HEIGHT_INVALID,
      message: EC.CELL_IMAGE_HEIGHT_INVALID,
      details: {
        path: [...path, "height"],
        meta: { height },
      },
    });
  }

  if (
    mediaAssetId !== undefined &&
    (typeof mediaAssetId !== "string" || !mediaAssetId.trim())
  ) {
    throw new DomainError({
      code: EC.CELL_IMAGE_INVALID,
      message: EC.CELL_IMAGE_INVALID,
      details: { path: [...path, "mediaAssetId"] },
    });
  }
}
