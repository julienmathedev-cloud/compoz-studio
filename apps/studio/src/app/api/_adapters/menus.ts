/**
 * @file apps/studio/src/app/api/_adapters/menus.ts
 * @layer studio/app/api/adapters
 *
 * @description
 * Studio API adapters for primary and legal menu update intents.
 *
 * @remarks
 * - Normalizes menu item href values through the domain URL helpers.
 * - Builds partial domain patches from the fields present in the intent.
 * - Does not store `isExternal`; it is derived at render/preview time from `href`.
 */

import { SITE_PATH } from "@compoz/core/constants/web/paths";
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
import { asAssetUrl } from "@compoz/core/domain/urls/href";
import { log } from "@compoz/infra/lib/log";
import { trimOrKeep } from "@compoz/studio/lib/strings";
import type { UpdateLegalMenuSettingsOCCIntentDTO } from "@compoz/validation/site/settings/menus/legal-menu/legal-menu-intents";
import type { UpdatePrimaryMenuSettingsOCCIntentDTO } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu-intents";

// Legal menu adapters.

/**
 * Ensures a non-empty href string before domain normalization.
 * - undefined / "" => "/"
 * - otherwise => defensive trimming
 */
function coerceHrefOrRoot(input: unknown): string {
  const v = typeof input === "string" ? trimOrKeep(input) : "";
  return v.length === 0 ? SITE_PATH.home : v;
}

/**
 * Converts a LegalMenu intent DTO item into a domain item.
 * Contract:
 * - propagate `id`
 * - trim the label
 * - normalize the URL through `asAssetUrl`
 */
function adaptLegalItem(dto: {
  id: string;
  label: string;
  href: string;
  newTab: boolean;
}): LegalMenuItem {
  const href = asAssetUrl(coerceHrefOrRoot(dto.href));

  return {
    id: trimOrKeep(dto.id),
    label: trimOrKeep(dto.label),
    href,
    newTab: !!dto.newTab,
  };
}

/**
 * Converts a LegalMenu intent DTO into a partial domain patch.
 * Contract: `items` is processed only when it is an array. Each item is adapted.
 */
export function adaptUpdateLegalMenuIntent(
  intent: UpdateLegalMenuSettingsOCCIntentDTO,
): UpdateLegalMenuSettingsInput {
  const dto = intent.patch;
  const started = Date.now();

  log.debug("studio.adapter.legalMenu.patch.start", {
    hasItems: Array.isArray(dto.items),
    itemsCount: Array.isArray(dto.items) ? dto.items.length : undefined,
  });

  const patch: Partial<LegalMenuSettings> = {};

  if (Array.isArray(dto.items)) {
    patch.items = dto.items.map(adaptLegalItem);
  }

  log.debug("studio.adapter.legalMenu.patch.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(patch),
  });

  return {
    baseline: { items: intent.baseline.items.map(adaptLegalItem) },
    patch,
    expectedRevision: intent.expectedRevision,
  };
}

// Primary menu adapters. Primary menus support two levels at most.

/**
 * Converts a primary menu child DTO into a domain item.
 *
 * @remarks
 * Child items always receive an empty `children` array because only two menu
 * levels are supported.
 */
function adaptPrimaryChild(dto: {
  id: string;
  label: string;
  href: string;
  newTab: boolean;
}): PrimaryMenuItem {
  const href = asAssetUrl(coerceHrefOrRoot(dto.href));

  return {
    id: trimOrKeep(dto.id),
    label: trimOrKeep(dto.label),
    href,
    newTab: !!dto.newTab,
    children: [],
  };
}

/**
 * Converts a primary menu parent/leaf intent DTO into a domain PrimaryMenuItem.
 * Contract:
 * - propagate `id`
 * - href may be optional in the intent (parent with children)
 * - fallback to "/" when href is missing or empty
 * - children are limited to two levels
 */
function adaptPrimaryItem(dto: {
  id: string;
  label: string;
  href?: string;
  newTab: boolean;
  children?: Array<{
    id: string;
    label: string;
    href: string;
    newTab: boolean;
  }>;
}): PrimaryMenuItem {
  const href = asAssetUrl(coerceHrefOrRoot(dto.href));

  const base: PrimaryMenuItem = {
    id: trimOrKeep(dto.id),
    label: trimOrKeep(dto.label),
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
 * Converts a PrimaryMenu intent DTO into a partial domain patch.
 * Contract: `items` is processed only when it is an array.
 */
export function adaptUpdatePrimaryMenuIntent(
  intent: UpdatePrimaryMenuSettingsOCCIntentDTO,
): UpdatePrimaryMenuSettingsInput {
  const dto = intent.patch;
  const started = Date.now();

  log.debug("studio.adapter.primaryMenu.patch.start", {
    hasItems: Array.isArray(dto.items),
    itemsCount: Array.isArray(dto.items) ? dto.items.length : undefined,
  });

  const patch: Partial<PrimaryMenuSettings> = {};

  if (Array.isArray(dto.items)) {
    patch.items = dto.items.map(adaptPrimaryItem);
  }

  log.debug("studio.adapter.primaryMenu.patch.end", {
    ms: Date.now() - started,
    outKeys: Object.keys(patch),
  });

  return {
    baseline: { items: intent.baseline.items.map(adaptPrimaryItem) },
    patch,
    expectedRevision: intent.expectedRevision,
  };
}
