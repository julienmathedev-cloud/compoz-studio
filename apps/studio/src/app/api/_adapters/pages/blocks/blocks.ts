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
  DeleteBlockIntentDTO,
  UpdateSectionBlockIntentDTO,
} from "@compoz/validation/pages/blocks/block-intents";

import type { CreateSectionBlockPatchInput } from "@compoz/core/domain/pages/use-cases/blocks/create-section-block.types";
import type { Block } from "@compoz/core/domain/pages/entities/block";
import type { UpdateSectionBlockPatchInput } from "@compoz/core/domain/pages/use-cases/blocks/update-section-block.types";

import {
  preserveBaselineValue,
  preserveValidatedBlockBaseline,
  preserveValidatedRowsBaseline,
} from "@compoz/studio/app/api/_adapters/pages/blocks/block-baselines";
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
    expectedBlocksRevision: dto.expectedBlocksRevision,
    baselineOrder: dto.baselineOrder,
    baselineLcpPriorityBlockId: dto.baselineLcpPriorityBlockId,
    placement: dto.placement,
    name: trimOrKeep(dto.name ?? ""),
    containerMode: dto.containerMode,
    cssClassName: trimOrKeep(dto.cssClassName ?? ""),
    lcpPriority: Boolean(dto.lcpPriority),
    rows,
  };

  log.debug("studio.adapter.blocks.create.end", {
    ms: Date.now() - started,
  });

  return out;
}

export function adaptUpdateSectionBlockIntent(
  dto: UpdateSectionBlockIntentDTO,
): UpdateSectionBlockPatchInput {
  const started = Date.now();

  const adaptLocalRows = (
    rows: NonNullable<UpdateSectionBlockIntentDTO["changes"]["rows"]>["local"],
  ) =>
    rows.map((row) => ({
      id: trimOrKeep(row.id),
      columnsCount: row.columnsCount,
      reverseOn: adaptReverseOn(row.reverseOn),
      columns: row.columns.map((col) => ({
        id: trimOrKeep(col.id),
        cells: adaptCells(col.cells),
      })),
    }));

  const out: UpdateSectionBlockPatchInput = {
    expectedBlocksRevision: dto.expectedBlocksRevision,
    baselineLcpPriorityBlockId: dto.baselineLcpPriorityBlockId,
    changes: {
      ...(dto.changes.name
        ? {
            name: {
              baseline: preserveBaselineValue(dto.changes.name.baseline),
              local: trimOrKeep(dto.changes.name.local),
            },
          }
        : {}),
      ...(dto.changes.containerMode
        ? { containerMode: dto.changes.containerMode }
        : {}),
      ...(dto.changes.cssClassName
        ? {
            cssClassName: {
              baseline: preserveBaselineValue(
                dto.changes.cssClassName.baseline,
              ),
              local:
                trimOrKeep(dto.changes.cssClassName.local ?? "") || undefined,
            },
          }
        : {}),
      ...(dto.changes.lcpPriority
        ? { lcpPriority: dto.changes.lcpPriority }
        : {}),
      ...(dto.changes.rows
        ? {
            rows: {
              baseline: preserveValidatedRowsBaseline(
                dto.changes.rows.baseline,
              ),
              local: adaptLocalRows(dto.changes.rows.local),
            },
          }
        : {}),
    },
  };

  log.debug("studio.adapter.blocks.update.end", {
    ms: Date.now() - started,
  });

  return out;
}

export function adaptDeleteBlockIntent(
  dto: DeleteBlockIntentDTO,
): Readonly<{
  expectedBlocksRevision: number;
  baselineBlock: Block;
}> {
  return {
    expectedBlocksRevision: dto.expectedBlocksRevision,
    baselineBlock: preserveValidatedBlockBaseline(dto.baselineBlock),
  };
}
