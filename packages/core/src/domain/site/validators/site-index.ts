/**
 * @file packages/core/src/domain/site/validators/site-index.ts
 * @layer core/domain
 * @description
 * Validateur métier — invariant bloquant de `SiteIndex` : unicité des slugs dans `pages[]`.
 *
 * @remarks
 * - Ne gère ni l’ordre (helpers `site/index/*`), ni la présence de pages (warnings publish).
 * - Ne vérifie pas la cohérence slug ↔ page (responsabilité du module Pages).
 */

import { ERROR_CODES as EC } from "@compoz/core/domain/errors/codes";
import { DomainError } from "@compoz/core/domain/errors/domain-error";
import type { PageSummary } from "@compoz/core/domain/pages/entities/page";
import type { SiteIndex } from "@compoz/core/domain/site/entities/site-index";

type DupPositions = Readonly<{ value: string; positions: number[] }>;

/**
 * Détecte les doublons de slug dans une liste de `PageSummary` et
 * retourne, pour chaque slug dupliqué :
 * - sa valeur (`value`),
 * - la liste triée des positions où il apparaît.
 */
function findDuplicateSlugs(arr: ReadonlyArray<PageSummary>): DupPositions[] {
  const map = new Map<string, number[]>();

  // On agrège les positions de chaque slug dans la map.
  for (let i = 0; i < arr.length; i++) {
    const slug = String(arr[i]?.slug ?? "").trim();
    const bucket = map.get(slug);
    if (bucket) {
      bucket.push(i);
    } else {
      map.set(slug, [i]);
    }
  }

  const out: DupPositions[] = [];
  for (const [value, positions] of map) {
    if (positions.length > 1) {
      positions.sort((a, b) => a - b);
      out.push({ value, positions });
    }
  }
  return out;
}

/**
 * Invariant global : chaque slug doit être unique dans `pages[]`.
 *
 * @throws DomainError
 * - `EC.SITE_INDEX_DUPLICATE_SLUGS`
 */
export function assertSiteIndex(index: SiteIndex): void {
  const duplicateSlugs = findDuplicateSlugs(index.pages);

  if (duplicateSlugs.length === 0) return;

  throw new DomainError({
    code: EC.SITE_INDEX_DUPLICATE_SLUGS,
    message: EC.SITE_INDEX_DUPLICATE_SLUGS,
    details: {
      path: ["pages"],
      issues: { duplicateSlugs },
    },
  });
}
