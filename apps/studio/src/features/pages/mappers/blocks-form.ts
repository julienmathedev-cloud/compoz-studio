/**
 * @file apps/studio/src/features/pages/mappers/blocks-form.ts
 * @layer ui/studio/pages/mappers
 *
 * @description
 * Mappers de formulaires studio pour les blocks :
 * - DTO domaine -> FormValues RHF
 * - normalisations UI légères
 * - FormValues -> Intent DTO (API studio)
 * - factories UI (`createEmpty*`)
 *
 * @remarks
 * - Gère uniquement la forme UI et les coercitions légères.
 * - Aucune logique métier.
 * - Aucune gestion de state (draft / published).
 */

import type { BlockDTO } from "@compoz/core/domain/pages/dto";

import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type {
  CreateSectionBlockIntentDTO,
  ReorderBlocksIntentDTO,
  UpdateSectionBlockIntentDTO,
} from "@compoz/validation/pages/blocks/block-intents";

import {
  createEmptyCell,
  toCellFormValuesFromDTO,
} from "@compoz/studio/features/pages/mappers/cells-form";

/* -------------------------------------------------------------------------- */
/* Types locaux UI                                                            */
/* -------------------------------------------------------------------------- */

type SectionBlockDTO = Extract<BlockDTO, { type: "section" }>;
type SectionRowDTO = SectionBlockDTO["rows"][number];
type SectionColumnDTO = SectionRowDTO["columns"][number];
type SectionRowFormValues = SectionBlockFormValues["rows"][number];
type SectionColumnFormValues = SectionRowFormValues["columns"][number];

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function createUiId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `ui_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toMutable<T>(arr: ReadonlyArray<T> | undefined): T[] {
  return Array.isArray(arr) ? [...arr] : [];
}

function normalizeName(
  name: SectionBlockFormValues["name"] | undefined,
): SectionBlockFormValues["name"] {
  return String(name ?? "").trim();
}

function normalizeContainerMode(
  containerMode: SectionBlockFormValues["containerMode"] | undefined,
): SectionBlockFormValues["containerMode"] {
  return containerMode === "fullBleed" ? "fullBleed" : "contained";
}

function normalizeColumnId(id: string | undefined): string {
  const normalized = String(id ?? "").trim();
  return normalized.length > 0 ? normalized : createUiId();
}

function normalizeRowId(id: string | undefined): string {
  const normalized = String(id ?? "").trim();
  return normalized.length > 0 ? normalized : createUiId();
}

function normalizeColumn(
  column: SectionColumnFormValues | undefined,
): SectionColumnFormValues {
  return {
    id: normalizeColumnId(column?.id),
    cells: toMutable(column?.cells),
  };
}

function normalizeColumns(
  columns: ReadonlyArray<SectionColumnFormValues> | undefined,
  columnsCount: 1 | 2 | 3,
): SectionColumnFormValues[] {
  const safeColumns = toMutable(columns).map(normalizeColumn);

  if (safeColumns.length === columnsCount) {
    return safeColumns;
  }

  const next = [...safeColumns];

  while (next.length < columnsCount) {
    next.push(createEmptyColumn());
  }

  return next.slice(0, columnsCount);
}

function normalizeRow(
  row: SectionRowFormValues | undefined,
): SectionRowFormValues {
  const columnsCount =
    row?.columnsCount === 2 || row?.columnsCount === 3 ? row.columnsCount : 1;

  return {
    id: normalizeRowId(row?.id),
    columnsCount,
    columns: normalizeColumns(row?.columns, columnsCount),
  };
}

function normalizeRows(
  rows: ReadonlyArray<SectionRowFormValues> | undefined,
): SectionRowFormValues[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [createEmptyRow()];
  }

  return toMutable(rows).map(normalizeRow);
}

/* -------------------------------------------------------------------------- */
/* Domaine (DTO) -> UI (form values)                                          */
/* -------------------------------------------------------------------------- */

/**
 * Convertit un `BlockDTO` en `SectionBlockFormValues`.
 *
 * @remarks
 * - Si le block n’est pas `section`, retourne une forme minimale safe.
 * - Les rows/columns/cells sont toujours présents côté UI.
 */
export function toSectionBlockFormValuesFromDTO(
  block: BlockDTO,
): SectionBlockFormValues {
  if (block.type !== "section") {
    return createEmptySectionBlock();
  }

  const rows: SectionRowFormValues[] = Array.isArray(block.rows)
    ? toMutable<SectionRowDTO>(block.rows).map((row) => ({
        id: normalizeRowId(row.id),
        columnsCount:
          row.columnsCount === 2 || row.columnsCount === 3
            ? row.columnsCount
            : 1,
        columns: Array.isArray(row.columns)
          ? toMutable<SectionColumnDTO>(row.columns).map((column) => ({
              id: normalizeColumnId(column.id),
              cells: Array.isArray(column.cells)
                ? toMutable(column.cells).map(toCellFormValuesFromDTO)
                : [],
            }))
          : [],
      }))
    : [];

  return {
    name: normalizeName(block.name),
    containerMode: normalizeContainerMode(block.containerMode),
    lcpPriority:
      typeof block.lcpPriority === "boolean" ? block.lcpPriority : false,
    rows: normalizeRows(rows),
  };
}

/* -------------------------------------------------------------------------- */
/* Normalisations UI (forms)                                                  */
/* -------------------------------------------------------------------------- */

export function normalizeSectionBlockFormValues(
  values: SectionBlockFormValues,
): SectionBlockFormValues {
  return {
    name: normalizeName(values.name),
    containerMode: normalizeContainerMode(values.containerMode),
    lcpPriority: Boolean(values.lcpPriority),
    rows: normalizeRows(values.rows),
  };
}

/* -------------------------------------------------------------------------- */
/* UI -> INTENTS (API)                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Construit le DTO d’intent de création d’un `SectionBlock`
 * à partir des FormValues UI (RHF).
 */
export function toCreateSectionBlockIntentDTOFromFormValues(args: {
  values: SectionBlockFormValues;
  insertAt?: number;
}): CreateSectionBlockIntentDTO {
  const { values, insertAt } = args;
  const normalized = normalizeSectionBlockFormValues(values);

  return {
    ...(normalized.name ? { name: normalized.name } : {}),
    containerMode: normalized.containerMode,
    lcpPriority: normalized.lcpPriority,
    rows: normalized.rows,
    insertAt,
  };
}

function toSectionBlockPatch(
  patch: Partial<SectionBlockFormValues>,
): UpdateSectionBlockIntentDTO["patch"] {
  const output: UpdateSectionBlockIntentDTO["patch"] = {};

  if ("name" in patch && patch.name !== undefined) {
    output.name = normalizeName(patch.name);
  }

  if ("containerMode" in patch && patch.containerMode !== undefined) {
    output.containerMode = normalizeContainerMode(patch.containerMode);
  }

  if ("lcpPriority" in patch && patch.lcpPriority !== undefined) {
    output.lcpPriority = Boolean(patch.lcpPriority);
  }

  if ("rows" in patch && patch.rows !== undefined) {
    output.rows = normalizeRows(patch.rows);
  }

  return output;
}

/**
 * Construit l’intent de mise à jour d’un `SectionBlock`.
 */
export function toUpdateSectionBlockIntentDTOFromFormValues(args: {
  blockId: string;
  patch: Partial<SectionBlockFormValues>;
}): UpdateSectionBlockIntentDTO {
  const { blockId, patch } = args;

  return {
    blockId: String(blockId ?? "").trim(),
    patch: toSectionBlockPatch(patch),
  };
}

/**
 * Prépare l’intent de réordonnancement des blocks.
 */
export function normalizeReorderBlocksIntentDTO(
  values: ReorderBlocksIntentDTO,
): ReorderBlocksIntentDTO {
  return {
    orderedBlockIds: values.orderedBlockIds.map((id) =>
      String(id ?? "").trim(),
    ),
  };
}

/* -------------------------------------------------------------------------- */
/* Factories UI                                                               */
/* -------------------------------------------------------------------------- */

export function createEmptyColumn(): SectionColumnFormValues {
  return {
    id: createUiId(),
    cells: [createEmptyCell("richText")],
  };
}

export function createEmptyRow(args?: {
  columnsCount?: 1 | 2 | 3;
}): SectionRowFormValues {
  const columnsCount =
    args?.columnsCount === 2 || args?.columnsCount === 3
      ? args.columnsCount
      : 1;

  return {
    id: createUiId(),
    columnsCount,
    columns: normalizeColumns([], columnsCount),
  };
}

/**
 * Crée un block `Section` vide côté UI form.
 */
export function createEmptySectionBlock(args?: {
  name?: string;
  lcpPriority?: boolean;
  containerMode?: SectionBlockFormValues["containerMode"];
  rows?: ReadonlyArray<SectionRowFormValues>;
}): SectionBlockFormValues {
  return {
    name: normalizeName(args?.name),
    containerMode: normalizeContainerMode(args?.containerMode),
    lcpPriority: args?.lcpPriority ?? false,
    rows: normalizeRows(args?.rows),
  };
}
