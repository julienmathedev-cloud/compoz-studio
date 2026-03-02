/**
 * @file packages/ui/src/pages/mappers/block-shape.ts
 * @layer ui-mappers/pages
 *
 * @description
 * Mappers "shared runtime" pour les blocks :
 * - DTO domaine -> Shape (consommée par preview + renderer public)
 * - FormValues (admin) -> Shape (pour pousser le draft au preview)
 *
 * Responsabilités :
 * - coercition/trim UI simple (via normalize*)
 * - aucune logique métier
 * - aucune gestion du state (draft/published)
 *
 * @remarks
 * Ce fichier vit dans @compoz/ui car il est consommé par apps/site ET apps/studio.
 */

import type { BlockDTO } from "@compoz/core/domain/pages/dto";

import type {
  BlockShape,
  LayoutSectionBlockShape,
} from "@compoz/validation/pages/blocks/block";
import type { LayoutSectionBlockFormValues } from "@compoz/validation/pages/blocks/block-form";

/* -------------------------------------------------------------------------- */
/* Normalisations shared                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Normalise des FormValues UI d'un LayoutSectionBlock.
 *
 * @remarks
 * - title ALWAYS present; on trim uniquement le text
 * - containerMode coercé sur "contained" | "fullBleed"
 * - cells: normalisées à longueur = columns (via ensureCellsLength côté studio/forms)
 *
 * ⚠️ Note:
 * - `ensureCellsLength` et `createEmptyCell` sont des concerns "forms".
 *   Ici on suppose que `values.cells` est déjà cohérent OU géré côté studio.
 */
export function normalizeLayoutSectionBlockFormValuesShallow(
  values: LayoutSectionBlockFormValues,
): LayoutSectionBlockFormValues {
  return {
    ...values,
    containerMode:
      values.containerMode === "fullBleed" ? "fullBleed" : "contained",
    titleEnabled: Boolean(values.titleEnabled),
    title: normalizeTitle(values.title),
    lcpPriority: Boolean(values.lcpPriority),
    // cells: laissé tel quel (forms concern)
    cells: values.cells ?? [],
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
/* FormValues -> Shape (preview/runtime)                                      */
/* -------------------------------------------------------------------------- */

/**
 * Convertit des valeurs de formulaire (RHF) en `LayoutSectionBlockShape`
 * consommé par la preview admin et le renderer public.
 */
export function toLayoutSectionBlockShapeFromFormValues(args: {
  blockId: string;
  values: LayoutSectionBlockFormValues;
}): LayoutSectionBlockShape {
  const { blockId, values } = args;

  // Normalisation "shallow" (forms gèrent la cohérence cells/columns)
  const normalized = normalizeLayoutSectionBlockFormValuesShallow(values);

  return {
    id: blockId,
    type: "layoutSection",
    layout: { columns: normalized.columns },
    containerMode: normalized.containerMode,
    titleEnabled: normalized.titleEnabled,
    title: normalized.title,
    lcpPriority: normalized.lcpPriority,
    cells: normalized.cells as LayoutSectionBlockShape["cells"],
  };
}

/* -------------------------------------------------------------------------- */
/* DTO -> Shape (public/runtime)                                              */
/* -------------------------------------------------------------------------- */

export function toLayoutSectionBlockShapeFromDTO(
  block: BlockDTO,
): LayoutSectionBlockShape | null {
  if (block.type !== "layoutSection") return null;

  return {
    id: block.id,
    type: "layoutSection",
    layout: { columns: block.layout?.columns ?? 1 },
    containerMode:
      block.containerMode === "fullBleed" ? "fullBleed" : "contained",
    titleEnabled:
      typeof block.titleEnabled === "boolean" ? block.titleEnabled : false,
    title: {
      text: typeof block.title?.text === "string" ? block.title.text : "",
      display: block.title?.display === "sr-only" ? "sr-only" : "visible",
    },
    lcpPriority:
      typeof block.lcpPriority === "boolean" ? block.lcpPriority : false,
    cells: Array.isArray(block.cells)
      ? (block.cells as LayoutSectionBlockShape["cells"])
      : [],
  };
}

export function toBlockShapeFromDTO(dto: BlockDTO): BlockShape | null {
  switch (dto.type) {
    case "layoutSection":
      return toLayoutSectionBlockShapeFromDTO(dto);
    default:
      return null;
  }
}
