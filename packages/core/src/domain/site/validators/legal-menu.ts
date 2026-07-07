/**
 * @file packages/core/src/domain/site/validators/legal-menu.ts
 * @layer core/domain/site/validators
 * @description Blocking domain invariants for legal menu settings.
 * @remarks
 * Shape and URL format validation are handled upstream by schemas and adapters.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  LegalMenuItem,
  LegalMenuSettings,
} from "@compoz/core/domain/site/entities/legal-menu";

function assertLegalMenuItem(it: LegalMenuItem, index: number): void {
  const id = String(it.id ?? "").trim();
  const label = String(it.label ?? "").trim();
  const href = String(it.href ?? "").trim();

  if (!id) {
    throw new DomainError({
      code: EC.LEGAL_MENU_ID_REQUIRED,
      message: EC.LEGAL_MENU_ID_REQUIRED,
      details: { path: ["legalMenu", "items", index, "id"] },
    });
  }

  if (!label) {
    throw new DomainError({
      code: EC.LEGAL_MENU_LABEL_REQUIRED,
      message: EC.LEGAL_MENU_LABEL_REQUIRED,
      details: { path: ["legalMenu", "items", index, "label"] },
    });
  }

  if (!href) {
    throw new DomainError({
      code: EC.LEGAL_MENU_HREF_REQUIRED,
      message: EC.LEGAL_MENU_HREF_REQUIRED,
      details: { path: ["legalMenu", "items", index, "href"] },
    });
  }
}

export function assertLegalMenuSettings(s: LegalMenuSettings): void {
  const seenIds = new Set<LegalMenuItem["id"]>();

  s.items.forEach((it, i) => {
    const id = String(it.id ?? "").trim();

    if (seenIds.has(id)) {
      throw new DomainError({
        code: EC.LEGAL_MENU_DUPLICATE_ID,
        message: EC.LEGAL_MENU_DUPLICATE_ID,
        details: { path: ["legalMenu", "items", i, "id"], id },
      });
    }

    seenIds.add(id);
    assertLegalMenuItem(it, i);
  });
}
