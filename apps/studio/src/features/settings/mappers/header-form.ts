/**
 * @file apps/studio/src/features/settings/mappers/header-form.ts
 * @layer studio/features/settings/mappers
 *
 * @description
 * Studio header settings mappers for form values, preview shape, and API intents.
 */

import type { HeaderSettingsDTO } from "@compoz/core/domain/site/dto";
import type { HeaderSettingsShape } from "@compoz/validation/site/settings/header/header";
import type { HeaderFormValues } from "@compoz/validation/site/settings/header/header-form";
import type { UpdateHeaderSettingsIntentDTO } from "@compoz/validation/site/settings/header/header-intents";

import { asBool } from "@compoz/ui/lib/form-utils";
import { toHeaderSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/header-shape";

export function toHeaderFormValuesFromDTO(
  dto: HeaderSettingsDTO,
): HeaderFormValues {
  return {
    showLogo: asBool(dto.showLogo),
    showSiteName: asBool(dto.showSiteName),
    sticky: asBool(dto.sticky),
    blur: asBool(dto.blur),
    swapPrimaryAndSocial: asBool(dto.swapPrimaryAndSocial),
  };
}

export function toHeaderSettingsShapeFromFormValues(
  values: HeaderFormValues,
): HeaderSettingsShape {
  return {
    showLogo: asBool(values.showLogo),
    showSiteName: asBool(values.showSiteName),
    sticky: asBool(values.sticky),
    blur: asBool(values.blur),
    swapPrimaryAndSocial: asBool(values.swapPrimaryAndSocial),
  };
}

/** Re-exports the shared DTO-to-runtime-shape mapper for Studio callers. */
export function toHeaderSettingsShape(
  dto: HeaderSettingsDTO,
): HeaderSettingsShape {
  return toHeaderSettingsShapeFromDTO(dto);
}

export function normalizeHeaderFormValues(
  values: HeaderFormValues,
): HeaderFormValues {
  return {
    showLogo: asBool(values.showLogo),
    showSiteName: asBool(values.showSiteName),
    sticky: asBool(values.sticky),
    blur: asBool(values.blur),
    swapPrimaryAndSocial: asBool(values.swapPrimaryAndSocial),
  };
}

/** Builds a partial API intent while preserving PATCH semantics. */
export function toUpdateHeaderIntentDTOFromFormValues(
  p: Partial<HeaderFormValues>,
): UpdateHeaderSettingsIntentDTO {
  const out: UpdateHeaderSettingsIntentDTO = {};

  if ("showLogo" in p) out.showLogo = asBool(p.showLogo);
  if ("showSiteName" in p) out.showSiteName = asBool(p.showSiteName);
  if ("sticky" in p) out.sticky = asBool(p.sticky);
  if ("blur" in p) out.blur = asBool(p.blur);
  if ("swapPrimaryAndSocial" in p)
    out.swapPrimaryAndSocial = asBool(p.swapPrimaryAndSocial);

  return out;
}
