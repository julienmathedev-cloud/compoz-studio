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
 * - Contient uniquement des providers UI.
 * - Ne contient pas de fetch ni de logique métier server.
 * - Expose aussi un WebsiteContext avec le Website actif résolu côté server,
 *   utilisé notamment pour les query keys et les scopes client.
 */

import type { ReactNode } from "react";
import { useMemo } from "react";

import { WebsiteContext } from "@compoz/studio/features/admin/website/WebsiteContext";
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
   * Website.id résolu côté server via requireSessionWithWebsite().
   *
   * Pour les admins, cette valeur reflète le Website actif sélectionné.
   * À terme, elle doit être portée par le cookie httpOnly
   * "compoz_active_website".
   */
  websiteId: string;

  /**
   * Website.slug public canonique du Website actif.
   *
   * Utilisé pour les URLs publiques, preview, skins et features runtime.
   */
  websiteSlug: string;

  /**
   * Website.name affichable du Website actif.
   */
  websiteName?: string;

  hasSidebar?: boolean;
}>;

export function StudioClientProviders({
  children,
  websiteId,
  websiteSlug,
  websiteName,
  hasSidebar = true,
}: StudioClientProvidersProps) {
  const value = useMemo(
    () => ({
      websiteId,
      websiteSlug,
      websiteName,
    }),
    [websiteId, websiteSlug, websiteName],
  );

  const content = hasSidebar ? (
    <SidebarProvider>{children}</SidebarProvider>
  ) : (
    children
  );

  return (
    <>
      {/* Applique la classe studio-theme sur <html> (Radix portals inclus). */}
      <StudioThemeScope />

      <WebsiteContext.Provider value={value}>
        <NotifyProvider>
          <StudioThemeProvider>
            <ConfirmDialogProvider>
              <StudioDirtyGuardProvider>{content}</StudioDirtyGuardProvider>
            </ConfirmDialogProvider>
          </StudioThemeProvider>
        </NotifyProvider>
      </WebsiteContext.Provider>
    </>
  );
}

StudioClientProviders.displayName = "StudioClientProviders";
