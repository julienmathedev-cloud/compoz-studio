/**
 * @file packages/ui/src/settings/mappers/legal-menu-shape.ts
 * @layer ui/settings/mappers
 *
 * @description
 * Maps legal menu settings DTOs to stable runtime legal menu settings shapes shared by site rendering and Studio preview.
 *
 * @remarks
 * API intents and draft/form-oriented normalization stay outside this boundary mapper.
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

function toLegalMenuItemShapeFromDTO(it: LegalMenuItemDTO): LegalMenuItemShape {
  return {
    id: trimKeepEmpty(String(it.id ?? "")),
    label: trimKeepEmpty(it.label),
    // Defensive fallback for unexpected dirty DTO values.
    href: trimKeepEmpty(
      typeof it.href === "string" ? it.href : String(it.href ?? ""),
    ),
    newTab: typeof it.newTab === "boolean" ? it.newTab : false,
  };
}

export function toLegalMenuSettingsShapeFromDTO(
  dto: LegalMenuSettingsDTO | null | undefined,
): LegalMenuSettingsShape {
  return {
    items: (dto?.items ?? []).map(toLegalMenuItemShapeFromDTO),
  };
}
