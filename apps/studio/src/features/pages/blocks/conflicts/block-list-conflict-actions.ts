/**
 * @file apps/studio/src/features/pages/blocks/conflicts/block-list-conflict-actions.ts
 * @layer studio/features/pages/blocks/conflicts
 * @description Completion helper for Page block-list conflict mutations.
 */

export async function completeBlockListConflictMutation(input: Readonly<{
  mutate: () => void | Promise<void>;
  clearConflict: () => void;
}>): Promise<void> {
  await input.mutate();
  input.clearConflict();
}
