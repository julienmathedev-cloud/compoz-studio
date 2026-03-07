/**
 * @file packages/ui/src/settings/mappers/legal-menu-shape.ts
 * @layer ui/settings/mappers
 *
 * @description
 * Mapper "shared runtime" LegalMenu :
 * - DTO domaine -> LegalMenuSettingsShape (frontière stable)
 *
 * @remarks
 * - Utilisé par le renderer public (site) ET par la preview/renderer côté studio.
 * - Ici, on ne gère ni RHF, ni intents API.
 * - On ne fait pas de normalisation "draft" (toInternalDraft/toExternalDraft) :
 *   on convertit juste le DTO en shape frontière (strings).
 */

import type {
  LegalMenuItemDTO,
  LegalMenuSettingsDTO,
} from "@compoz/core/domain/site/dto";

import type {
  LegalMenuItemShape,
  LegalMenuSettingsShape,
} from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";

import { trimKeepEmpty } from "@compoz/ui/lib/form-utils";

/** DTO -> Shape : item (renderer). */
function toLegalMenuItemShapeFromDTO(it: LegalMenuItemDTO): LegalMenuItemShape {
  return {
    label: trimKeepEmpty(it.label),
    // DTO attendu string | null | undefined. Si jamais "dirty", on force string de façon best-effort.
    href: trimKeepEmpty(
      typeof it.href === "string" ? it.href : String(it.href ?? ""),
    ),
    newTab: typeof it.newTab === "boolean" ? it.newTab : false,
  };
}

/**
 * Domaine (DTO) -> Renderer (Shape)
 * Contrat : retourne une shape stable pour le renderer (arrays mutables).
 */
export function toLegalMenuSettingsShapeFromDTO(
  dto: LegalMenuSettingsDTO | null | undefined,
): LegalMenuSettingsShape {
  return {
    items: (dto?.items ?? []).map(toLegalMenuItemShapeFromDTO),
  };
}
