/**
 * @file packages/core/src/domain/pages/validators/cells.ts
 * @layer core/domain/pages/validators
 * @description
 * Validations métier **pures** pour les cellules d’une page (V0.5).
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  Cell,
  ImageEditor,
} from "@compoz/core/domain/pages/entities/cell";

type Path = ReadonlyArray<string | number>;

const IMAGE_RATIOS = ["default", "wide", "square", "portrait"] as const;

export function assertCell(cell: Cell, path: Path): void {
  if (!cell || typeof cell !== "object") {
    throw new DomainError({
      code: EC.CELL_INVALID,
      message: EC.CELL_INVALID,
      details: { path },
    });
  }

  const kind = cell.kind;

  switch (kind) {
    case "richText":
      assertRichText(cell, path);
      return;

    case "image":
      assertSingleImageCell(cell, path);
      return;

    case "gallery":
      // ✅ Galerie = images + contraintes spécifiques
      assertMultiImageCell(cell.images, path);
      assertGalleryMaxColumns(cell.maxColumns, path);
      return;

    case "carousel":
      // ✅ Carousel = images only
      assertMultiImageCell(cell.images, path);
      return;

    default:
      throw new DomainError({
        code: EC.CELL_KIND_UNSUPPORTED,
        message: EC.CELL_KIND_UNSUPPORTED,
        details: { path: [...path, "kind"], meta: { kind } },
      });
  }
}

/* -------------------------------------------------------------------------- */
/*                                RichText                                    */
/* -------------------------------------------------------------------------- */

function assertRichText(cell: Extract<Cell, { kind: "richText" }>, path: Path) {
  if (typeof cell.content !== "string") {
    throw new DomainError({
      code: EC.RICH_TEXT_CONTENT_INVALID,
      message: EC.RICH_TEXT_CONTENT_INVALID,
      details: { path: [...path, "content"] },
    });
  }
}

/* -------------------------------------------------------------------------- */
/*                                Image (single)                              */
/* -------------------------------------------------------------------------- */

function assertSingleImageCell(
  cell: Extract<Cell, { kind: "image" }>,
  path: Path,
) {
  if (!cell.image || typeof cell.image !== "object") {
    throw new DomainError({
      code: EC.CELL_IMAGE_INVALID,
      message: EC.CELL_IMAGE_INVALID,
      details: { path: [...path, "image"] },
    });
  }

  assertImageEditor(cell.image, [...path, "image"]);

  const { variant } = cell;

  if (typeof variant !== "undefined" && !IMAGE_RATIOS.includes(variant)) {
    throw new DomainError({
      code: EC.IMAGE_VARIANT_INVALID,
      message: EC.IMAGE_VARIANT_INVALID,
      details: { path: [...path, "variant"], meta: { variant } },
    });
  }
}

/* -------------------------------------------------------------------------- */
/*                                Gallery constraints                         */
/* -------------------------------------------------------------------------- */

/**
 * maxColumns (gallery) :
 * - integer
 * - 1..5
 */
function assertGalleryMaxColumns(maxColumns: unknown, path: Path) {
  if (
    typeof maxColumns !== "number" ||
    !Number.isInteger(maxColumns) ||
    maxColumns < 1 ||
    maxColumns > 5
  ) {
    throw new DomainError({
      code: EC.GALLERY_MAX_COLUMNS_INVALID,
      message: EC.GALLERY_MAX_COLUMNS_INVALID,
      details: { path: [...path, "maxColumns"], meta: { maxColumns } },
    });
  }
}

/* -------------------------------------------------------------------------- */
/*                                Shared multi-image                          */
/* -------------------------------------------------------------------------- */

function assertMultiImageCell(images: unknown, path: Path) {
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

/* -------------------------------------------------------------------------- */
/*                                Shared Image Validator                      */
/* -------------------------------------------------------------------------- */

function assertImageEditor(
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

  const { id, src, alt, caption, href } = img as ImageEditor;

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

  if (typeof caption !== "undefined" && typeof caption !== "string") {
    throw new DomainError({
      code: EC.CELL_IMAGE_CAPTION_INVALID,
      message: EC.CELL_IMAGE_CAPTION_INVALID,
      details: { path: [...path, "caption"] },
    });
  }

  if (typeof href !== "undefined" && href !== null) {
    if (typeof href !== "string" || !href.trim()) {
      throw new DomainError({
        code: EC.CELL_IMAGE_HREF_INVALID,
        message: EC.CELL_IMAGE_HREF_INVALID,
        details: { path: [...path, "href"] },
      });
    }
  }
}
