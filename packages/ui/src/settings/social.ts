/**
 * @file apps/studio/src/mappers/site/social.ts
 * @layer ui-mapper
 * @description
 * Mappers UI Social : convertit les DTO domaine en valeurs de formulaire RHF,
 * normalise les valeurs et prépare les INTENTS DTO pour l’API.
 *
 * Responsabilités : trimming, coercition, extraction des champs pertinents.
 */

import type {
  SocialItemDTO,
  SocialSettingsDTO,
} from "@compoz/core/domain/site/dto";
import type {
  SocialItemShape,
  SocialSettingsShape,
} from "@compoz/validation/site/settings/social/social";
import type { SocialFormValues } from "@compoz/validation/site/settings/social/social-form";
import type { UpdateSocialSettingsIntentDTO } from "@compoz/validation/site/settings/social/social-intents";
import { trimKeepEmpty } from "@compoz/ui/lib/form-utils";

/* ----------------------- Domaine (DTO) -> UI (form values) ------------------ */

export function toSocialFormValuesFromDTO(
  dto: SocialSettingsDTO,
): SocialFormValues {
  return {
    items: Array.isArray(dto.items)
      ? dto.items.map((it) => ({
          kind: it.kind,
          href: trimKeepEmpty(
            typeof it.href === "string" ? it.href : String(it.href ?? ""),
          ),
        }))
      : [],
  };
}

/**
 * Transforme les valeurs de formulaire Social en forme SettingsShape.
 * Contrat : les valeurs sont alignées avec la shape attendue côté domaine.
 */
export function toSocialSettingsShapeFromFormValues(
  values: SocialFormValues,
): SocialSettingsShape {
  return {
    items: values.items ?? [],
  };
}

/* ---------------------------- Normalisations UI ---------------------------- */

export function normalizeSocialFormValues(
  i: SocialFormValues,
): SocialFormValues {
  return {
    items: Array.isArray(i.items)
      ? i.items.map((it) => ({
          kind: it.kind,
          href: trimKeepEmpty(it.href),
        }))
      : [],
  };
}

/* -------------------------------------------------------------------------- */
/*                              DTO -> Shape                                  */
/* -------------------------------------------------------------------------- */

/** DTO -> Shape : item (renderer). */
function toSocialSettingsItemShapeFromDTO(it: SocialItemDTO): SocialItemShape {
  return {
    kind: it.kind,
    href: trimKeepEmpty(String(it.href ?? "")),
  };
}

/**
 * Domaine (DTO) -> Renderer (Shape)
 * Contrat : retourne une shape stable pour le renderer (arrays mutables).
 */
export function toSocialSettingsShapeFromDTO(
  dto: SocialSettingsDTO,
): SocialSettingsShape {
  return {
    items: (dto.items ?? []).map(toSocialSettingsItemShapeFromDTO),
  };
}

/* ------------------------------ UI -> INTENT (API) -------------------------- */

/**
 * Transforme un INTENT UI partiel en DTO d’intent (draft-only) :
 * - Ne renvoie que les clés présentes dans `p`.
 * - Applique trim comme pour les form values complètes.
 *
 * @remarks
 * - Ici on renvoie un DTO "patch" (sans `state`) : `UpdateSocialSettingsPatchDTO`.
 */
export function toUpdateSocialIntentDTOFromFormValues(
  p: Partial<SocialFormValues>,
): UpdateSocialSettingsIntentDTO {
  const out: UpdateSocialSettingsIntentDTO = {};

  if ("items" in p) {
    out.items = Array.isArray(p.items)
      ? p.items.map((it) => ({
          kind: it.kind,
          href: trimKeepEmpty(it.href),
        }))
      : [];
  }

  return out;
}
