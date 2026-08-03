/**
 * @file apps/studio/src/features/pages/blocks/hooks/delete-block-conflict-state.ts
 * @layer studio/features/pages/blocks/hooks
 * @description Typed pairing of a delete OCC conflict with the exact failed block target.
 */

import type { PageBlocksConflictDetails } from "@compoz/core/domain/pages/revisions/page-blocks.types";

export type DeleteBlockConflictState = Readonly<{
  details: PageBlocksConflictDetails;
  blockId: string;
}>;

export function createDeleteBlockConflictState(
  details: PageBlocksConflictDetails,
  blockId: string,
): DeleteBlockConflictState {
  return { details, blockId };
}
