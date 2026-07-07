/**
 * @file apps/studio/src/features/settings/mappers/social-form.ts
 * @layer studio/features/settings/mappers
 *
 * @description
 * Studio social settings mappers for form values, preview shape, and API intents.
 */

import type { SocialSettingsDTO } from "@compoz/core/domain/site/dto";

import type { SocialFormValues } from "@compoz/validation/site/settings/social/social-form";
import type { UpdateSocialSettingsIntentDTO } from "@compoz/validation/site/settings/social/social-intents";

import { trimKeepEmpty } from "@compoz/ui/lib/form-utils";
import { toSocialSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/social-shape";

export function toSocialFormValuesFromDTO(
  dto: SocialSettingsDTO,
): SocialFormValues {
  return {
    items: Array.isArray(dto.items)
      ? dto.items.map((it) => ({
          id: trimKeepEmpty(String(it.id ?? "")),
          kind: it.kind,
          href: trimKeepEmpty(
            typeof it.href === "string" ? it.href : String(it.href ?? ""),
          ),
        }))
      : [],
  };
}

export function toSocialSettingsShapeFromFormValues(values: SocialFormValues) {
  return {
    items:
      values.items?.map((it) => ({
        id: trimKeepEmpty(it.id),
        kind: it.kind,
        href: trimKeepEmpty(it.href),
      })) ?? [],
  };
}

export function normalizeSocialFormValues(
  i: SocialFormValues,
): SocialFormValues {
  return {
    items: Array.isArray(i.items)
      ? i.items.map((it) => ({
          id: trimKeepEmpty(it.id),
          kind: it.kind,
          href: trimKeepEmpty(it.href),
        }))
      : [],
  };
}

/** Re-exports the shared DTO-to-runtime-shape mapper for Studio callers. */
export function toSocialSettingsShape(dto: SocialSettingsDTO) {
  return toSocialSettingsShapeFromDTO(dto);
}

/** Builds a partial API intent while preserving PATCH semantics. */
export function toUpdateSocialIntentDTOFromFormValues(
  p: Partial<SocialFormValues>,
): UpdateSocialSettingsIntentDTO {
  const out: UpdateSocialSettingsIntentDTO = {};

  if ("items" in p) {
    out.items = Array.isArray(p.items)
      ? p.items.map((it) => ({
          id: trimKeepEmpty(it.id),
          kind: it.kind,
          href: trimKeepEmpty(it.href),
        }))
      : [];
  }

  return out;
}
