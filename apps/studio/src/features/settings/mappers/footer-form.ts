/**
 * @file apps/studio/src/features/settings/mappers/footer-form.ts
 * @layer ui-mappers/studio/site
 * @description
 * Mappers UI Footer (studio forms) :
 * - DTO -> valeurs de formulaire RHF
 * - normalisation UI
 * - PATCH intent DTO pour l’API studio
 *
 * @remarks
 * - Pour la shape runtime (site/preview), utiliser le mapper shared
 *   `toFooterSettingsShapeFromDTO`.
 */

import type { FooterSettingsDTO } from "@compoz/core/domain/site/dto";
import type { FooterSettingsShape } from "@compoz/validation/site/settings/footer/footer";
import type { FooterFormValues } from "@compoz/validation/site/settings/footer/footer-form";
import type { UpdateFooterSettingsIntentDTO } from "@compoz/validation/site/settings/footer/footer-intents";

import { trimKeepEmpty } from "@compoz/ui/lib/form-utils";
import { toFooterSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/footer-shape";

/* ----------------------- Domaine (DTO) -> UI (form values) ------------------ */

export function toFooterFormValuesFromDTO(
  dto: FooterSettingsDTO,
): FooterFormValues {
  return {
    copyright: trimKeepEmpty(dto.copyright),
    showYear: Boolean(dto.showYear),
  };
}

/**
 * FormValues -> Shape (contrat frontière)
 *
 * @remarks
 * - Utilisable côté studio (preview draft) si tu construis un draft à partir du form.
 * - Si tu pars d’un DTO, préfère `toFooterSettingsShapeFromDTO`.
 */
export function toFooterSettingsShapeFromFormValues(
  values: FooterFormValues,
): FooterSettingsShape {
  return {
    copyright: values.copyright,
    showYear: values.showYear,
  };
}

/**
 * DTO -> Shape (re-export studio convenience)
 *
 * @remarks
 * Si tu veux éviter d’importer depuis le package ui dans certains fichiers studio.
 * Sinon tu peux supprimer ce wrapper et importer direct `@compoz/ui/site/mappers/footer-shape`.
 */
export function toFooterSettingsShape(
  dto: FooterSettingsDTO,
): FooterSettingsShape {
  return toFooterSettingsShapeFromDTO(dto);
}

/* ---------------------------- Normalisations UI ---------------------------- */

export function normalizeFooterFormValues(
  values: FooterFormValues,
): FooterFormValues {
  return {
    copyright: trimKeepEmpty(values.copyright),
    showYear: Boolean(values.showYear),
  };
}

/* ------------------------------ UI -> PATCH (API) --------------------------- */

export function toUpdateFooterIntentDTOFromFormValues(
  p: Partial<FooterFormValues>,
): UpdateFooterSettingsIntentDTO {
  const out: UpdateFooterSettingsIntentDTO = {};

  if ("copyright" in p) out.copyright = trimKeepEmpty(p.copyright);
  if ("showYear" in p) out.showYear = Boolean(p.showYear);

  return out;
}
