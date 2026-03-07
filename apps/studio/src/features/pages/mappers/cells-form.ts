/**
 * @file apps/studio/src/features/pages/mappers/cells-form.ts
 * @layer ui/studio/pages/mappers
 *
 * @description
 * Mappers de formulaires studio pour les cells :
 * - factories UI (`createEmpty*`)
 * - normalisation (`ensureCellsLength`)
 * - DTO -> FormValues (en s’appuyant sur le mapper shared runtime)
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import { toCellShapeFromDTO } from "@compoz/ui/pages/mappers/cell-shape";
import type {
  CellFormValues,
  ImageEditorFormValues,
} from "@compoz/validation/pages/blocks/cells/cell-form";

/* -------------------------------------------------------------------------- */
/* Factories UI                                                               */
/* -------------------------------------------------------------------------- */

function createUiId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `ui_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function createEmptyImageEditor(): ImageEditorFormValues {
  return {
    id: createUiId(),
    src: "",
    alt: "",
    href: null,
    width: undefined,
    height: undefined,
  };
}

/**
 * Crée une cell vide “safe” pour un kind donné (UI-only).
 */
export function createEmptyCell(kind: CellFormValues["kind"]): CellFormValues {
  if (kind === "richText") {
    return { kind: "richText", content: "" };
  }

  if (kind === "image") {
    return { kind: "image", image: createEmptyImageEditor() };
  }

  if (kind === "carousel") {
    return { kind: "carousel", images: [createEmptyImageEditor()] };
  }

  return {
    kind: "gallery",
    linksEnabled: false,
    maxColumns: 3,
    images: [createEmptyImageEditor()],
  };
}

/* -------------------------------------------------------------------------- */
/* Domain -> UI (FormValues)                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Convertit une `CellDTO` en `FormValues` studio.
 *
 * @remarks
 * - Réutilise le mapper shared `toCellShapeFromDTO`,
 *   déjà aligné avec les types Zod-driven.
 */
export function toCellFormValuesFromDTO(cell: CellDTO): CellFormValues {
  return toCellShapeFromDTO(cell);
}

/* -------------------------------------------------------------------------- */
/* Normalisation (forms)                                                      */
/* -------------------------------------------------------------------------- */

export function ensureCellsLength(
  cells: ReadonlyArray<CellFormValues>,
  columns: 1 | 2 | 3,
): CellFormValues[] {
  const output = Array.from(cells ?? []).slice(0, columns);

  while (output.length < columns) {
    output.push(createEmptyCell("richText"));
  }

  return output;
}
