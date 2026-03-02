/**
 * @file packages/ui/src/pages/mappers/cell-shape.ts
 * @layer ui-mappers/pages
 *
 * @description
 * Mapper "shared runtime" pour les cells :
 * - DTO domaine -> shape frontier (utilisée par renderer public + preview)
 *
 * @remarks
 * - Pas de factories UI (ça = studio/forms)
 * - Pas de normalisation de longueur (ça = studio/forms)
 * - Se limite à copier/coercer pour éviter les mutations involontaires.
 */

import type { CellDTO } from "@compoz/core/domain/pages/dto";
import type { CellFormValues } from "@compoz/validation/pages/blocks/cells/cell-form";

/**
 * Convertit une Cell du domaine en shape "frontière" (safe pour runtime) :
 * - copie les tableaux readonly → tableaux mutables
 * - copie les objets image (évite mutations involontaires)
 * - coercit `null` → `undefined` sur width/height quand nécessaire
 *
 * @remarks
 * On utilise ici `CellFormValues` car c’est déjà ton type frontière stable
 * (schema-driven) et il convient au renderer/preview.
 */
export function toCellShapeFromDTO(cell: CellDTO): CellFormValues {
  if (cell.kind === "richText") {
    return { kind: "richText", content: cell.content };
  }

  if (cell.kind === "image") {
    return {
      kind: "image",
      image: {
        ...cell.image,
        width: cell.image.width ?? undefined,
        height: cell.image.height ?? undefined,
      },
      variant: cell.variant,
    };
  }

  if (cell.kind === "gallery") {
    return {
      kind: "gallery",
      linksEnabled: cell.linksEnabled,
      maxColumns: cell.maxColumns,
      images: [...cell.images].map((img) => ({
        ...img,
        width: img.width ?? undefined,
        height: img.height ?? undefined,
      })),
    };
  }

  // carousel
  return {
    kind: "carousel",
    images: [...cell.images].map((img) => ({
      ...img,
      width: img.width ?? undefined,
      height: img.height ?? undefined,
    })),
  };
}
