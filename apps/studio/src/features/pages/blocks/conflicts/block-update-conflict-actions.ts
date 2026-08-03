/**
 * @file apps/studio/src/features/pages/blocks/conflicts/block-update-conflict-actions.ts
 * @layer studio/features/pages/blocks/conflicts
 * @description Selects and executes update-conflict actions without routing contention through candidate resolution.
 */

import {
  CONFLICT_ACTION_ERROR,
  CONFLICT_ACTION_SUCCESS,
  type ConflictActionExecutionResult,
} from "@compoz/studio/features/conflicts/conflict-presentation";
import type { BlockConflictPanelScenario } from "@compoz/studio/features/pages/blocks/conflicts/block-conflict-presentation";
import type { BlockConflictChoice } from "@compoz/studio/features/pages/blocks/conflicts/resolve-block-conflict";

type ConflictCallback = () => void | Promise<void>;

async function complete(
  action: ConflictCallback | undefined,
): Promise<ConflictActionExecutionResult> {
  if (!action) return CONFLICT_ACTION_ERROR;
  await action();
  return CONFLICT_ACTION_SUCCESS;
}

export function executeBlockUpdateConflictChoice(input: Readonly<{
  scenarioKind: BlockConflictPanelScenario["kind"];
  allServer: boolean;
  indexedChoices: Readonly<Record<number, BlockConflictChoice>>;
  onAdoptCurrent?: ConflictCallback;
  onRetryDraft?: ConflictCallback;
  onResolve: (
    choices: Readonly<Record<number, BlockConflictChoice>>,
  ) => void | Promise<void>;
}>): Promise<ConflictActionExecutionResult> {
  if (
    input.scenarioKind === "contention" ||
    input.scenarioKind === "idReused" ||
    input.scenarioKind === "structural"
  ) {
    return complete(
      input.allServer ? input.onAdoptCurrent : input.onRetryDraft,
    );
  }
  if (input.allServer && input.onAdoptCurrent) {
    return complete(input.onAdoptCurrent);
  }
  return complete(() => input.onResolve(input.indexedChoices));
}
