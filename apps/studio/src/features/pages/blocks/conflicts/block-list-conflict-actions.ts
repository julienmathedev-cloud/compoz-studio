/**
 * @file apps/studio/src/features/pages/blocks/conflicts/block-list-conflict-actions.ts
 * @layer studio/features/pages/blocks/conflicts
 * @description Synchronous action lock for Page block list conflict decisions.
 */

export type BlockListConflictActionLock = Readonly<{
  isPending: () => boolean;
  run: (action: () => void | Promise<void>) => Promise<boolean>;
}>;

export function createBlockListConflictActionLock(): BlockListConflictActionLock {
  let pending = false;

  return {
    isPending: () => pending,
    run: async (action) => {
      if (pending) return false;
      pending = true;
      try {
        await action();
        return true;
      } finally {
        pending = false;
      }
    },
  };
}

export function areBlockListConflictActionsDisabled(input: Readonly<{
  isPending: boolean;
  isActionPending: boolean;
}>): boolean {
  return input.isPending || input.isActionPending;
}
