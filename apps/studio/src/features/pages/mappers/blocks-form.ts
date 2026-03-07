/**
 * @file apps/studio/src/features/pages/mappers/blocks-form.ts
 * @layer ui/studio/pages/mappers
 *
 * @description
 * Mappers de formulaires studio pour les blocks :
 * - DTO domaine -> FormValues RHF
 * - normalisations UI (coercitions + cohérence cells / columns)
 * - FormValues -> Intent DTO (API studio)
 * - factories UI (`createEmpty*`)
 *
 * @remarks
 * - Gère uniquement la forme UI et les coercitions légères.
 * - Aucune logique métier.
 * - Aucune gestion de state (draft / published).
 */

import type { BlockDTO } from "@compoz/core/domain/pages/dto";
import type { LayoutSectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";
import type {
  CreateLayoutSectionBlockIntentDTO,
  ReorderBlocksIntentDTO,
  UpdateLayoutSectionBlockIntentDTO,
} from "@compoz/validation/pages/blocks/block-intents";

import {
  createEmptyCell,
  ensureCellsLength,
  toCellFormValuesFromDTO,
} from "@compoz/studio/features/pages/mappers/cells-form";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeContainerMode(
  containerMode: LayoutSectionBlockFormValues["containerMode"] | undefined,
): LayoutSectionBlockFormValues["containerMode"] {
  return containerMode === "fullBleed" ? "fullBleed" : "contained";
}

function normalizeTitle(
  title: LayoutSectionBlockFormValues["title"] | undefined,
): LayoutSectionBlockFormValues["title"] {
  const text = typeof title?.text === "string" ? title.text.trim() : "";
  const display = title?.display === "sr-only" ? "sr-only" : "visible";

  return { text, display };
}

/* -------------------------------------------------------------------------- */
/* Domaine (DTO) -> UI (form values)                                          */
/* -------------------------------------------------------------------------- */

/**
 * Convertit un `BlockDTO` en `LayoutSectionBlockFormValues`.
 *
 * @remarks
 * - Si le block n’est pas `layoutSection`, retourne une forme minimale safe.
 * - `cells` est toujours un array côté UI.
 * - V0.5 : `title` est toujours présent ; `titleEnabled` pilote l’affichage.
 */
export function toLayoutSectionBlockFormValuesFromDTO(
  block: BlockDTO,
): LayoutSectionBlockFormValues {
  if (block.type !== "layoutSection") {
    return createEmptyLayoutSectionBlock();
  }

  const columns = block.layout?.columns ?? 1;

  const cells = Array.isArray(block.cells)
    ? block.cells.map(toCellFormValuesFromDTO)
    : [];

  return {
    columns,
    containerMode: normalizeContainerMode(block.containerMode),
    titleEnabled:
      typeof block.titleEnabled === "boolean" ? block.titleEnabled : false,
    title: normalizeTitle(block.title),
    lcpPriority:
      typeof block.lcpPriority === "boolean" ? block.lcpPriority : false,
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
    containerMode: normalizeContainerMode(values.containerMode),
    titleEnabled: Boolean(values.titleEnabled),
    title: normalizeTitle(values.title),
    lcpPriority: Boolean(values.lcpPriority),
    cells: ensureCellsLength(values.cells ?? [], values.columns),
  };
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
  patch: Partial<LayoutSectionBlockFormValues>,
): UpdateLayoutSectionBlockIntentDTO["patch"] {
  const output: UpdateLayoutSectionBlockIntentDTO["patch"] = {};

  if ("columns" in patch && patch.columns !== undefined) {
    output.columns = patch.columns;
  }

  if ("titleEnabled" in patch && patch.titleEnabled !== undefined) {
    output.titleEnabled = Boolean(patch.titleEnabled);
  }

  if ("title" in patch && patch.title !== undefined) {
    output.title = normalizeTitle(patch.title);
  }

  if ("containerMode" in patch && patch.containerMode !== undefined) {
    output.containerMode = normalizeContainerMode(patch.containerMode);
  }

  if ("lcpPriority" in patch && patch.lcpPriority !== undefined) {
    output.lcpPriority = Boolean(patch.lcpPriority);
  }

  if ("cells" in patch && patch.cells !== undefined) {
    output.cells = patch.cells;
  }

  return output;
}

/**
 * Construit l’intent de mise à jour d’un `LayoutSectionBlock`.
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
 * Prépare l’intent de réordonnancement des blocks.
 */
export function normalizeReorderBlocksIntentDTO(
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
 * Crée un bloc `LayoutSection` vide côté UI form.
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
    containerMode: normalizeContainerMode(args?.containerMode),
    titleEnabled: args?.titleEnabled ?? false,
    title: normalizeTitle(args?.title),
    lcpPriority: args?.lcpPriority ?? false,
    cells,
  };
}
