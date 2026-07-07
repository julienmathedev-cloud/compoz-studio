/**
 * @file apps/studio/src/features/dirty-guard/useStudioDirtyGuard.ts
 * @layer studio/features/dirty-guard
 *
 * @description
 * Hook exposing the Studio Dirty Guard context API.
 *
 * @remarks
 * - Must be used under `<StudioDirtyGuardProvider />`.
 * - Throws when used outside the provider to catch missing provider wiring early.
 */

import { useContext } from "react";

import { StudioDirtyGuardContext } from "@compoz/studio/features/dirty-guard/StudioDirtyGuardProvider";

export function useStudioDirtyGuard() {
  const ctx = useContext(StudioDirtyGuardContext);

  if (!ctx) {
    throw new Error(
      "useStudioDirtyGuard must be used within <StudioDirtyGuardProvider />",
    );
  }

  return ctx;
}

useStudioDirtyGuard.displayName = "useStudioDirtyGuard";
