/**
 * @file apps/studio/src/features/settings/mappers/primary-menu-form.ts
 * @layer ui-mappers/studio/site
 * @description
 * Mappers UI PrimaryMenu (studio forms) :
 * - DTO -> valeurs de formulaire RHF
 * - normalisation UI (draft-friendly)
 * - Shape depuis FormValues (preview draft)
 * - INTENTS DTO pour l’API
 *
 * @remarks
 * - DTO -> Shape runtime (shared, renderer) : `toPrimaryMenuSettingsShapeFromDTO` (package ui).
 * - Ici, la normalisation `href` est "draft-friendly" (internal/external) pour le studio.
 */

import type { PrimaryMenuSettingsDTO } from "@compoz/core/domain/site/dto";

import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";

import type {
  PrimaryMenuChildFormValues,
  PrimaryMenuFormValues,
  PrimaryMenuItemFormValues,
} from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-form";
import type { UpdatePrimaryMenuSettingsIntentDTO } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-intents";

import { asBool, trimKeepEmpty } from "@compoz/ui/lib/form-utils";
import { resolveLinkFlags } from "@compoz/ui/lib/links/helpers";
import { toExternalDraft, toInternalDraft } from "@compoz/ui/lib/normalize";

import { toPrimaryMenuSettingsShapeFromDTO } from "@compoz/ui/settings/mappers/primary-menu-shape";

/* --------------------------------- helpers --------------------------------- */

/**
 * Normalise un href en draft interne/externe.
 * - URL absolue => toExternalDraft
 * - sinon => toInternalDraft
 *
 * ⚠️ Cette fonction suppose une string NON vide. Pour préserver la sémantique
 * UI ("" = draft/empty), utiliser `normalizeHrefDraftKeepEmpty`.
 */
function normalizeHrefDraft(href: string): string {
  const raw = String(href ?? "").trim();
  const flags = resolveLinkFlags(raw);
  return flags.rawExternal ? toExternalDraft(raw) : toInternalDraft(raw);
}

/**
 * Variante UI-safe :
 * - "" reste ""
 * - sinon normalisation draft interne/externe
 */
function normalizeHrefDraftKeepEmpty(href: string): string {
  const v = trimKeepEmpty(href);
  if (v.length === 0) return "";
  return normalizeHrefDraft(v);
}

/* -------------------------------------------------------------------------- */
/*                         DTO item types (source de vérité)                  */
/* -------------------------------------------------------------------------- */

/**
 * Types dérivés du DTO pour éviter toute divergence
 * et respecter `readonly` sur `children`.
 */
type PrimaryMenuDTOItem = NonNullable<PrimaryMenuSettingsDTO["items"]>[number];
type PrimaryMenuDTOChild = NonNullable<PrimaryMenuDTOItem["children"]>[number];

/* ------------------------------ DTO -> UI ---------------------------------- */

/** DTO -> UI : child (leaf). */
function toChildFormValuesFromDTO(
  it: PrimaryMenuDTOChild,
): PrimaryMenuChildFormValues {
  return {
    label: trimKeepEmpty(it.label),
    href: String(it.href ?? ""),
    newTab: asBool(it.newTab),
  };
}

/** DTO -> UI : item top-level (parent ou leaf). */
function toTopItemFormValuesFromDTO(
  it: PrimaryMenuDTOItem,
): PrimaryMenuItemFormValues {
  const base: PrimaryMenuItemFormValues = {
    label: trimKeepEmpty(it.label),
    href: String(it.href ?? ""),
    newTab: asBool(it.newTab),
    children: [],
  };

  const children = it.children;
  const hasChildren = Array.isArray(children) && children.length > 0;
  if (!hasChildren) return base;

  return {
    ...base,
    // `children` peut être readonly => `.map` OK, retourne un nouvel Array
    children: children.map(toChildFormValuesFromDTO),
  };
}

/* ---------------------------- Normalisation UI ---------------------------- */

function normalizeChildFormValues(
  i: PrimaryMenuChildFormValues,
): PrimaryMenuChildFormValues {
  return {
    label: trimKeepEmpty(i.label),
    href: normalizeHrefDraftKeepEmpty(i.href),
    newTab: asBool(i.newTab),
  };
}

function normalizeTopItemFormValues(
  i: PrimaryMenuItemFormValues,
): PrimaryMenuItemFormValues {
  const children = i.children;
  const hasChildren = Array.isArray(children) && children.length > 0;

  return {
    label: trimKeepEmpty(i.label),
    href: normalizeHrefDraftKeepEmpty(i.href),
    // UX: parent + enfants => jamais newTab
    newTab: hasChildren ? false : asBool(i.newTab),
    children: hasChildren ? children.map(normalizeChildFormValues) : [],
  };
}

/* ----------------------- Domaine (DTO) -> UI (form values) ------------------ */

export function toPrimaryMenuFormValuesFromDTO(
  dto: PrimaryMenuSettingsDTO,
): PrimaryMenuFormValues {
  return { items: (dto.items ?? []).map(toTopItemFormValuesFromDTO) };
}

export function normalizePrimaryMenuFormValues(
  values: PrimaryMenuFormValues,
): PrimaryMenuFormValues {
  return {
    items: Array.isArray(values.items)
      ? values.items.map(normalizeTopItemFormValues)
      : [],
  };
}

/**
 * Transforme les valeurs de formulaire PrimaryMenu en shape Settings canonique (draft).
 * Contrat : valeurs alignées avec la shape attendue côté domaine.
 */
export function toPrimaryMenuSettingsShapeFromFormValues(
  values: PrimaryMenuFormValues,
): PrimaryMenuSettingsShape {
  return {
    items: values.items ?? [],
  };
}

/**
 * DTO -> Shape (re-export studio convenience)
 *
 * @remarks
 * Optionnel : garde un point d’entrée unique côté studio si tu veux,
 * sinon importe directement depuis `@compoz/ui/site/mappers/primary-menu-shape`.
 */
export function toPrimaryMenuSettingsShape(
  dto: PrimaryMenuSettingsDTO,
): PrimaryMenuSettingsShape {
  return toPrimaryMenuSettingsShapeFromDTO(dto);
}

/* ------------------------------ UI -> INTENT (API) -------------------------- */

type PrimaryMenuIntentDTOItem = NonNullable<
  UpdatePrimaryMenuSettingsIntentDTO["items"]
>[number];

type PrimaryMenuIntentDTOChild = NonNullable<
  NonNullable<PrimaryMenuIntentDTOItem["children"]>[number]
>;

/**
 * Transforme un INTENT UI partiel en DTO d’intent (draft-only) :
 * - Ne renvoie que les clés présentes dans `p`.
 * - Applique trim/coercition comme pour les form values complètes.
 */
export function toUpdatePrimaryMenuIntentDTOFromFormValues(
  p: Partial<PrimaryMenuFormValues>,
): UpdatePrimaryMenuSettingsIntentDTO {
  const out: UpdatePrimaryMenuSettingsIntentDTO = {};

  if ("items" in p) {
    out.items = Array.isArray(p.items)
      ? p.items.map(normalizeIntentDTOTopItem)
      : [];
  }

  return out;
}

function normalizeIntentDTOChild(
  c: PrimaryMenuChildFormValues,
): PrimaryMenuIntentDTOChild {
  return {
    label: trimKeepEmpty(c.label),
    href: normalizeHrefDraftKeepEmpty(c.href),
    newTab: asBool(c.newTab),
  };
}

function normalizeIntentDTOTopItem(
  it: PrimaryMenuItemFormValues,
): PrimaryMenuIntentDTOItem {
  const childrenRaw = it.children;
  const hasChildren = Array.isArray(childrenRaw) && childrenRaw.length > 0;

  if (hasChildren) {
    const children = childrenRaw.map(normalizeIntentDTOChild);

    const parentHrefDraft = normalizeHrefDraftKeepEmpty(it.href);
    const parentHref =
      parentHrefDraft.trim().length === 0 ? "/" : parentHrefDraft;

    return {
      label: trimKeepEmpty(it.label),
      href: parentHref,
      newTab: false,
      children,
    };
  }

  return {
    label: trimKeepEmpty(it.label),
    href: normalizeHrefDraftKeepEmpty(it.href),
    newTab: asBool(it.newTab),
    children: [],
  };
}
