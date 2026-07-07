/**
 * @file packages/ui/src/pages/mappers/block-shape.ts
 * @layer ui/pages/mappers
 * @description Maps block DTOs and admin form values to runtime block shapes.
 * @remarks
 * Shared by site rendering and Studio preview; normalization stays UI-only and contains no business state handling.
 */

import type { BlockDTO } from "@compoz/core/domain/pages/dto";

import type {
  BlockRowReverseOnShape,
  BlockShape,
  SectionBlockShape,
} from "@compoz/validation/pages/blocks/block";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

type SectionRowFormValues = SectionBlockFormValues["rows"][number];
type SectionColumnFormValues = SectionRowFormValues["columns"][number];

type ContainerMode = "contained" | "fullBleed";

function normalizeName(input: unknown): string {
  return typeof input === "string" ? input.trim() : "";
}

function normalizeContainerMode(input: unknown): ContainerMode {
  return input === "fullBleed" ? "fullBleed" : "contained";
}

function normalizeCssClassName(input: unknown): string | undefined {
  const trimmed = typeof input === "string" ? input.trim() : "";
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeReverseOn(input: unknown): BlockRowReverseOnShape {
  const value =
    input && typeof input === "object" && !Array.isArray(input)
      ? (input as Partial<BlockRowReverseOnShape>)
      : undefined;

  return {
    mobile: Boolean(value?.mobile),
    tablet: Boolean(value?.tablet),
    desktop: Boolean(value?.desktop),
  };
}

function normalizeColumn(
  column: SectionColumnFormValues | undefined,
): SectionColumnFormValues {
  return {
    id: String(column?.id ?? "").trim(),
    cells: Array.isArray(column?.cells) ? [...column.cells] : [],
  };
}

function normalizeColumns(
  columns: ReadonlyArray<SectionColumnFormValues> | undefined,
  columnsCount: 1 | 2 | 3,
): SectionColumnFormValues[] {
  const safeColumns = Array.isArray(columns)
    ? columns.map(normalizeColumn)
    : [];

  return safeColumns.slice(0, columnsCount);
}

function normalizeRow(
  row: SectionRowFormValues | undefined,
): SectionRowFormValues {
  const columnsCount =
    row?.columnsCount === 2 || row?.columnsCount === 3 ? row.columnsCount : 1;

  return {
    id: String(row?.id ?? "").trim(),
    columnsCount,
    reverseOn: normalizeReverseOn(row?.reverseOn),
    columns: normalizeColumns(row?.columns, columnsCount),
  };
}

function normalizeRows(
  rows: ReadonlyArray<SectionRowFormValues> | undefined,
): SectionRowFormValues[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(normalizeRow);
}

export function normalizeSectionBlockFormValuesShallow(
  values: SectionBlockFormValues,
): SectionBlockFormValues {
  return {
    ...values,
    name: normalizeName(values.name),
    containerMode: normalizeContainerMode(values.containerMode),
    cssClassName: normalizeCssClassName(values.cssClassName),
    lcpPriority: Boolean(values.lcpPriority),
    rows: normalizeRows(values.rows),
  };
}

export function toSectionBlockShapeFromFormValues(args: {
  blockId: string;
  values: SectionBlockFormValues;
}): SectionBlockShape {
  const { blockId, values } = args;

  const normalized = normalizeSectionBlockFormValuesShallow(values);

  return {
    id: String(blockId ?? "").trim(),
    type: "section",
    name: normalized.name,
    containerMode: normalized.containerMode,
    cssClassName: normalized.cssClassName,
    lcpPriority: normalized.lcpPriority,
    rows: normalized.rows as SectionBlockShape["rows"],
  };
}

export function toSectionBlockShapeFromDTO(
  block: BlockDTO,
): SectionBlockShape | null {
  if (block.type !== "section") return null;

  return {
    id: block.id,
    type: "section",
    name: normalizeName(block.name),
    containerMode: normalizeContainerMode(block.containerMode),
    cssClassName: normalizeCssClassName(block.cssClassName),
    lcpPriority:
      typeof block.lcpPriority === "boolean" ? block.lcpPriority : false,
    rows: Array.isArray(block.rows)
      ? block.rows.map((row) => ({
          ...row,
          reverseOn: normalizeReverseOn(row?.reverseOn),
        }))
      : [],
  };
}

export function toBlockShapeFromDTO(dto: BlockDTO): BlockShape | null {
  switch (dto.type) {
    case "section":
      return toSectionBlockShapeFromDTO(dto);
    default:
      return null;
  }
}
