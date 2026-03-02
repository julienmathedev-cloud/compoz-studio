/**
 * @file packages/ui/src/settings/mappers/footer-shape.ts
 * @layer ui-mappers/site
 *
 * @description
 * Mapper "shared runtime" Footer :
 * - DTO domaine -> shape frontière stable (utilisée par site + studio preview)
 *
 * @remarks
 * - Ici : uniquement ce qui est utile au runtime (renderer/public/preview).
 * - Pas d’intents API ni de normalisation orientée formulaire.
 */

import type { FooterSettingsDTO } from "@compoz/core/domain/site/dto";
import type { FooterSettingsShape } from "@compoz/validation/site/settings/footer/footer";

export function toFooterSettingsShapeFromDTO(
  dto: FooterSettingsDTO | null | undefined,
): FooterSettingsShape {
  return {
    copyright: dto?.copyright ?? "",
    showYear: Boolean(dto?.showYear),
  };
}
