"use client";

/**
 * @file apps/studio/src/app/[locale]/AdminClientProviders.tsx
 * @layer app/studio/providers
 *
 * @description
 * Providers client nécessaires à l’admin (scope global).
 *
 * @remarks
 * - Doit être au-dessus de la Sidebar (SidebarProvider + Dirty Guard).
 * - Contient uniquement des providers UI (pas de fetch, pas de logique métier server).
 * - Expose aussi un TenantContext (tenantId résolu côté server) pour les query keys.
 */

import { useMemo, type ReactNode } from "react";

import { AdminThemeProvider } from "@compoz/studio/features/theme/AdminThemeProvider";
import { AdminThemeScope } from "@compoz/studio/features/theme/AdminThemeScope";
import { ConfirmDialogProvider } from "@compoz/studio/features/confirm/ConfirmDialogProvider";
import { SidebarProvider } from "@compoz/ui/components/ui/sidebar";
import { AdminDirtyGuardProvider } from "@compoz/studio/features/dirty-guard/AdminDirtyGuardProvider";
import { NotifyProvider } from "@compoz/studio/lib/ui/NotifyProvider";
import { TenantContext } from "@compoz/studio/features/admin/context/TenantContext";

/* -------------------------------------------------------------------------- */
/* Providers                                                                  */
/* -------------------------------------------------------------------------- */

type AdminClientProvidersProps = Readonly<{
  children: ReactNode;

  /**
   * TenantId résolu côté server (requireSessionWithTenant()).
   * Important : reflète le cookie httpOnly "tenant actif" pour les admins.
   */
  tenantId: string;
}>;

export function AdminClientProviders({
  children,
  tenantId,
}: AdminClientProvidersProps) {
  const value = useMemo(
    () => ({
      tenantId: String(tenantId ?? "")
        .trim()
        .toLowerCase(),
    }),
    [tenantId],
  );

  return (
    <>
      {/* Applique la classe admin-theme sur <html> (Radix portals inclus). */}
      <AdminThemeScope />

      <TenantContext.Provider value={value}>
        <NotifyProvider>
          <AdminThemeProvider>
            <ConfirmDialogProvider>
              <AdminDirtyGuardProvider>
                <SidebarProvider>{children}</SidebarProvider>
              </AdminDirtyGuardProvider>
            </ConfirmDialogProvider>
          </AdminThemeProvider>
        </NotifyProvider>
      </TenantContext.Provider>
    </>
  );
}

AdminClientProviders.displayName = "AdminClientProviders";
