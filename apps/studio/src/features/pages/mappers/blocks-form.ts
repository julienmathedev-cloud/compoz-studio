/**
 * @file apps/studio/src/features/pages/mappers/blocks-form.ts
 * @layer ui-mappers/pages
 *
 * @description
 * Mappers "forms admin" dashboard pour les blocks :
 * - DTO domaine -> FormValues RHF
 * - Normalisations UI (coercitions + cohérence cells/columns)
 * - FormValues -> Intent DTO (API admin)
 * - Factories UI (createEmpty*)
 *
 * Responsabilités :
 * - trimming / coercition UI
 * - cohérence de structure pour RHF
 * - aucune logique métier
 * - aucune gestion du state (draft/published)
 */

import type { BlockDTO } from "@compoz/core/domain/pages/dto";

import {
  createEmptyCell,
  ensureCellsLength,
  toCellFormValuesFromDTO,
} from "@compoz/studio/features/pages/mappers/cells-form";

import type { LayoutSectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type {
  CreateLayoutSectionBlockIntentDTO,
  ReorderBlocksIntentDTO,
  UpdateLayoutSectionBlockIntentDTO,
} from "@compoz/validation/pages/blocks/block-intents";

/* -------------------------------------------------------------------------- */
/* Domaine (DTO) -> UI (form values)                                          */
/* -------------------------------------------------------------------------- */

/**
 * Convertit un `BlockDTO` en `LayoutSectionBlockFormValues`.
 *
 * @remarks
 * - Si le block n’est pas `layoutSection`, retourne une forme minimale safe.
 * - `cells` est toujours un array côté UI.
 * - V0.5 : `title` est ALWAYS present, `titleEnabled` pilote l’affichage uniquement.
 */
export function toLayoutSectionBlockFormValuesFromDTO(
  block: BlockDTO,
): LayoutSectionBlockFormValues {
  if (block.type !== "layoutSection") {
    return createEmptyLayoutSectionBlock();
  }

  const columns = block.layout?.columns ?? 1;

  const containerMode =
    block.containerMode === "fullBleed" ? "fullBleed" : "contained";

  const cells = Array.isArray(block.cells)
    ? block.cells.map(toCellFormValuesFromDTO)
    : [];

  const titleEnabled =
    typeof block.titleEnabled === "boolean" ? block.titleEnabled : false;

  const title = {
    text: typeof block.title?.text === "string" ? block.title.text : "",
    display: block.title?.display === "sr-only" ? "sr-only" : "visible",
  } as const;

  const lcpPriority =
    typeof block.lcpPriority === "boolean" ? block.lcpPriority : false;

  return {
    columns,
    containerMode,
    titleEnabled,
    title,
    lcpPriority,
    cells: ensureCellsLength(cells, columns),
  };
}

/* -------------------------------------------------------------------------- */
/* Normalisations UI (forms)                                                  */
/* -------------------------------------------------------------------------- */

export function normalizeLayoutSectionBlockFormValues(
  values: LayoutSectionBlockFormValues,
): LayoutSectionBlockFormValues {
  return {
    ...values,
    containerMode:
      values.containerMode === "fullBleed" ? "fullBleed" : "contained",
    titleEnabled: Boolean(values.titleEnabled),
    title: normalizeTitle(values.title),
    lcpPriority: Boolean(values.lcpPriority),
    cells: ensureCellsLength(values.cells ?? [], values.columns),
  };
}

function normalizeTitle(
  title: LayoutSectionBlockFormValues["title"],
): LayoutSectionBlockFormValues["title"] {
  const text = typeof title?.text === "string" ? title.text.trim() : "";
  const display = title?.display === "sr-only" ? "sr-only" : "visible";
  return { text, display };
}

/* -------------------------------------------------------------------------- */
/* UI -> INTENTS (API)                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Construit le DTO d’intent de création d’un `LayoutSectionBlock`
 * à partir des FormValues UI (RHF).
 */
export function toCreateLayoutSectionBlockIntentDTOFromFormValues(args: {
  values: LayoutSectionBlockFormValues;
  insertAt?: number;
}): CreateLayoutSectionBlockIntentDTO {
  const { values, insertAt } = args;
  const normalized = normalizeLayoutSectionBlockFormValues(values);

  return {
    columns: normalized.columns,
    containerMode: normalized.containerMode,
    insertAt,
    titleEnabled: normalized.titleEnabled,
    title: normalized.title,
    lcpPriority: normalized.lcpPriority,
    cells: normalized.cells,
  };
}

function toLayoutSectionBlockPatch(
  p: Partial<LayoutSectionBlockFormValues>,
): UpdateLayoutSectionBlockIntentDTO["patch"] {
  const out: UpdateLayoutSectionBlockIntentDTO["patch"] = {};

  if ("columns" in p && p.columns !== undefined) out.columns = p.columns;

  if ("titleEnabled" in p && p.titleEnabled !== undefined) {
    out.titleEnabled = Boolean(p.titleEnabled);
  }
  if ("title" in p && p.title !== undefined) {
    out.title = normalizeTitle(p.title);
  }

  if ("containerMode" in p && p.containerMode !== undefined) {
    out.containerMode = p.containerMode;
  }

  if ("lcpPriority" in p && p.lcpPriority !== undefined) {
    out.lcpPriority = Boolean(p.lcpPriority);
  }

  if ("cells" in p && p.cells !== undefined) out.cells = p.cells;

  return out;
}

/**
 * Construit l’intent de mise à jour d’un LayoutSectionBlock.
 */
export function toUpdateLayoutSectionBlockIntentDTOFromFormValues(args: {
  blockId: string;
  patch: Partial<LayoutSectionBlockFormValues>;
}): UpdateLayoutSectionBlockIntentDTO {
  const { blockId, patch } = args;

  return {
    blockId,
    patch: toLayoutSectionBlockPatch(patch),
  };
}

/**
 * Prépare l’intent de reorder des blocks.
 */
export function normalizedReorderBlocksIntentDTO(
  values: ReorderBlocksIntentDTO,
): ReorderBlocksIntentDTO {
  return {
    orderedBlockIds: values.orderedBlockIds,
  };
}

/* -------------------------------------------------------------------------- */
/* Factories UI                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Permet de créer un bloc LayoutSection vide (UI form).
 */
export function createEmptyLayoutSectionBlock(args?: {
  columns?: 1 | 2 | 3;
  titleEnabled?: boolean;
  title?: LayoutSectionBlockFormValues["title"];
  lcpPriority?: boolean;
  containerMode?: LayoutSectionBlockFormValues["containerMode"];
}): LayoutSectionBlockFormValues {
  const columns = args?.columns ?? 1;

  const cells = ensureCellsLength([createEmptyCell("richText")], columns);

  return {
    columns,
    containerMode: args?.containerMode ?? "contained",
    titleEnabled: args?.titleEnabled ?? false,
    title: {
      text: args?.title?.text?.trim?.() ?? "",
      display: args?.title?.display === "sr-only" ? "sr-only" : "visible",
    },
    lcpPriority: args?.lcpPriority ?? false,
    cells,
  };
}
