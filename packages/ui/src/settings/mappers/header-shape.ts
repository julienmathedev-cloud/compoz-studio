/**
 * @file packages/ui/src/settings/mappers/header-shape.ts
 * @layer ui/settings/mappers
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
    showLogo: typeof dto?.showLogo === "boolean" ? dto.showLogo : false,
    showSiteName:
      typeof dto?.showSiteName === "boolean" ? dto.showSiteName : false,
    sticky: typeof dto?.sticky === "boolean" ? dto.sticky : false,
    blur: typeof dto?.blur === "boolean" ? dto.blur : false,
    swapPrimaryAndSocial:
      typeof dto?.swapPrimaryAndSocial === "boolean"
        ? dto.swapPrimaryAndSocial
        : false,
  };
}
