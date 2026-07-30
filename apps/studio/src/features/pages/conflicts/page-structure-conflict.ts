/**
 * @file apps/studio/src/features/pages/conflicts/page-structure-conflict.ts
 * @layer studio/features/pages/conflicts
 * @description Pure parent-only rebase for a draft structure OCC conflict.
 */

import type { DraftStructureConflictDetails } from "@compoz/infra/lib/get-draft-structure-conflict-details";
import { resolvePageStructureParent } from "@compoz/studio/features/pages/cache/page-snapshot";
import type { PageFormValues } from "@compoz/validation/pages/page-form";

type PageStructureConflictBaseline = Readonly<{
  values: PageFormValues;
  metaRevision: number;
}>;

export type PageStructureConflictRebase = Readonly<{
  baseline: PageStructureConflictBaseline;
  parentId: string | null;
}>;

export function rebasePageStructureConflictParent(input: Readonly<{
  baseline: PageStructureConflictBaseline;
  details: DraftStructureConflictDetails;
  pageId: string;
}>): PageStructureConflictRebase | null {
  const parentId = resolvePageStructureParent(
    input.details.current.index.pages,
    input.pageId,
    undefined,
  );
  if (parentId === undefined) return null;

  return {
    baseline: {
      ...input.baseline,
      values: {
        ...input.baseline.values,
        parentId,
      },
    },
    parentId,
  };
}
