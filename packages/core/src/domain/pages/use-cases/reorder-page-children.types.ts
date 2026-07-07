/**
 * @file packages/core/src/domain/pages/use-cases/reorder-page-children.types.ts
 * @layer core/domain/pages/use-cases
 * @description Contracts for reordering a parent's children in the draft index.
 * @remarks
 * Writes go through `SiteRepository.writeIndex()` as the index source of truth. Cache invalidation is handled outside the domain.
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
