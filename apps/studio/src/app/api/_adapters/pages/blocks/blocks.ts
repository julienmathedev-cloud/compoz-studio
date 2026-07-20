/**
 * @file apps/studio/src/app/api/_adapters/pages/blocks/blocks.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Studio API adapter for creating, updating, deleting, and reordering section blocks.
 */

import { log } from "@compoz/infra/lib/log";
import { trimOrKeep } from "@compoz/studio/lib/strings";

import type {
  CreateSectionBlockIntentDTO,
  UpdateSectionBlockIntentDTO,
} from "@compoz/validation/pages/blocks/block-intents";

import type { CreateSectionBlockPatchInput } from "@compoz/core/domain/pages/use-cases/blocks/create-section-block.types";
import type {
  SectionBlockPatch,
  UpdateSectionBlockPatchInput,
} from "@compoz/core/domain/pages/use-cases/blocks/update-section-block.types";

import { adaptCells } from "@compoz/studio/app/api/_adapters/pages/blocks/cells";

function trimOptionalId(value: string | undefined): string | undefined {
  const trimmed = trimOrKeep(value ?? "");
  return trimmed.length > 0 ? trimmed : undefined;
}

function adaptReverseOn(
  value:
    | {
        mobile?: boolean;
        tablet?: boolean;
        desktop?: boolean;
      }
    | undefined,
) {
  return {
    mobile: Boolean(value?.mobile),
    tablet: Boolean(value?.tablet),
    desktop: Boolean(value?.desktop),
  };
}

export function adaptCreateSectionBlockIntent(
  dto: CreateSectionBlockIntentDTO,
): CreateSectionBlockPatchInput {
  const started = Date.now();

  const rows: CreateSectionBlockPatchInput["rows"] = dto.rows.map((row) => {
    const rowId = trimOptionalId(row.id);

    return {
      ...(rowId ? { id: rowId } : {}),
      columnsCount: row.columnsCount,
      reverseOn: adaptReverseOn(row.reverseOn),
      columns: row.columns.map((col) => {
        const columnId = trimOptionalId(col.id);

        return {
          ...(columnId ? { id: columnId } : {}),
          cells: adaptCells(col.cells),
        };
      }),
    };
  });

  const out: CreateSectionBlockPatchInput = {
    name: trimOrKeep(dto.name ?? ""),
    containerMode: dto.containerMode,
    cssClassName: trimOrKeep(dto.cssClassName ?? ""),
    lcpPriority: Boolean(dto.lcpPriority),
    rows,
  };

  if ("insertAt" in dto) {
    out.insertAt = dto.insertAt;
  }

  log.debug("studio.adapter.blocks.create.end", {
    ms: Date.now() - started,
  });

  return out;
}

export function adaptUpdateSectionBlockIntent(
  dto: UpdateSectionBlockIntentDTO,
): UpdateSectionBlockPatchInput {
  const started = Date.now();

  const patch: SectionBlockPatch = {};

  if ("name" in dto.patch) {
    patch.name = trimOrKeep(dto.patch.name ?? "");
  }

  if ("containerMode" in dto.patch) {
    patch.containerMode = dto.patch.containerMode;
  }

  if ("cssClassName" in dto.patch) {
    patch.cssClassName = trimOrKeep(dto.patch.cssClassName ?? "");
  }

  if ("lcpPriority" in dto.patch) {
    patch.lcpPriority = dto.patch.lcpPriority;
  }

  if ("rows" in dto.patch && dto.patch.rows) {
    patch.rows = dto.patch.rows.map((row) => ({
      id: trimOrKeep(row.id),
      columnsCount: row.columnsCount,
      reverseOn: adaptReverseOn(row.reverseOn),
      columns: row.columns.map((col) => ({
        id: trimOrKeep(col.id),
        cells: adaptCells(col.cells),
      })),
    }));
  }

  const out: UpdateSectionBlockPatchInput = {
    blockId: trimOrKeep(dto.blockId),
    patch,
  };

  log.debug("studio.adapter.blocks.update.end", {
    ms: Date.now() - started,
  });

  return out;
}
