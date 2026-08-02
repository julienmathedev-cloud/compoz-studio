/**
 * @file apps/studio/src/features/settings/conflicts/settings-conflict-execution.ts
 * @layer studio/features/settings/conflicts
 * @description Injected effects for explicit Settings OCC adoption and apply actions.
 */

import type { ConflictActionExecutionResult } from "@compoz/studio/features/conflicts/conflict-presentation";
import type { SettingsConflictMutationPlan } from "@compoz/studio/features/settings/conflicts/settings-conflict-resolution";
import type { MutationOutcome } from "@compoz/core/domain/revisions/mutation-outcome";

type Current<T extends object> = Readonly<{
  value: T;
  revision: number;
  adoptCache: () => void;
}>;

export async function executeSettingsCurrentAdoption<T extends object>(input: Readonly<{
  current: Current<T>;
  adoptSnapshot: (value: T, revision: number) => () => void;
  commit: (value: T) => void;
}>): Promise<ConflictActionExecutionResult> {
  let rollback: () => void = () => void 0;
  try {
    rollback = input.adoptSnapshot(input.current.value, input.current.revision);
    input.current.adoptCache();
    input.commit(input.current.value);
    return { status: "success" };
  } catch {
    rollback();
    return { status: "error" };
  }
}

export type SettingsApplyExecutionResult<T extends object> =
  | Readonly<{ status: "success"; value: T; outcome: MutationOutcome }>
  | Readonly<{ status: "error"; error: unknown }>;

export async function executeSettingsConflictApply<T extends object>(input: Readonly<{
  plan: Exclude<SettingsConflictMutationPlan<T>, { status: "incomplete" | "manual" }>;
  current: Current<T>;
  signal: AbortSignal;
  adoptSnapshot: (value: T, revision: number) => () => void;
  mutate: (payload: Partial<T> | T, signal: AbortSignal) => Promise<Readonly<{ value: T; outcome: MutationOutcome }>>;
  commit: (value: T) => void;
  onMutationResult: (value: T, outcome: MutationOutcome) => void;
}>): Promise<SettingsApplyExecutionResult<T>> {
  let rollback: () => void = () => void 0;
  try {
    rollback = input.adoptSnapshot(input.current.value, input.current.revision);
    if (input.plan.status === "noChanges") {
      input.current.adoptCache();
      input.commit(input.current.value);
      input.onMutationResult(input.current.value, "noChanges");
      return { status: "success", value: input.current.value, outcome: "noChanges" };
    }
    const saved = await input.mutate(input.plan.payload, input.signal);
    input.commit(saved.value);
    input.onMutationResult(saved.value, saved.outcome);
    return { status: "success", value: saved.value, outcome: saved.outcome };
  } catch (error: unknown) {
    rollback();
    return { status: "error", error };
  }
}
