/**
 * @file apps/studio/src/features/settings/mappers/header-form.ts
 * @layer ui-mappers/site
 * @description
 * Mappers UI Header (studio forms) :
 * - DTO -> valeurs de formulaire RHF
 * - normalisation UI
 * - PATCH intent DTO pour l’API admin
 *
 * @remarks
 * - Pour la shape runtime (site/preview), utiliser le mapper shared
 *   `toHeaderSettingsShapeFromDTO`.
 */

import type { HeaderSettingsDTO } from "@compoz/core/domain/site/dto";
import type { HeaderSettingsShape } from "@compoz/validation/site/settings/header/header";
import type { HeaderFormValues } from "@compoz/validation/site/settings/header/header-form";
import type { UpdateHeaderSettingsIntentDTO } from "@compoz/validation/site/settings/header/header-intents";

import { asBool } from "@compoz/ui/lib/form-utils";
import { toHeaderSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/header-shape";

/* ----------------------- Domaine (DTO) -> UI (form values) ------------------ */

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

/**
 * FormValues -> Shape (contrat frontière)
 *
 * @remarks
 * - Utilisable côté studio (preview draft) si tu construis un draft à partir du form.
 * - Si tu pars d’un DTO, préfère `toHeaderSettingsShapeFromDTO`.
 */
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

/**
 * DTO -> Shape (re-export studio convenience)
 *
 * @remarks
 * Optionnel : utile si tu veux éviter d’importer `@compoz/ui/site/mappers/header-shape`
 * dans certains fichiers studio. Sinon tu peux supprimer ce wrapper.
 */
export function toHeaderSettingsShape(
  dto: HeaderSettingsDTO,
): HeaderSettingsShape {
  return toHeaderSettingsShapeFromDTO(dto);
}

/* ---------------------------- Normalisations UI ---------------------------- */

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

/* ------------------------------ UI -> PATCH (API) --------------------------- */

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
