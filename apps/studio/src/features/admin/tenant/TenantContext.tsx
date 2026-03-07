"use client";

/**
 * @file apps/studio/src/features/admin/tenant/TenantContext.tsx
 * @layer studio/features/admin/context
 *
 * @description
 * Context + hook client pour accéder au `tenantId` actif.
 *
 * @remarks
 * - Le tenantId est résolu côté server via `requireSessionWithTenant()`.
 * - Injecté dans `AdminClientProviders`.
 * - Utilisé dans les hooks React Query pour construire les `queryKeys`.
 */

import { createContext, useContext } from "react";

import { requireTenantId } from "@compoz/ui/lib/tenant-id";

type TenantContextValue = Readonly<{
  tenantId: string;
}>;

export const TenantContext = createContext<TenantContextValue | null>(null);

/**
 * Hook pour obtenir le tenantId actif.
 *
 * @remarks
 * - Throw si utilisé hors provider.
 */
export function useTenantId(): string {
  const ctx = useContext(TenantContext);

  return requireTenantId(ctx?.tenantId, "TenantContext (tenantId)");
}
