/**
 * @file apps/studio/src/features/settings/conflicts/settings-conflict-machine.ts
 * @layer studio/features/settings/conflicts
 * @description Pure state machine used by the Settings OCC React controller.
 */

export type SettingsConflictFreshCurrent<T extends object> = Readonly<{
  value: T;
  revision: number;
  adoptCache: () => void;
}>;

type Session<T extends object> = Readonly<{
  conflictId: string;
  baseline: T;
  local: T;
  current?: SettingsConflictFreshCurrent<T>;
  error?: string;
}>;

export type SettingsConflictMachineState<T extends object> =
  | Readonly<{ phase: "idle" }>
  | (Session<T> & Readonly<{ phase: "loadingCurrent" | "ready" | "applying" | "adoptingCurrent" | "freshReadError" | "mutationError" | "secondConflict" }>);

export type SettingsConflictMachineEvent<T extends object> =
  | Readonly<{ type: "open"; conflictId: string; baseline: T; local: T }>
  | Readonly<{ type: "startFreshRead" }>
  | Readonly<{ type: "freshReadSucceeded"; current: SettingsConflictFreshCurrent<T> }>
  | Readonly<{ type: "freshReadFailed"; error: string }>
  | Readonly<{ type: "startApply" }>
  | Readonly<{ type: "startAdoptingCurrent" }>
  | Readonly<{ type: "mutationFailed"; error: string }>
  | Readonly<{ type: "validationFailed"; error: string }>
  | Readonly<{ type: "secondConflict"; baseline: T; local: T; error: string }>
  | Readonly<{ type: "complete" | "abandon" }>;

export function isSettingsConflictPending<T extends object>(state: SettingsConflictMachineState<T>): boolean {
  return state.phase === "loadingCurrent" || state.phase === "applying" || state.phase === "adoptingCurrent";
}

export function transitionSettingsConflict<T extends object>(
  state: SettingsConflictMachineState<T>,
  event: SettingsConflictMachineEvent<T>,
): SettingsConflictMachineState<T> {
  if (event.type === "open") {
    if (state.phase !== "idle") return state;
    return {
      phase: "loadingCurrent",
      conflictId: event.conflictId,
      baseline: event.baseline,
      local: event.local,
    };
  }
  if (state.phase === "idle") return state;

  switch (event.type) {
    case "startFreshRead":
      return state.phase === "freshReadError" || state.phase === "secondConflict"
        ? { ...state, phase: "loadingCurrent", error: undefined }
        : state;
    case "freshReadSucceeded":
      return state.phase === "loadingCurrent"
        ? { ...state, phase: "ready", current: event.current, error: undefined }
        : state;
    case "freshReadFailed":
      return state.phase === "loadingCurrent"
        ? { ...state, phase: "freshReadError", error: event.error }
        : state;
    case "startApply":
      return (state.phase === "ready" || state.phase === "mutationError") && state.current
        ? { ...state, phase: "applying", error: undefined }
        : state;
    case "startAdoptingCurrent":
      return (state.phase === "ready" || state.phase === "mutationError") && state.current
        ? { ...state, phase: "adoptingCurrent", error: undefined }
        : state;
    case "mutationFailed":
      return state.phase === "applying" || state.phase === "adoptingCurrent"
        ? { ...state, phase: "mutationError", error: event.error }
        : state;
    case "validationFailed":
      return state.phase === "ready" || state.phase === "mutationError"
        ? { ...state, error: event.error }
        : state;
    case "secondConflict":
      return state.phase === "applying"
        ? {
            ...state,
            phase: "secondConflict",
            baseline: event.baseline,
            local: event.local,
            current: undefined,
            error: event.error,
          }
        : state;
    case "complete":
      return state.phase === "applying" || state.phase === "adoptingCurrent"
        ? { phase: "idle" }
        : state;
    case "abandon":
      return isSettingsConflictPending(state) ? state : { phase: "idle" };
  }
}
