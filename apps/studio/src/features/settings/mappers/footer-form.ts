/**
 * @file apps/studio/src/features/settings/mappers/footer-form.ts
 * @layer studio/features/settings/mappers
 *
 * @description
 * Studio footer settings mappers for form values, preview shape, and API intents.
 */

import type { FooterSettingsDTO } from "@compoz/core/domain/site/dto";
import type { FooterSettingsShape } from "@compoz/validation/site/settings/footer/footer";
import type { FooterFormValues } from "@compoz/validation/site/settings/footer/footer-form";
import type { UpdateFooterSettingsIntentDTO } from "@compoz/validation/site/settings/footer/footer-intents";

import { trimKeepEmpty } from "@compoz/ui/lib/form-utils";

export function toFooterFormValuesFromDTO(
  dto: FooterSettingsDTO,
): FooterFormValues {
  return {
    copyright: trimKeepEmpty(dto.copyright),
    showYear: Boolean(dto.showYear),
  };
}

export function toFooterSettingsShapeFromFormValues(
  values: FooterFormValues,
): FooterSettingsShape {
  return {
    copyright: values.copyright,
    showYear: values.showYear,
  };
}

export function normalizeFooterFormValues(
  values: FooterFormValues,
): FooterFormValues {
  return {
    copyright: trimKeepEmpty(values.copyright),
    showYear: Boolean(values.showYear),
  };
}

/** Builds a partial API intent while preserving PATCH semantics. */
export function toUpdateFooterIntentDTOFromFormValues(
  p: Partial<FooterFormValues>,
): UpdateFooterSettingsIntentDTO {
  const out: UpdateFooterSettingsIntentDTO = {};

  if ("copyright" in p) out.copyright = trimKeepEmpty(p.copyright);
  if ("showYear" in p) out.showYear = Boolean(p.showYear);

  return out;
}
