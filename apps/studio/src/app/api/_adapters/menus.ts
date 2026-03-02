/**
 * @file apps/studio/src/app/api/_adapters/menus.ts
 * @layer api/adapters
 * @description
 * Adaptateurs API Admin pour les menus (Primary et Legal) : convertit les DTO reçus
 * en patchs partiels domaine avec trimming et normalisation.
 *
 * Responsabilités :
 * - adaptation des items
 * - normalisation des href via le domaine
 * - application uniquement des champs présents dans le patch
 *
 * @remarks
 * - `isExternal` n’est pas stocké : il est dérivé au render/preview à partir de `href`.
 */

import type {
  LegalMenuItem,
  LegalMenuSettings,
} from "@compoz/core/domain/site/entities/legal-menu";
import type {
  PrimaryMenuItem,
  PrimaryMenuSettings,
} from "@compoz/core/domain/site/entities/primary-menu";
import type { UpdateLegalMenuSettingsInput } from "@compoz/core/domain/site/use-cases/legal-menu/update-legal-menu-settings.types";
import type { UpdatePrimaryMenuSettingsInput } from "@compoz/core/domain/site/use-cases/primary-menu/update-primary-menu-settings.types";
import { asAssetUrl } from "@compoz/core/domain/urls/derive";

import { log } from "@compoz/infra/lib/log";

import type { UpdateLegalMenuSettingsIntentDTO } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-intents";
import type { UpdatePrimaryMenuSettingsIntentDTO } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-intents";

/* ─────────── LEGAL ─────────── */

/**
 * Transforme un item LegalMenu intent DTO en item domaine.
 * Contrat :
 * - trim du label
 * - normalisation de l’URL via `asAssetUrl`
 */
function adaptLegalItem(dto: {
  label: string;
  href: string;
  newTab: boolean;
}): LegalMenuItem {
  const href = asAssetUrl(dto.href);

  return {
    label: dto.label.trim(),
    href,
    newTab: !!dto.newTab,
  };
}

/**
 * Transforme un intent DTO LegalMenu en patch partiel domaine.
 * Contrat : `items` est traité uniquement s’il s’agit d’un tableau. Chaque item est adapté.
 */
export function adaptUpdateLegalMenuIntent(
  dto: UpdateLegalMenuSettingsIntentDTO,
): UpdateLegalMenuSettingsInput {
  const started = Date.now();

  log.debug("admin.adapter.legalMenu.patch.start", {
    hasItems: Array.isArray(dto.items),
    itemsCount: Array.isArray(dto.items) ? dto.items.length : undefined,
  });

  const patch: Partial<LegalMenuSettings> = {};

  if (Array.isArray(dto.items)) {
    patch.items = dto.items.map(adaptLegalItem);
  }

  log.debug("admin.adapter.legalMenu.patch.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(patch),
  });

  return { patch };
}

/* ─────────── PRIMARY (2 niveaux max) ─────────── */

/**
 * Assure un href string non vide avant normalisation domaine.
 * - undefined / "" => "/"
 * - sinon => trim
 */
function coerceHrefOrRoot(input: unknown): string {
  const v = typeof input === "string" ? input.trim() : "";
  return v.length === 0 ? "/" : v;
}

/**
 * Transforme un enfant de menu principal DTO en PrimaryMenuItem domaine.
 * Contrat : children = [] par défaut, trim et normalisation de l’URL.
 */
function adaptPrimaryChild(dto: {
  label: string;
  href: string;
  newTab: boolean;
}): PrimaryMenuItem {
  const href = asAssetUrl(coerceHrefOrRoot(dto.href));

  return {
    label: dto.label.trim(),
    href,
    newTab: !!dto.newTab,
    children: [],
  };
}

/**
 * Transforme un item parent/leaf de menu principal intent DTO en PrimaryMenuItem domaine.
 * Contrat :
 * - href peut être optionnel côté intent (parent avec children)
 * - fallback "/" si href absent/vide
 * - children max 2 niveaux
 */
function adaptPrimaryItem(dto: {
  label: string;
  href?: string;
  newTab: boolean;
  children?: Array<{ label: string; href: string; newTab: boolean }>;
}): PrimaryMenuItem {
  const href = asAssetUrl(coerceHrefOrRoot(dto.href));

  const base: PrimaryMenuItem = {
    label: dto.label.trim(),
    href,
    newTab: !!dto.newTab,
    children: [],
  };

  if (Array.isArray(dto.children) && dto.children.length > 0) {
    const kids = dto.children.map(adaptPrimaryChild);
    return { ...base, children: kids };
  }

  return base;
}

/**
 * Transforme un intent DTO PrimaryMenu en patch partiel domaine.
 * Contrat : `items` est traité uniquement s’il s’agit d’un tableau.
 */
export function adaptUpdatePrimaryMenuIntent(
  dto: UpdatePrimaryMenuSettingsIntentDTO,
): UpdatePrimaryMenuSettingsInput {
  const started = Date.now();

  log.debug("admin.adapter.primaryMenu.patch.start", {
    hasItems: Array.isArray(dto.items),
    itemsCount: Array.isArray(dto.items) ? dto.items.length : undefined,
  });

  const patch: Partial<PrimaryMenuSettings> = {};

  if (Array.isArray(dto.items)) {
    patch.items = dto.items.map(adaptPrimaryItem);
  }

  log.debug("admin.adapter.primaryMenu.patch.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(patch),
  });

  return { patch };
}
