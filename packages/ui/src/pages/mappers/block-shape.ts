/**
 * @file packages/ui/src/pages/mappers/block-shape.ts
 * @layer ui/pages/mappers
 *
 * @description
 * Mappers "shared runtime" pour les blocks :
 * - DTO domaine -> Shape (consommée par preview + renderer public)
 * - FormValues (admin) -> Shape (pour pousser le draft au preview)
 *
 * Responsabilités :
 * - coercition/trim UI simple
 * - aucune logique métier
 * - aucune gestion du state (draft/published)
 *
 * @remarks
 * Ce fichier vit dans @compoz/ui car il est consommé par apps/site ET apps/studio.
 */

import type { BlockDTO } from "@compoz/core/domain/pages/dto";

import type {
  BlockShape,
  SectionBlockShape,
} from "@compoz/validation/pages/blocks/block";
import type { SectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

/* -------------------------------------------------------------------------- */
/* Types locaux                                                               */
/* -------------------------------------------------------------------------- */

type SectionRowFormValues = SectionBlockFormValues["rows"][number];
type SectionColumnFormValues = SectionRowFormValues["columns"][number];

/* -------------------------------------------------------------------------- */
/* Normalisations shared                                                      */
/* -------------------------------------------------------------------------- */

type ContainerMode = "contained" | "fullBleed";

function normalizeName(input: unknown): string {
  return typeof input === "string" ? input.trim() : "";
}

function normalizeContainerMode(input: unknown): ContainerMode {
  return input === "fullBleed" ? "fullBleed" : "contained";
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
    columns: normalizeColumns(row?.columns, columnsCount),
  };
}

function normalizeRows(
  rows: ReadonlyArray<SectionRowFormValues> | undefined,
): SectionRowFormValues[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(normalizeRow);
}

/**
 * Normalise des FormValues UI d'un SectionBlock.
 */
export function normalizeSectionBlockFormValuesShallow(
  values: SectionBlockFormValues,
): SectionBlockFormValues {
  return {
    ...values,
    name: normalizeName(values.name),
    containerMode: normalizeContainerMode(values.containerMode),
    lcpPriority: Boolean(values.lcpPriority),
    rows: normalizeRows(values.rows),
  };
}

/* -------------------------------------------------------------------------- */
/* FormValues -> Shape (preview/runtime)                                      */
/* -------------------------------------------------------------------------- */

/**
 * Convertit des valeurs de formulaire (RHF) en `SectionBlockShape`
 * consommé par la preview admin et le renderer public.
 */
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
    lcpPriority: normalized.lcpPriority,
    rows: normalized.rows as SectionBlockShape["rows"],
  };
}

/* -------------------------------------------------------------------------- */
/* DTO -> Shape (public/runtime)                                              */
/* -------------------------------------------------------------------------- */

export function toSectionBlockShapeFromDTO(
  block: BlockDTO,
): SectionBlockShape | null {
  if (block.type !== "section") return null;

  return {
    id: block.id,
    type: "section",
    name: normalizeName(block.name),
    containerMode: normalizeContainerMode(block.containerMode),
    lcpPriority:
      typeof block.lcpPriority === "boolean" ? block.lcpPriority : false,
    rows: Array.isArray(block.rows)
      ? (block.rows as SectionBlockShape["rows"])
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
