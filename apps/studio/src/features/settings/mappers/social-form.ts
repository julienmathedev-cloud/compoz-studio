/**
 * @file apps/studio/src/mappers/site/social-form.ts
 * @layer ui-mapper/studio
 * @description
 * Mappers UI Social (studio forms) :
 * - DTO -> valeurs de formulaire RHF (draft-friendly)
 * - normalisation UI
 * - INTENTS DTO pour l’API (draft-only)
 *
 * @remarks
 * - DTO -> Shape runtime (shared, renderer) : `toSocialSettingsShapeFromDTO`
 *   dans `@compoz/ui/site/mappers/social-shape`.
 */

import type { SocialSettingsDTO } from "@compoz/core/domain/site/dto";

import type { SocialFormValues } from "@compoz/validation/site/settings/social/social-form";
import type { UpdateSocialSettingsIntentDTO } from "@compoz/validation/site/settings/social/social-intents";

import { trimKeepEmpty } from "@compoz/ui/lib/form-utils";
import { toSocialSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/social-shape";

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
export function toSocialSettingsShapeFromFormValues(values: SocialFormValues) {
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

/* ------------------------------ DTO -> Shape (optional re-export) ---------- */

/**
 * DTO -> Shape runtime (renderer) : convenience export côté studio.
 *
 * @remarks
 * Optionnel : tu peux supprimer cette fonction et importer directement
 * `toSocialSettingsShapeFromDTO` depuis `@compoz/ui/site/mappers/social-shape`.
 */
export function toSocialSettingsShape(dto: SocialSettingsDTO) {
  return toSocialSettingsShapeFromDTO(dto);
}

/* ------------------------------ UI -> INTENT (API) -------------------------- */

/**
 * Transforme un INTENT UI partiel en DTO d’intent (draft-only) :
 * - Ne renvoie que les clés présentes dans `p`.
 * - Applique trim comme pour les form values complètes.
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
