/**
 * @file packages/core/src/domain/pages/use-cases/reorder-page-children.types.ts
 * @layer core/domain
 *
 * @description
 * Types du use-case : reorder des enfants d’un parent (index-only, draft).
 *
 * @remarks
 * - Opération "structurelle" (ordre de navigation) : invalide status + details via `statusCache`.
 * - Le write est fait sur `SiteRepository.writeIndex()` (SoT index).
 */

import type { SiteRepository } from "@compoz/core/domain/site/ports/site-repository";
import type { SiteIndexDTO } from "@compoz/core/domain/site/dto";

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
