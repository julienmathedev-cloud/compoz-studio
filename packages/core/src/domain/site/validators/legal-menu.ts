/**
 * @file packages/core/src/domain/site/validators/legal-menu.ts
 * @layer core/domain
 * @description
 * Validateur métier — invariants LegalMenu bloquants :
 * - `id` requis et unique
 * - `label` requis
 * - `href` requis
 *
 * @remarks
 * Suppose que la shape de base (types, formats d’URL) est validée en amont
 * par les schemas/adapters. Ce module se concentre uniquement sur les
 * invariants stricts du domaine.
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type {
  LegalMenuItem,
  LegalMenuSettings,
} from "@compoz/core/domain/site/entities/legal-menu";

/**
 * Vérifie les invariants d’un item légal isolé.
 *
 * @param it    Élément du menu légal à valider.
 * @param index Index de l’élément dans le tableau `items`.
 *
 * @throws DomainError
 * - `EC.LEGAL_MENU_ID_REQUIRED`
 * - `EC.LEGAL_MENU_LABEL_REQUIRED`
 * - `EC.LEGAL_MENU_HREF_REQUIRED`
 */
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

/**
 * Invariants globaux : unicité des ids + items valides.
 *
 * @throws DomainError
 * - `EC.LEGAL_MENU_DUPLICATE_ID`
 * - (peut lever les erreurs de `assertLegalMenuItem`)
 */
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
