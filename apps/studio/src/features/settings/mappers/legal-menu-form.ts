/**
 * @file apps/studio/src/features/settings/mappers/legal-menu-form.ts
 * @layer ui-mappers/site
 * @description
 * Mappers UI LegalMenu (studio forms) :
 * - DTO -> valeurs de formulaire RHF
 * - normalisation UI (draft-friendly)
 * - Shape depuis FormValues (preview)
 * - INTENTS DTO pour l’API
 *
 * @remarks
 * - DTO -> Shape runtime (shared, renderer) : `toLegalMenuSettingsShapeFromDTO` (package ui).
 * - Ici, la normalisation `href` est "draft-friendly" (internal/external) pour l’admin.
 */

import type {
  LegalMenuItemDTO,
  LegalMenuSettingsDTO,
} from "@compoz/core/domain/site/dto";

import type { LegalMenuSettingsShape } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu";
import type {
  LegalMenuFormValues,
  LegalMenuItemFormValues,
} from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-form";
import type { UpdateLegalMenuSettingsIntentDTO } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-intents";

import { asBool, trimKeepEmpty } from "@compoz/ui/lib/form-utils";
import { resolveLinkFlags } from "@compoz/ui/lib/links/helpers";
import { toExternalDraft, toInternalDraft } from "@compoz/ui/lib/normalize";

import { toLegalMenuSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/legal-menu-shape";

function normalizeHrefDraft(href: string): string {
  const raw = String(href ?? "").trim();
  const flags = resolveLinkFlags(raw);
  return flags.rawExternal ? toExternalDraft(raw) : toInternalDraft(raw);
}

function normalizeHrefDraftKeepEmpty(href: string): string {
  const v = trimKeepEmpty(href);
  if (v.length === 0) return "";
  return normalizeHrefDraft(v);
}

/* ------------------------------ item mappers ------------------------------ */

/**
 * DTO domaine -> UI (RHF)
 * Contrat : seules les propriétés exposées côté UI sont retournées.
 */
function toLegalMenuItemFormValuesFromDTO(
  it: LegalMenuItemDTO,
): LegalMenuItemFormValues {
  return {
    label: trimKeepEmpty(it.label),
    href: trimKeepEmpty(String(it.href ?? "")),
    newTab: asBool(it.newTab),
  };
}

/**
 * Normalise un item LegalMenu côté UI : trim et coercition.
 * Contrat : forme prête pour le formulaire RHF.
 */
export function normalizeLegalMenuItemFormValues(
  i: LegalMenuItemFormValues,
): LegalMenuItemFormValues {
  return {
    label: trimKeepEmpty(i.label),
    href: normalizeHrefDraftKeepEmpty(i.href),
    newTab: asBool(i.newTab),
  };
}

/* ----------------------- Domaine (DTO) -> UI (form values) ------------------ */

export function toLegalMenuFormValuesFromDTO(
  dto: LegalMenuSettingsDTO,
): LegalMenuFormValues {
  const items = dto.items ?? [];
  return { items: items.map(toLegalMenuItemFormValuesFromDTO) };
}

/* ------------------- Admin (RHF) -> Preview/Public (SettingsShape) ----------- */

/**
 * Transforme les valeurs du formulaire LegalMenu en shape Settings canonique.
 *
 * @remarks
 * - Utilisé par la preview admin (draft).
 * - Retourne une shape "frontière" (strings), sans dérivations métier.
 * - Normalise `href` en "draft-friendly".
 */
export function toLegalMenuSettingsShapeFromFormValues(
  values: LegalMenuFormValues,
): LegalMenuSettingsShape {
  const items = Array.isArray(values.items) ? values.items : [];

  return {
    items: items.map((it) => ({
      label: trimKeepEmpty(it.label),
      href: normalizeHrefDraftKeepEmpty(it.href),
      newTab: asBool(it.newTab),
    })),
  };
}

/**
 * DTO -> Shape (re-export studio convenience)
 *
 * @remarks
 * Optionnel : garde un point d’entrée unique côté studio si tu veux,
 * sinon tu peux importer directement depuis `@compoz/ui/site/mappers/legal-menu-shape`.
 */
export function toLegalMenuSettingsShape(
  dto: LegalMenuSettingsDTO,
): LegalMenuSettingsShape {
  return toLegalMenuSettingsShapeFromDTO(dto);
}

/* ---------------------------- Normalisations UI ---------------------------- */

export function normalizeLegalMenuFormValues(
  values: LegalMenuFormValues,
): LegalMenuFormValues {
  return {
    items: Array.isArray(values.items)
      ? values.items.map(normalizeLegalMenuItemFormValues)
      : [],
  };
}

/* ------------------------------ UI -> INTENT (API) -------------------------- */

/**
 * Transforme un INTENT UI partiel en DTO d’intent (draft-only) :
 * - Ne renvoie que les clés présentes dans `p`.
 * - Applique trim/coercition comme pour les form values complètes.
 */
export function toUpdateLegalMenuIntentDTOFromFormValues(
  p: Partial<LegalMenuFormValues>,
): UpdateLegalMenuSettingsIntentDTO {
  const out: UpdateLegalMenuSettingsIntentDTO = {};

  if ("items" in p) {
    out.items = Array.isArray(p.items)
      ? p.items.map((it) => {
          const n = normalizeLegalMenuItemFormValues(it);
          return {
            label: n.label,
            href: n.href,
            newTab: n.newTab,
          };
        })
      : [];
  }

  return out;
}
