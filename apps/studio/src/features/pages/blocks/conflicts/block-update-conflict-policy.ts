/**
 * @file apps/studio/src/features/pages/blocks/conflicts/block-update-conflict-policy.ts
 * @layer studio/features/pages/blocks/conflicts
 * @description Pure action policy for update-conflict UX.
 */

import type { PageBlocksConflictDetails } from "@compoz/core/domain/pages/revisions/page-blocks.types";
import type { BlockConflictChoice } from "@compoz/studio/features/pages/blocks/conflicts/resolve-block-conflict";

export function blockUpdateConflictPolicy(input: Readonly<{
  details: PageBlocksConflictDetails;
  choices: Readonly<Record<number, BlockConflictChoice>>;
}>) {
  const { details, choices } = input;
  const only = (kind: PageBlocksConflictDetails["conflicts"][number]["kind"]) =>
    details.conflicts.length > 0 &&
    details.conflicts.every((conflict) => conflict.kind === kind);
  const onlyFieldConflicts = only("fieldConflict");
  const requiresManualRebase =
    details.conflicts.some((conflict) =>
      [
        "blockTypeChanged",
        "cellTypeChanged",
        "itemTypeChanged",
        "collectionIncompatible",
        "orderIncompatible",
        "globalInvariant",
        "idReused",
        "anchorMissing",
      ].includes(conflict.kind),
    );

  return {
    canApply:
      onlyFieldConflicts &&
      details.conflicts.every((_, index) => choices[index] !== undefined),
    showApply: onlyFieldConflicts,
    showDeletedActions: only("blockDeleted"),
    showDeleteChangedActions: only("blockChangedBeforeDelete"),
    showAdoptCurrent:
      details.conflictKind === "contention" ||
      only("revisionAhead") ||
      requiresManualRebase,
    showKeepDraft: requiresManualRebase,
    requiresManualRebase,
  } as const;
}
