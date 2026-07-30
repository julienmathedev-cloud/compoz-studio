/**
 * @file apps/studio/src/features/pages/mappers/blocks-form.ts
 * @layer studio/features/pages/mappers
 *
 * @description
 * Studio block form mappers for DTO-to-RHF values, UI normalization, API intents, and empty UI factories.
 *
 * @remarks
 * - Keeps row, column, and cell collections present for form consumers.
 * - Normalizes ids, section options, and nested cells before validation or API intent creation.
 * - Does not own draft/published state; callers provide the content-state context.
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
  normalizeCellFormValues,
  toCellFormValuesForValidation,
  toCellFormValuesFromDTO,
} from "@compoz/studio/features/pages/mappers/cells-form";

type SectionBlockDTO = Extract<BlockDTO, { type: "section" }>;
type SectionRowDTO = SectionBlockDTO["rows"][number];
type SectionColumnDTO = SectionRowDTO["columns"][number];
type SectionRowFormValues = SectionBlockFormValues["rows"][number];
type SectionColumnFormValues = SectionRowFormValues["columns"][number];
type SectionRowReverseOnFormValues = SectionRowFormValues["reverseOn"];
type UpdateRowsBaseline = NonNullable<
  UpdateSectionBlockIntentDTO["changes"]["rows"]
>["baseline"];

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

function normalizeCssClassName(
  cssClassName: SectionBlockFormValues["cssClassName"] | undefined,
): SectionBlockFormValues["cssClassName"] {
  return String(cssClassName ?? "").trim();
}

function normalizeColumnId(id: string | undefined): string {
  const normalized = String(id ?? "").trim();
  return normalized.length > 0 ? normalized : createUiId();
}

function normalizeRowId(id: string | undefined): string {
  const normalized = String(id ?? "").trim();
  return normalized.length > 0 ? normalized : createUiId();
}

function normalizeRowReverseOn(
  reverseOn: Partial<SectionRowReverseOnFormValues> | undefined,
): SectionRowReverseOnFormValues {
  return {
    mobile: Boolean(reverseOn?.mobile),
    tablet: Boolean(reverseOn?.tablet),
    desktop: Boolean(reverseOn?.desktop),
  };
}

function normalizeColumn(
  column: SectionColumnFormValues | undefined,
): SectionColumnFormValues {
  return {
    id: normalizeColumnId(column?.id),
    cells: toMutable(column?.cells).map(normalizeCellFormValues),
  };
}

function normalizeColumnForValidation(
  column: SectionColumnFormValues | undefined,
): SectionColumnFormValues {
  return {
    id: normalizeColumnId(column?.id),
    cells: toMutable(column?.cells).map(toCellFormValuesForValidation),
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

function normalizeColumnsForValidation(
  columns: ReadonlyArray<SectionColumnFormValues> | undefined,
  columnsCount: 1 | 2 | 3,
): SectionColumnFormValues[] {
  const safeColumns = toMutable(columns).map(normalizeColumnForValidation);

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
    reverseOn: normalizeRowReverseOn(row?.reverseOn),
    columns: normalizeColumns(row?.columns, columnsCount),
  };
}

function normalizeRowForValidation(
  row: SectionRowFormValues | undefined,
): SectionRowFormValues {
  const columnsCount =
    row?.columnsCount === 2 || row?.columnsCount === 3 ? row.columnsCount : 1;

  return {
    id: normalizeRowId(row?.id),
    columnsCount,
    reverseOn: normalizeRowReverseOn(row?.reverseOn),
    columns: normalizeColumnsForValidation(row?.columns, columnsCount),
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

function normalizeRowsForValidation(
  rows: ReadonlyArray<SectionRowFormValues> | undefined,
): SectionRowFormValues[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [createEmptyRow()];
  }

  return toMutable(rows).map(normalizeRowForValidation);
}

// Domain DTO -> UI form values.

/** Converts a `BlockDTO` to section block form values with safe nested row/column/cell collections. */
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
        reverseOn: normalizeRowReverseOn(row.reverseOn),
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
    cssClassName: normalizeCssClassName(block.cssClassName),
    lcpPriority:
      typeof block.lcpPriority === "boolean" ? block.lcpPriority : false,
    rows: normalizeRows(rows),
  };
}

// UI form normalization.

export function normalizeSectionBlockFormValues(
  values: SectionBlockFormValues,
): SectionBlockFormValues {
  return {
    name: normalizeName(values.name),
    containerMode: normalizeContainerMode(values.containerMode),
    cssClassName: normalizeCssClassName(values.cssClassName),
    lcpPriority: Boolean(values.lcpPriority),
    rows: normalizeRows(values.rows),
  };
}

export function normalizeSectionBlockFormValuesForValidation(
  values: SectionBlockFormValues,
): SectionBlockFormValues {
  return {
    name: normalizeName(values.name),
    containerMode: normalizeContainerMode(values.containerMode),
    cssClassName: normalizeCssClassName(values.cssClassName),
    lcpPriority: Boolean(values.lcpPriority),
    rows: normalizeRowsForValidation(values.rows),
  };
}

// UI form values -> API intents.

/** Builds a create-section-block API intent from RHF form values. */
export function toCreateSectionBlockIntentDTOFromFormValues(args: {
  values: SectionBlockFormValues;
  expectedBlocksRevision: number;
  baselineOrder: ReadonlyArray<string>;
  baselineLcpPriorityBlockId: string | null;
}): CreateSectionBlockIntentDTO {
  const { values } = args;
  const normalized = normalizeSectionBlockFormValuesForValidation(values);

  return {
    expectedBlocksRevision: args.expectedBlocksRevision,
    baselineOrder: [...args.baselineOrder],
    baselineLcpPriorityBlockId: args.baselineLcpPriorityBlockId,
    placement: { kind: "end" },
    ...(normalized.name ? { name: normalized.name } : {}),
    containerMode: normalized.containerMode,
    cssClassName: normalized.cssClassName,
    lcpPriority: normalized.lcpPriority,
    rows: normalized.rows,
  };
}

/** Builds changes against the exact persisted block and normalized local form. */
export function toUpdateSectionBlockIntentDTOFromFormValues(args: {
  baselineBlock: BlockDTO;
  local: SectionBlockFormValues;
  expectedBlocksRevision: number;
  baselineLcpPriorityBlockId: string | null;
}): UpdateSectionBlockIntentDTO {
  const baselineBlock = args.baselineBlock;
  const baselineForm = toSectionBlockFormValuesFromDTO(baselineBlock);
  const local = normalizeSectionBlockFormValuesForValidation(args.local);
  const changes: UpdateSectionBlockIntentDTO["changes"] = {};
  if (baselineForm.name !== local.name) {
    changes.name = { baseline: baselineBlock.name, local: local.name };
  }
  if (baselineForm.containerMode !== local.containerMode) {
    changes.containerMode = {
      baseline: baselineBlock.containerMode,
      local: local.containerMode,
    };
  }
  if (baselineForm.cssClassName !== local.cssClassName) {
    changes.cssClassName = {
      baseline: baselineBlock.cssClassName,
      local: local.cssClassName || undefined,
    };
  }
  if (baselineForm.lcpPriority !== local.lcpPriority) {
    changes.lcpPriority = {
      baseline: baselineBlock.lcpPriority,
      local: local.lcpPriority,
    };
  }
  if (JSON.stringify(baselineForm.rows) !== JSON.stringify(local.rows)) {
    changes.rows = {
      baseline: baselineBlock.rows as unknown as UpdateRowsBaseline,
      local: local.rows,
    };
  }
  return {
    expectedBlocksRevision: args.expectedBlocksRevision,
    baselineLcpPriorityBlockId: args.baselineLcpPriorityBlockId,
    changes,
  };
}

/** Normalizes a block reorder intent before sending it to the API. */
export function normalizeReorderBlocksIntentDTO(
  values: ReorderBlocksIntentDTO,
): ReorderBlocksIntentDTO {
  return {
    expectedBlocksRevision: values.expectedBlocksRevision,
    baselineOrder: values.baselineOrder.map((id) => String(id ?? "").trim()),
    localOrder: values.localOrder.map((id) => String(id ?? "").trim()),
  };
}

// Empty UI factories.

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
    reverseOn: normalizeRowReverseOn(undefined),
    columns: normalizeColumns([], columnsCount),
  };
}

/** Creates an empty section block form value with safe defaults for nested rows. */
export function createEmptySectionBlock(args?: {
  name?: string;
  cssClassName?: string;
  lcpPriority?: boolean;
  containerMode?: SectionBlockFormValues["containerMode"];
  rows?: ReadonlyArray<SectionRowFormValues>;
}): SectionBlockFormValues {
  return {
    name: normalizeName(args?.name),
    containerMode: normalizeContainerMode(args?.containerMode),
    cssClassName: normalizeCssClassName(args?.cssClassName),
    lcpPriority: args?.lcpPriority ?? false,
    rows: normalizeRows(args?.rows),
  };
}
