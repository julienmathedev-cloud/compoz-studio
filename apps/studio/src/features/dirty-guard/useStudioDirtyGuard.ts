/**
 * @file apps/studio/src/features/dirty-guard/useStudioDirtyGuard.ts
 * @layer hooks/shared
 *
 * @description
 * Hook d’accès au Dirty Guard Studio.
 *
 * @remarks
 * - Doit être utilisé sous `<StudioDirtyGuardProvider />`.
 * - Expose l’API : `setDirty`, `isDirty`, `getIsDirty`, `navigate`.
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
