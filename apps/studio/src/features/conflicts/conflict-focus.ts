/**
 * @file apps/studio/src/features/conflicts/conflict-focus.ts
 * @layer studio/features/conflicts
 * @description Pure decisions for local conflict-panel focus management.
 */

import {
  isDecisionItem,
  type ConflictActionExecutionResult,
  type ConflictPresentationGroup,
  type ConflictResolutionChoice,
} from "@compoz/studio/features/conflicts/conflict-presentation";

export async function executeConflictAction(
  action: () => ConflictActionExecutionResult | Promise<ConflictActionExecutionResult>,
  onUnexpectedError: (error: unknown) => void,
): Promise<ConflictActionExecutionResult> {
  try {
    return await action();
  } catch (error: unknown) {
    onUnexpectedError(error);
    return { status: "error" };
  }
}

export function getFirstRequiredConflictChoiceId(
  groups: readonly ConflictPresentationGroup[],
  choices: Readonly<Record<string, ConflictResolutionChoice>> = {},
): string | null {
  for (const group of groups) {
    const unresolved = group.items.find(
      (item) => isDecisionItem(item) &&
        choices[item.id] === undefined &&
        item.choice === undefined,
    );
    if (unresolved) return unresolved.id;
  }
  return null;
}

export function shouldRestoreConflictTrigger(input: Readonly<{
  isConnected: boolean;
  disabled?: boolean;
  ariaDisabled?: string | null;
  hidden?: boolean;
  hasFocusMethod?: boolean;
  didNavigate?: boolean;
}>): boolean {
  return input.isConnected &&
    !input.disabled &&
    input.ariaDisabled !== "true" &&
    !input.hidden &&
    input.hasFocusMethod !== false &&
    !input.didNavigate;
}

export type DeferredConflictFocusTarget = Readonly<{
  isConnected: boolean;
  disabled?: boolean;
  ariaDisabled?: string | null;
  hidden?: boolean;
  hasFocusMethod?: boolean;
  focus: () => void;
}>;

export function scheduleConflictFocus(input: Readonly<{
  getTarget: () => DeferredConflictFocusTarget | null;
  schedule?: (task: () => void) => void;
}>): void {
  const schedule = input.schedule ?? queueMicrotask;
  schedule(() => {
    const target = input.getTarget();
    if (!target || !shouldRestoreConflictTrigger(target)) return;
    target.focus();
  });
}

function stableConflictToken(value: string): string {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  const readable = value.toLowerCase().replace(/[^a-z0-9_-]+/gu, "-").replace(/^-+|-+$/gu, "").slice(0, 32) || "conflict";
  return `${readable}-${(hash >>> 0).toString(36)}`;
}

export function conflictItemDomIdentity(
  conflictId: string,
  itemId: string,
): Readonly<{
  itemToken: string;
  statusId: string;
  radioName: string;
  firstChoiceToken: string;
}> {
  const conflictToken = stableConflictToken(conflictId);
  const itemToken = stableConflictToken(itemId);
  const identity = `${conflictToken}-${itemToken}`;
  return {
    itemToken,
    statusId: `conflict-${identity}-status`,
    radioName: `conflict-${identity}-choice`,
    firstChoiceToken: `conflict-${identity}-server`,
  };
}
