/**
 * @file packages/ui/src/site/mappers/primary-menu-shape.ts
 * @layer ui/site/mappers
 *
 * @description
 * Mapper "shared runtime" PrimaryMenu :
 * - DTO domaine -> PrimaryMenuSettingsShape (frontière stable)
 *
 * @remarks
 * - Utilisé par le renderer public (site) ET par la preview/renderer côté studio.
 * - Ici, on ne gère ni RHF, ni intents API.
 * - On ne fait pas de normalisation "draft" : on convertit le DTO tel quel
 *   en shape frontière attendue par le renderer.
 */

import type { PrimaryMenuSettingsDTO } from "@compoz/core/domain/site/dto";

import type { PrimaryMenuSettingsShape } from "@compoz/validation/site/settings/menus/primary-menu/primary-menu";

import { trimKeepEmpty } from "@compoz/ui/lib/form-utils";

/* -------------------------------------------------------------------------- */
/*                         DTO item types (source de vérité)                  */
/* -------------------------------------------------------------------------- */

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
  // DTO attendu string | null | undefined. Si jamais "dirty", on force une string best-effort.
  return typeof v === "string" ? v : String(v ?? "");
}

/** DTO -> Shape : child (renderer). */
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

/** DTO -> Shape : item top-level (renderer). */
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
    // Parent avec children => jamais newTab (contrat schema)
    newTab: hasChildren ? false : toStrictBool(it.newTab),
    ...(hasChildren ? { children } : {}),
  };
}

/**
 * Domaine (DTO) -> Renderer (Shape)
 * Contrat : retourne une shape stable pour le renderer (arrays mutables).
 */
export function toPrimaryMenuSettingsShapeFromDTO(
  dto: PrimaryMenuSettingsDTO | null | undefined,
): PrimaryMenuSettingsShape {
  return {
    items: (dto?.items ?? []).map(toPrimaryMenuSettingsShapeItemFromDTO),
  };
}
