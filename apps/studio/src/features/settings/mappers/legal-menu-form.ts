/**
 * @file apps/studio/src/features/settings/mappers/legal-menu-form.ts
 * @layer studio/features/settings/mappers
 *
 * @description
 * Studio legal menu settings mappers for form values, preview shape, and API intents.
 *
 * @remarks
 * - Hrefs stay draft-friendly so internal and external links can be edited before validation.
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

function toLegalMenuItemFormValuesFromDTO(
  it: LegalMenuItemDTO,
): LegalMenuItemFormValues {
  return {
    id: trimKeepEmpty(String(it.id ?? "")),
    label: trimKeepEmpty(it.label),
    href: trimKeepEmpty(String(it.href ?? "")),
    newTab: asBool(it.newTab),
  };
}

export function normalizeLegalMenuItemFormValues(
  i: LegalMenuItemFormValues,
): LegalMenuItemFormValues {
  return {
    id: trimKeepEmpty(i.id),
    label: trimKeepEmpty(i.label),
    href: normalizeHrefDraftKeepEmpty(i.href),
    newTab: asBool(i.newTab),
  };
}

export function toLegalMenuFormValuesFromDTO(
  dto: LegalMenuSettingsDTO,
): LegalMenuFormValues {
  const items = dto.items ?? [];
  return { items: items.map(toLegalMenuItemFormValuesFromDTO) };
}

export function toLegalMenuSettingsShapeFromFormValues(
  values: LegalMenuFormValues,
): LegalMenuSettingsShape {
  const items = Array.isArray(values.items) ? values.items : [];

  return {
    items: items.map((it) => ({
      id: trimKeepEmpty(it.id),
      label: trimKeepEmpty(it.label),
      href: normalizeHrefDraftKeepEmpty(it.href),
      newTab: asBool(it.newTab),
    })),
  };
}

/** Re-exports the shared DTO-to-runtime-shape mapper for Studio callers. */
export function toLegalMenuSettingsShape(
  dto: LegalMenuSettingsDTO,
): LegalMenuSettingsShape {
  return toLegalMenuSettingsShapeFromDTO(dto);
}

export function normalizeLegalMenuFormValues(
  values: LegalMenuFormValues,
): LegalMenuFormValues {
  return {
    items: Array.isArray(values.items)
      ? values.items.map(normalizeLegalMenuItemFormValues)
      : [],
  };
}

/** Builds a partial API intent while preserving PATCH semantics. */
export function toUpdateLegalMenuIntentDTOFromFormValues(
  p: Partial<LegalMenuFormValues>,
): UpdateLegalMenuSettingsIntentDTO {
  const out: UpdateLegalMenuSettingsIntentDTO = {};

  if ("items" in p) {
    out.items = Array.isArray(p.items)
      ? p.items.map((it) => {
          const n = normalizeLegalMenuItemFormValues(it);
          return {
            id: n.id,
            label: n.label,
            href: n.href,
            newTab: n.newTab,
          };
        })
      : [];
  }

  return out;
}
