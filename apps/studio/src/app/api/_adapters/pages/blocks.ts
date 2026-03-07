/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Adaptateurs API Studio pour les blocks de pages :
 * convertit les Intent DTOs (API) en inputs domaine (use-cases).
 *
 * Responsabilités :
 * - trimming défensif (ids, strings)
 * - préserver la sémantique PATCH (présence de clé)
 * - aucune logique métier (invariants gérés par les use-cases)
 * - pas de gestion de state (draft-only, géré par la route)
 * - pas de gestion de `pageId` (SoT = params route)
 */

import { log } from "@compoz/infra/lib/log";
import { sanitizeRichTextHtml } from "@compoz/infra/lib/sanitize-rich-text";
import { trimOrKeep } from "@compoz/studio/lib/strings";

import type {
  CreateLayoutSectionBlockIntentDTO,
  DeleteBlockIntentDTO,
  ReorderBlocksIntentDTO,
  UpdateLayoutSectionBlockIntentDTO,
} from "@compoz/validation/pages/blocks/block-intents";

import type {
  CarouselCell,
  Cell,
  GalleryCell,
  ImageCell,
  ImageEditor,
  RichTextCell,
} from "@compoz/core/domain/pages/entities/cell";

import type { CreateLayoutSectionBlockPatchInput } from "@compoz/core/domain/pages/use-cases/blocks/create-layout-section-block.types";
import type { DeleteBlockPatchInput } from "@compoz/core/domain/pages/use-cases/blocks/delete-block.types";
import type { ReorderBlocksPatchInput } from "@compoz/core/domain/pages/use-cases/blocks/reorder-blocks.types";
import type {
  LayoutSectionBlockPatch,
  UpdateLayoutSectionBlockPatchInput,
} from "@compoz/core/domain/pages/use-cases/blocks/update-layout-section-block.types";

import type {
  CarouselCellIntentDTO,
  CellIntentDTO,
  GalleryCellIntentDTO,
  ImageCellIntentDTO,
  ImageEditorIntentDTO,
  RichTextCellIntentDTO,
} from "@compoz/validation/pages/blocks/cells/cell-intents";

/* -------------------------------------------------------------------------- */
/* DTO -> DOMAIN INPUTS                                                       */
/* -------------------------------------------------------------------------- */

export function adaptCreateLayoutSectionBlockIntent(
  dto: CreateLayoutSectionBlockIntentDTO,
): CreateLayoutSectionBlockPatchInput {
  const started = Date.now();

  const out: CreateLayoutSectionBlockPatchInput = {
    columns: dto.columns,
    containerMode: dto.containerMode,
    cells: adaptCells(dto.cells),

    titleEnabled: Boolean(dto.titleEnabled),
    lcpPriority: Boolean(dto.lcpPriority),

    title: {
      text: trimOrKeep(dto.title?.text ?? ""),
      display: dto.title?.display === "sr-only" ? "sr-only" : "visible",
    },
  };

  if ("insertAt" in dto) out.insertAt = dto.insertAt;

  log.debug("studio.adapter.pagesBlocks.create.end", {
    ms: Date.now() - started,
  });

  return out;
}

export function adaptUpdateLayoutSectionBlockIntent(
  dto: UpdateLayoutSectionBlockIntentDTO,
): UpdateLayoutSectionBlockPatchInput {
  const started = Date.now();

  const patch: LayoutSectionBlockPatch = {};

  if ("columns" in dto.patch) patch.columns = dto.patch.columns;
  if ("titleEnabled" in dto.patch) patch.titleEnabled = dto.patch.titleEnabled;
  if ("lcpPriority" in dto.patch) patch.lcpPriority = dto.patch.lcpPriority;
  if ("containerMode" in dto.patch)
    patch.containerMode = dto.patch.containerMode;

  if ("title" in dto.patch && dto.patch.title) {
    patch.title = {
      text: trimOrKeep(dto.patch.title.text),
      display: dto.patch.title.display,
    };
  }

  if ("cells" in dto.patch) {
    patch.cells = adaptCells(dto.patch.cells);
  }

  const out: UpdateLayoutSectionBlockPatchInput = {
    blockId: trimOrKeep(dto.blockId),
    patch,
  };

  log.debug("studio.adapter.pagesBlocks.update.end", {
    ms: Date.now() - started,
  });

  return out;
}

export function adaptDeleteBlockIntent(
  dto: DeleteBlockIntentDTO,
): DeleteBlockPatchInput {
  return {
    blockId: trimOrKeep(dto.blockId),
  };
}

export function adaptReorderBlocksIntent(
  dto: ReorderBlocksIntentDTO,
): ReorderBlocksPatchInput {
  return {
    orderedBlockIds: dto.orderedBlockIds.map(trimOrKeep),
  };
}

/* -------------------------------------------------------------------------- */
/* Cells adapter                                                              */
/* -------------------------------------------------------------------------- */

function adaptCells(
  dtoCells: ReadonlyArray<CellIntentDTO> | undefined,
): readonly Cell[] {
  if (!Array.isArray(dtoCells)) return [];

  return dtoCells.map((cell) => {
    switch (cell.kind) {
      case "image":
        return adaptImageCell(cell);

      case "gallery":
        return adaptGalleryCell(cell);

      case "carousel":
        return adaptCarouselCell(cell);

      case "richText":
        return adaptRichTextCell(cell);

      default:
        return cell;
    }
  });
}

function adaptImageCell(dto: ImageCellIntentDTO): ImageCell {
  return {
    kind: "image",
    variant: dto.variant,
    image: adaptImage(dto.image),
  };
}

function adaptGalleryCell(dto: GalleryCellIntentDTO): GalleryCell {
  return {
    kind: "gallery",
    linksEnabled: dto.linksEnabled,
    maxColumns: dto.maxColumns,
    images: dto.images.map(adaptImage),
  };
}

function adaptCarouselCell(dto: CarouselCellIntentDTO): CarouselCell {
  return {
    kind: "carousel",
    images: dto.images.map(adaptImage),
  };
}

function adaptRichTextCell(dto: RichTextCellIntentDTO): RichTextCell {
  const raw = typeof dto.content === "string" ? dto.content : "";
  const safe = sanitizeRichTextHtml(raw);

  return {
    kind: "richText",
    content: safe,
  };
}

function adaptImage(dto: ImageEditorIntentDTO): ImageEditor {
  return {
    id: trimOrKeep(dto.id),
    src: trimOrKeep(dto.src),

    alt: typeof dto.alt === "string" ? trimOrKeep(dto.alt) : dto.alt,
    caption:
      typeof dto.caption === "string" ? trimOrKeep(dto.caption) : dto.caption,
    href: typeof dto.href === "string" ? trimOrKeep(dto.href) : dto.href,

    width: dto.width ?? 0,
    height: dto.height ?? 0,
  };
}
