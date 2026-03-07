/**
 * @file packages/core/src/domain/pages/use-cases/reorder-page-children.types.ts
 * @layer core/domain/pages/use-cases
 * @description
 * Types du use-case : réordonner les enfants d’un parent dans l’index (index-only, draft).
 *
 * @remarks
 * - Le write est fait sur `SiteRepository.writeIndex()` (SoT index).
 * - Toute invalidation/cache est gérée hors domaine (routes / adapters).
 */

import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";
import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";

export type ReorderPageChildrenDeps = Readonly<{
  site: SiteRepository;
  nowIso?: () => string;
}>;

export type ReorderPageChildrenInput = Readonly<{
  parentId: string;
  childIds: ReadonlyArray<string>;
}>;

export type ReorderPageChildrenResult = Readonly<{
  index: SiteIndexDTO;
}>;
