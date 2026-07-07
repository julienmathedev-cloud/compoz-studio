/**
 * @file packages/ui/src/settings/mappers/footer-shape.ts
 * @layer ui/settings/mappers
 *
 * @description
 * Maps footer settings DTOs to stable runtime footer settings shapes shared by site rendering and Studio preview.
 *
 * @remarks
 * API intents and form-oriented normalization stay outside this boundary mapper.
 */

import type { FooterSettingsDTO } from "@compoz/core/domain/site/dto";
import type { FooterSettingsShape } from "@compoz/validation/site/settings/footer/footer";

export function toFooterSettingsShapeFromDTO(
  dto: FooterSettingsDTO | null | undefined,
): FooterSettingsShape {
  return {
    copyright: dto?.copyright ?? "",
    showYear: typeof dto?.showYear === "boolean" ? dto.showYear : false,
  };
}
