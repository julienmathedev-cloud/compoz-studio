/**
 * @file apps/studio/src/features/settings/hooks/settings-load-deduplication.ts
 * @layer studio/features/settings/hooks
 * @description Pure reuse predicate for in-flight Settings loads.
 */

import type { ContentState } from "@compoz/core/constants/common/content-state";

export type InFlightSettingsLoad<T> = Readonly<{
  state: ContentState;
  promise: Promise<T>;
  ctrl: AbortController;
}>;

/** Reuses only a same-state load whose request has not been aborted. */
export function canReuseSettingsLoad<T>(
  inFlight: InFlightSettingsLoad<T> | null,
  state: ContentState,
): inFlight is InFlightSettingsLoad<T> {
  return (
    inFlight !== null &&
    inFlight.state === state &&
    !inFlight.ctrl.signal.aborted
  );
}
