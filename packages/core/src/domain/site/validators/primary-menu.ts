/**
 * @file packages/core/src/domain/site/validators/primary-menu.ts
 * @layer core/domain/site/validators
 * @description Blocking domain invariants for primary menu settings.
 * @remarks
 * Shape and URL format validation are handled upstream by schemas and adapters.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  PrimaryMenuItem,
  PrimaryMenuSettings,
} from "@compoz/core/domain/site/entities/primary-menu";

function assertPrimaryMenuItem(
  it: PrimaryMenuItem,
  path: readonly (string | number)[],
  seenIds: Set<string>,
): void {
  const id = String(it.id ?? "").trim();
  const label = String(it.label ?? "").trim();
  const href = String(it.href ?? "").trim();
  const children = Array.isArray(it.children) ? it.children : [];
  const hasChildren = children.length > 0;

  if (!id) {
    throw new DomainError({
      code: EC.PRIMARY_MENU_ID_REQUIRED,
      message: EC.PRIMARY_MENU_ID_REQUIRED,
      details: { path: [...path, "id"] },
    });
  }

  if (seenIds.has(id)) {
    throw new DomainError({
      code: EC.PRIMARY_MENU_DUPLICATE_ID,
      message: EC.PRIMARY_MENU_DUPLICATE_ID,
      details: { path: [...path, "id"], id },
    });
  }
  seenIds.add(id);

  if (!label) {
    throw new DomainError({
      code: EC.PRIMARY_MENU_LABEL_REQUIRED,
      message: EC.PRIMARY_MENU_LABEL_REQUIRED,
      details: { path: [...path, "label"] },
    });
  }

  if (!hasChildren && !href) {
    throw new DomainError({
      code: EC.PRIMARY_MENU_HREF_REQUIRED,
      message: EC.PRIMARY_MENU_HREF_REQUIRED,
      details: { path: [...path, "href"] },
    });
  }

  children.forEach((child, childIndex) => {
    assertPrimaryMenuItem(child, [...path, "children", childIndex], seenIds);
  });
}

export function assertPrimaryMenuSettings(s: PrimaryMenuSettings): void {
  const seenIds = new Set<string>();

  s.items.forEach((it, index) => {
    assertPrimaryMenuItem(it, ["primaryMenu", "items", index], seenIds);
  });
}
