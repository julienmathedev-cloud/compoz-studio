/**
 * @file packages/core/src/domain/pages/use-cases/delete-page.types.ts
 * @layer core/domain/pages/use-cases
 * @description
 * Types du use-case de suppression de page : entrées, sorties et dépendances.
 * Définit le contrat **sans logique** (implémentation dans `delete-page.ts`).
 */

import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";

/** Entrée : `pageId` obligatoire (suppression dans l’état par défaut). */
export interface DeletePageInput {
  pageId: string;
}

/** Sortie minimale (MVP) : suppression effectuée ou déjà effectuée. */
export interface DeletePageResult {
  ok: true;
  pageId: string;
}

/** Dépendances nécessaires au use-case. */
export interface DeletePageDeps {
  pages: PagesRepository;
}
