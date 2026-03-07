/**
 * @file packages/core/src/domain/pages/use-cases/helpers/apply-page-defaults.ts
 * @layer core/domain/pages/use-cases/helpers
 * @description
 * Helpers pour l’utilisation de `applyDefault` sur les pages.
 */

import type { PageSitemap } from "@compoz/core/domain/pages/entities/page";

/**
 * Applique des valeurs par défaut pour le sitemap d’une page.
 *
 * @param p - Patch partiel éventuel (include, changefreq, priority).
 * @returns Un objet `PageSitemap` complet (aucun champ undefined).
 *
 * @remarks
 * Defaults actuels :
 * - include    : true
 * - changefreq : "weekly"
 * - priority   : 0.7
 */
export function applySitemapDefaults(p?: Partial<PageSitemap>): PageSitemap {
  return {
    include: p?.include ?? true,
    changefreq: p?.changefreq ?? "weekly",
    priority: p?.priority ?? 0.7,
  };
}
