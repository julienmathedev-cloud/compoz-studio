/**
 * @file src/core/domain/pages/use-cases/delete-page.types.ts
 * @layer core/domain
 * @description
 * Types du use-case de suppression de page : entrées, sorties et dépendances.
 * Définit le contrat **sans logique** (implémentation dans `delete-page.ts`).
 */

import type { PagesRepository } from "@compoz/core/domain/pages/ports/pages-repository";

/** Entrée : id obligatoire (défaut : draft). */
export interface DeletePageInput {
  pageId: string;
}

/** Sortie minimale (MVP) : suppression effectuée ou déjà effectuée. */
export interface DeletePageResult {
  ok: true;
}

/** Dépendances nécessaires au use-case. */
export interface DeletePageDeps {
  pages: PagesRepository;
}
