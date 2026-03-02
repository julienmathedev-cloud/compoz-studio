/**
 * @file packages/ui/src/settings/mappers/header-shape.ts
 * @layer ui-mappers/site
 *
 * @description
 * Mapper "shared runtime" Header :
 * - DTO domaine -> shape frontière stable (utilisée par site + studio preview)
 *
 * @remarks
 * - Ici : uniquement ce qui est utile au runtime (renderer/public/preview).
 * - Pas d’intents API ni de normalisation orientée formulaire.
 */

import type { HeaderSettingsDTO } from "@compoz/core/domain/site/dto";
import type { HeaderSettingsShape } from "@compoz/validation/site/settings/header/header";

export function toHeaderSettingsShapeFromDTO(
  dto: HeaderSettingsDTO | null | undefined,
): HeaderSettingsShape {
  return {
    showLogo: Boolean(dto?.showLogo),
    showSiteName: Boolean(dto?.showSiteName),
    sticky: Boolean(dto?.sticky),
    blur: Boolean(dto?.blur),
    swapPrimaryAndSocial: Boolean(dto?.swapPrimaryAndSocial),
  };
}
