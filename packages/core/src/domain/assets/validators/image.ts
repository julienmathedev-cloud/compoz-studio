/**
 * @file packages/core/src/domain/assets/validators/image.ts
 * @layer core/domain/assets
 * @description
 * Validateur métier partagé des objets image.
 *
 * @remarks
 * - Sert de base commune pour tous les usages d'image dans le domaine.
 * - Valide la structure canonique `Image` :
 *   `src`, `alt`, `width`, `height`.
 * - `mediaAssetId` est optionnel, mais doit être une chaîne non vide
 *   lorsqu’il est fourni.
 * - Les validateurs plus spécialisés (ex: ImageEditor) peuvent s'appuyer dessus.
 */

import type { Image } from "@compoz/core/domain/assets/entities/image";
import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";

type Path = ReadonlyArray<string | number>;

/**
 * Vérifie qu'une valeur correspond à une image métier valide.
 *
 * @throws DomainError
 * - `EC.CELL_IMAGE_INVALID`
 * - `EC.CELL_IMAGE_SRC_REQUIRED`
 * - `EC.CELL_IMAGE_ALT_INVALID`
 * - `EC.CELL_IMAGE_WIDTH_INVALID`
 * - `EC.CELL_IMAGE_HEIGHT_INVALID`
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
