"use client";

/**
 * @file apps/studio/src/features/tenant/context/TenantContext.tsx
 * @layer app/tenant
 *
 * @description
 * Context + hook pour accéder au tenantId actif côté client.
 *
 * @remarks
 * - Le tenantId est résolu côté server via `requireSessionWithTenant()`
 * - Injecté dans `AdminClientProviders`
 * - Utilisé dans les hooks React Query pour construire les queryKeys
 */

import { createContext, useContext } from "react";

type TenantContextValue = Readonly<{
  tenantId: string;
}>;

export const TenantContext = createContext<TenantContextValue | null>(null);

/**
 * Hook pour obtenir le tenantId actif.
 *
 * @remarks
 * - Throw si utilisé hors provider
 */
export function useTenantId(): string {
  const ctx = useContext(TenantContext);
  console.log("useTenantId", ctx?.tenantId);
  const tenantId = String(ctx?.tenantId ?? "")
    .trim()
    .toLowerCase();

  if (!tenantId) {
    throw new Error("useTenantId: missing TenantContext (tenantId)");
  }

  return tenantId;
}
