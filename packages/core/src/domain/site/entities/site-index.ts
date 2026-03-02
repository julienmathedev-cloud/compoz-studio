/**
 * @file packages/core/src/domain/site/entities/site-index.ts
 * @layer core/domain
 * @description
 * Entité métier représentant l’index global du site : l’ordre fonctionnel des pages.
 * La source de vérité est l’ordre fourni dans `pages[]` (aucun tri implicite).
 *
 * Les defaults sont définis dans `defaults/site-index.ts`.
 */

import type { PageSummary } from "@compoz/core/domain/pages/entities/page";

/** Index global du site (ordre des pages). */
export interface SiteIndex {
  /** Ordre strict des pages (ne jamais trier automatiquement). */
  pages: ReadonlyArray<PageSummary>;

  /** Horodatage ISO UTC du dernier update. */
  updatedAt: string;
}
