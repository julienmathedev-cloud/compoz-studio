/**
 * @file packages/ui/src/settings/mappers/primary-menu-shape.ts
 * @layer ui/settings/mappers
 *
 * @description
 * Maps primary menu settings DTOs to stable runtime primary menu settings shapes shared by site rendering and Studio preview.
 *
 * @remarks
 * API intents and draft/form-oriented normalization stay outside this boundary mapper.
 */

import type { PrimaryMenuSettingsDTO } from "@compoz/core/domain/site/dto";

import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";

import { trimKeepEmpty } from "@compoz/ui/lib/form-utils";

type PrimaryMenuDTOItem = NonNullable<PrimaryMenuSettingsDTO["items"]>[number];
type PrimaryMenuDTOChild = NonNullable<PrimaryMenuDTOItem["children"]>[number];

type PrimaryMenuShapeItem = NonNullable<
  PrimaryMenuSettingsShape["items"]
>[number];
type PrimaryMenuShapeChild = NonNullable<
  PrimaryMenuShapeItem["children"]
>[number];

function toStrictBool(v: unknown): boolean {
  return typeof v === "boolean" ? v : false;
}

function toHrefString(v: unknown): string {
  return typeof v === "string" ? v : String(v ?? "");
}

function toPrimaryMenuSettingsShapeChildFromDTO(
  it: PrimaryMenuDTOChild,
): PrimaryMenuShapeChild {
  return {
    id: trimKeepEmpty(String(it.id ?? "")),
    label: trimKeepEmpty(it.label),
    href: trimKeepEmpty(toHrefString(it.href)),
    newTab: toStrictBool(it.newTab),
  };
}

function toPrimaryMenuSettingsShapeItemFromDTO(
  it: PrimaryMenuDTOItem,
): PrimaryMenuShapeItem {
  const childrenRaw = it.children;
  const hasChildren = Array.isArray(childrenRaw) && childrenRaw.length > 0;

  const children = hasChildren
    ? childrenRaw.map(toPrimaryMenuSettingsShapeChildFromDTO)
    : undefined;

  const hrefRaw = trimKeepEmpty(toHrefString(it.href));
  const href = hrefRaw.length > 0 ? hrefRaw : undefined;

  return {
    id: trimKeepEmpty(String(it.id ?? "")),
    label: trimKeepEmpty(it.label),
    href,
    // Parent items with children must not open in a new tab.
    newTab: hasChildren ? false : toStrictBool(it.newTab),
    ...(hasChildren ? { children } : {}),
  };
}

export function toPrimaryMenuSettingsShapeFromDTO(
  dto: PrimaryMenuSettingsDTO | null | undefined,
): PrimaryMenuSettingsShape {
  return {
    items: (dto?.items ?? []).map(toPrimaryMenuSettingsShapeItemFromDTO),
  };
}
