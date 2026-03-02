/**
 * @file apps/studio/src/features/dirty-guard/useAdminDirtyGuard.ts
 * @layer hooks/admin
 *
 * @description
 * Hook d’accès au Dirty Guard admin.
 */

import { AdminDirtyGuardContext } from "@compoz/studio/features/dirty-guard/AdminDirtyGuardProvider";
import { useContext } from "react";

export function useAdminDirtyGuard() {
  const ctx = useContext(AdminDirtyGuardContext);

  if (!ctx) {
    throw new Error(
      "useAdminDirtyGuard must be used within <AdminDirtyGuardProvider />",
    );
  }

  return ctx;
}
