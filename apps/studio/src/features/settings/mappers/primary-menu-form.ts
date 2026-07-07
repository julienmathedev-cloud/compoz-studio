/**
 * @file apps/studio/src/features/settings/mappers/primary-menu-form.ts
 * @layer studio/features/settings/mappers
 *
 * @description
 * Studio primary menu settings mappers for form values, preview shape, and API intents.
 *
 * @remarks
 * - Hrefs stay draft-friendly so internal and external links can be edited before validation.
 * - Menu item ids are stable domain identifiers persisted by the API.
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

/** Defensive fallback for legacy DTOs missing a persisted menu item id. */
function createId(): string {
  return crypto.randomUUID();
}

/** Normalizes a non-empty href to the internal/external draft format. */
function normalizeHrefDraft(href: string): string {
  const raw = String(href ?? "").trim();
  const flags = resolveLinkFlags(raw);
  return flags.rawExternal ? toExternalDraft(raw) : toInternalDraft(raw);
}

/** Preserves empty href drafts while normalizing non-empty values. */
function normalizeHrefDraftKeepEmpty(href: string): string {
  const v = trimKeepEmpty(href);
  if (v.length === 0) return "";
  return normalizeHrefDraft(v);
}

// DTO-derived item types avoid drift with the domain contract.
type PrimaryMenuDTOItem = NonNullable<PrimaryMenuSettingsDTO["items"]>[number];
type PrimaryMenuDTOChild = NonNullable<PrimaryMenuDTOItem["children"]>[number];

function toChildFormValuesFromDTO(
  it: PrimaryMenuDTOChild,
): PrimaryMenuChildFormValues {
  return {
    id: trimKeepEmpty(String(it.id ?? "")) || createId(),
    label: trimKeepEmpty(it.label),
    href: String(it.href ?? ""),
    newTab: asBool(it.newTab),
  };
}

function toTopItemFormValuesFromDTO(
  it: PrimaryMenuDTOItem,
): PrimaryMenuItemFormValues {
  const base: PrimaryMenuItemFormValues = {
    id: trimKeepEmpty(String(it.id ?? "")) || createId(),
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
    children: children.map(toChildFormValuesFromDTO),
  };
}

function normalizeChildFormValues(
  i: PrimaryMenuChildFormValues,
): PrimaryMenuChildFormValues {
  return {
    id: trimKeepEmpty(i.id) || createId(),
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
    id: trimKeepEmpty(i.id) || createId(),
    label: trimKeepEmpty(i.label),
    href: normalizeHrefDraftKeepEmpty(i.href),
    // Parent items with children are never opened in a new tab.
    newTab: hasChildren ? false : asBool(i.newTab),
    children: hasChildren ? children.map(normalizeChildFormValues) : [],
  };
}

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

export function toPrimaryMenuSettingsShapeFromFormValues(
  values: PrimaryMenuFormValues,
): PrimaryMenuSettingsShape {
  return {
    items:
      values.items?.map((item) => ({
        id: trimKeepEmpty(item.id) || createId(),
        label: trimKeepEmpty(item.label),
        href: normalizeHrefDraftKeepEmpty(item.href),
        newTab:
          Array.isArray(item.children) && item.children.length > 0
            ? false
            : asBool(item.newTab),
        children:
          item.children?.map((child) => ({
            id: trimKeepEmpty(child.id) || createId(),
            label: trimKeepEmpty(child.label),
            href: normalizeHrefDraftKeepEmpty(child.href),
            newTab: asBool(child.newTab),
          })) ?? [],
      })) ?? [],
  };
}

/** Re-exports the shared DTO-to-runtime-shape mapper for Studio callers. */
export function toPrimaryMenuSettingsShape(
  dto: PrimaryMenuSettingsDTO,
): PrimaryMenuSettingsShape {
  return toPrimaryMenuSettingsShapeFromDTO(dto);
}

/** Intent item aliases intentionally mirror the API DTO shape. */
type PrimaryMenuIntentDTOItem = NonNullable<
  UpdatePrimaryMenuSettingsIntentDTO["items"]
>[number];

type PrimaryMenuIntentDTOChild = NonNullable<
  NonNullable<PrimaryMenuIntentDTOItem["children"]>[number]
>;

/** Builds a partial API intent while preserving PATCH semantics. */
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
    id: trimKeepEmpty(c.id) || createId(),
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
      id: trimKeepEmpty(it.id) || createId(),
      label: trimKeepEmpty(it.label),
      href: parentHref,
      newTab: false,
      children,
    };
  }

  return {
    id: trimKeepEmpty(it.id) || createId(),
    label: trimKeepEmpty(it.label),
    href: normalizeHrefDraftKeepEmpty(it.href),
    newTab: asBool(it.newTab),
    children: [],
  };
}
