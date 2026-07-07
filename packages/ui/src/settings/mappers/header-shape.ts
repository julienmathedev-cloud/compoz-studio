/**
 * @file packages/ui/src/settings/mappers/header-shape.ts
 * @layer ui/settings/mappers
 *
 * @description
 * Maps header settings DTOs to stable runtime header settings shapes shared by site rendering and Studio preview.
 *
 * @remarks
 * API intents and form-oriented normalization stay outside this boundary mapper.
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
