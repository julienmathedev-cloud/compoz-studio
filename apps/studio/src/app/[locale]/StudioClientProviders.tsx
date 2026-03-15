"use client";

/**
 * @file apps/studio/src/app/[locale]/StudioClientProviders.tsx
 * @layer studio/app/providers
 *
 * @description
 * Providers client nécessaires au Studio (scope global).
 *
 * @remarks
 * - Doit être au-dessus de la Sidebar (SidebarProvider + Dirty Guard).
 * - Contient uniquement des providers UI (pas de fetch, pas de logique métier server).
 * - Expose aussi un TenantContext (tenantId résolu côté server) pour les query keys.
 */

import type { ReactNode } from "react";
import { useMemo } from "react";

import { TenantContext } from "@compoz/studio/features/admin/tenant/TenantContext";
import { ConfirmDialogProvider } from "@compoz/studio/features/confirm/ConfirmDialogProvider";
import { StudioDirtyGuardProvider } from "@compoz/studio/features/dirty-guard/StudioDirtyGuardProvider";
import { StudioThemeProvider } from "@compoz/studio/features/theme/StudioThemeProvider";
import { StudioThemeScope } from "@compoz/studio/features/theme/StudioThemeScope";
import { NotifyProvider } from "@compoz/studio/lib/ui/NotifyProvider";
import { SidebarProvider } from "@compoz/ui/components/ui/sidebar";

/* -------------------------------------------------------------------------- */
/* Providers                                                                  */
/* -------------------------------------------------------------------------- */

type StudioClientProvidersProps = Readonly<{
  children: ReactNode;

  /**
   * TenantId résolu côté server (requireSessionWithTenant()).
   * Important : reflète le cookie httpOnly "tenant actif" pour les admins.
   */
  tenantId: string;
  hasSidebar?: boolean;
}>;

export function StudioClientProviders({
  children,
  tenantId,
  hasSidebar = true,
}: StudioClientProvidersProps) {
  const value = useMemo(() => ({ tenantId }), [tenantId]);

  const content = hasSidebar ? (
    <SidebarProvider>{children}</SidebarProvider>
  ) : (
    children
  );

  return (
    <>
      {/* Applique la classe studio-theme sur <html> (Radix portals inclus). */}
      <StudioThemeScope />

      <TenantContext.Provider value={value}>
        <NotifyProvider>
          <StudioThemeProvider>
            <ConfirmDialogProvider>
              <StudioDirtyGuardProvider>{content}</StudioDirtyGuardProvider>
            </ConfirmDialogProvider>
          </StudioThemeProvider>
        </NotifyProvider>
      </TenantContext.Provider>
    </>
  );
}

StudioClientProviders.displayName = "StudioClientProviders";
