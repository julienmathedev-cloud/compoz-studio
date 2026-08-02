/**
 * @file apps/studio/src/features/settings/conflicts/settings-conflict-auto-rebase.ts
 * @layer studio/features/settings/conflicts
 * @description Bounded automatic rebase orchestration for deterministic Settings conflicts.
 */

import type { MutationOutcome } from "@compoz/core/domain/revisions/mutation-outcome";
import type { ConflictPresentationGroup } from "@compoz/studio/features/conflicts/conflict-presentation";
import { executeSettingsConflictApply } from "@compoz/studio/features/settings/conflicts/settings-conflict-execution";
import type { SettingsConflictFreshCurrent } from "@compoz/studio/features/settings/conflicts/settings-conflict-machine";
import {
  buildSettingsConflictMutationPlan,
  toSettingsConflictPresentation,
  type SettingsConflictMutationPlan,
  type SettingsConflictPresentationAdapter,
  type SettingsConflictSnapshot,
} from "@compoz/studio/features/settings/conflicts/settings-conflict-resolution";

type ExecutablePlan<T extends object> = Exclude<
  SettingsConflictMutationPlan<T>,
  { status: "incomplete" | "manual" }
>;

export type SettingsAutomaticRebaseResult<T extends object> =
  | Readonly<{
      status: "resolved";
      result: Readonly<{
        status: "saved" | "noChanges";
        value: T;
        fields: readonly string[];
      }>;
    }>
  | Readonly<{
      status: "interactive";
      current: SettingsConflictFreshCurrent<T>;
      groups: readonly ConflictPresentationGroup[];
    }>
  | Readonly<{ status: "freshReadFailed"; error: unknown }>
  | Readonly<{
      status: "retryFailed";
      error: unknown;
      current: SettingsConflictFreshCurrent<T>;
      plan: ExecutablePlan<T>;
    }>;

/** Empty and automatic-only presentations never require user intervention. */
export function isSettingsConflictAutomaticallyResolvable(
  groups: readonly ConflictPresentationGroup[],
): boolean {
  return groups.every((group) =>
    group.items.every((item) => item.resolutionMode === "automatic"),
  );
}

/**
 * Fetches one authoritative snapshot and performs at most one deterministic rebase mutation.
 * Interactive and second-conflict state publication remains owned by the calling hook.
 */
export async function executeSettingsAutomaticRebase<T extends object>(input: Readonly<{
  baseline: T;
  local: T;
  signal: AbortSignal;
  fetchCurrent: (signal: AbortSignal) => Promise<SettingsConflictFreshCurrent<T>>;
  presentation: SettingsConflictPresentationAdapter<T>;
  normalize?: (value: T) => T;
  adoptSnapshot: (value: T, revision: number) => () => void;
  mutate: (
    payload: Partial<T> | T,
    signal: AbortSignal,
  ) => Promise<Readonly<{ value: T; outcome: MutationOutcome }>>;
  commit: (value: T) => void;
  onMutationResult: (value: T, outcome: MutationOutcome) => void;
}>): Promise<SettingsAutomaticRebaseResult<T>> {
  let current: SettingsConflictFreshCurrent<T>;
  try {
    current = await input.fetchCurrent(input.signal);
  } catch (error: unknown) {
    return { status: "freshReadFailed", error };
  }

  const snapshot: SettingsConflictSnapshot<T> = {
    baseline: input.baseline,
    local: input.local,
    current: current.value,
    currentRevision: current.revision,
  };
  const groups = toSettingsConflictPresentation({
    ...input.presentation,
    snapshot,
    choices: {},
  });
  if (!isSettingsConflictAutomaticallyResolvable(groups)) {
    return { status: "interactive", current, groups };
  }

  const plan = buildSettingsConflictMutationPlan({
    snapshot,
    choices: {},
    normalize: input.normalize,
    fields: input.presentation,
  });
  if (plan.status === "incomplete" || plan.status === "manual") {
    return { status: "interactive", current, groups };
  }

  const execution = await executeSettingsConflictApply({
    plan,
    current,
    signal: input.signal,
    adoptSnapshot: input.adoptSnapshot,
    mutate: input.mutate,
    commit: input.commit,
    onMutationResult: input.onMutationResult,
  });
  if (execution.status === "error") {
    return { status: "retryFailed", error: execution.error, current, plan };
  }

  return {
    status: "resolved",
    result: {
      status: execution.outcome === "noChanges" ? "noChanges" : "saved",
      value: execution.value,
      fields: plan.status === "mutation" ? plan.fields : [],
    },
  };
}
