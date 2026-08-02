/**
 * @file apps/studio/src/features/pages/hooks/reorder-page-children-intent.ts
 * @layer studio/features/pages/hooks
 * @description Captures a child reorder OCC intent from one pre-mutation snapshot.
 */

import type { DraftSiteIndexWithRevisionDTO } from "@compoz/core/domain/site/dto";

export type ReorderPageChildrenIntent = Readonly<{
  parentId: string;
  baselineOrder: string[];
  localOrder: string[];
  expectedDraftStructureRevision: number;
}>;

export function createReorderPageChildrenIntent(
  snapshot: DraftSiteIndexWithRevisionDTO,
  parentId: string,
  localOrder: ReadonlyArray<string>,
): ReorderPageChildrenIntent {
  return {
    parentId,
    baselineOrder: snapshot.index.pages
      .filter((page) => page.parentId === parentId)
      .map((page) => page.id),
    localOrder: [...localOrder],
    expectedDraftStructureRevision: snapshot.draftStructureRevision,
  };
}
